const cron = require('node-cron');
const Booking = require('../models/Booking');
const { User } = require('../models/users');
const Doctor = require('../models/doctors');
const notifyAll = require('../Utils/notifyAll');

// Try to load WaitingList, but don't fail if it doesn't exist
let WaitingList;
try {
  WaitingList = require('../models/WaitingList');
  console.log('✅ WaitingList model loaded');
} catch (error) {
  console.log('⚠️ WaitingList model not found, waiting list functionality disabled');
  WaitingList = null;
}

// Helper function to generate token (copy from your bookingController)
async function generateToken(doctorId, date) {
  let token;
  let exists = true;
  while (exists) {
    token = Math.floor(100 + Math.random() * 900);
    exists = await Booking.findOne({ doctorId, date: new Date(date), token });
  }
  return token.toString();
}

// Run every minute to check for missed check-in deadlines
cron.schedule('* * * * *', async () => {
  console.log('🔍 Checking for patients who missed check-in deadline...', new Date().toLocaleString());
  
  const now = new Date();
  
  try {
    // Find appointments where check-in deadline has passed
    const missedDeadlineAppointments = await Booking.find({
      checkInDeadline: { $lte: now },
      arrivalTime: null,
      status: { $in: ['confirmed', 'pending'] }
    }).populate('patientId doctorId');
    
    if (missedDeadlineAppointments.length === 0) {
      return;
    }
    
    console.log(`📋 Found ${missedDeadlineAppointments.length} appointments missing check-in deadline`);
    
    for (const appointment of missedDeadlineAppointments) {
      console.log(`⏰ MISSED DEADLINE: ${appointment.name} - Appointment at ${appointment.time}`);
      
      // Mark as missed
      appointment.status = 'missed';
      appointment.noShowNotifiedAt = now;
      await appointment.save();
      
      // Update patient's missed appointments count
      if (appointment.patientId) {
        const patient = await User.findById(appointment.patientId._id);
        if (patient) {
          patient.missedAppointments = (patient.missedAppointments || 0) + 1;
          
          if (patient.missedAppointments >= 5 && !patient.isBlocked) {
            patient.isBlocked = true;
            patient.blockedUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            await patient.save();
            
            await notifyAll({
              patient,
              message: `❌ You have been BLOCKED from booking appointments for 3 days due to ${patient.missedAppointments} missed appointments.`
            });
          } else {
            await patient.save();
            
            if (patient.missedAppointments === 4) {
              await notifyAll({
                patient,
                message: `⚠️ WARNING: This is your ${patient.missedAppointments}th missed appointment! ONE MORE missed appointment will BLOCK your account.`
              });
            } else {
              await notifyAll({
                patient,
                message: `❌ You missed your appointment at ${appointment.time}. (Missed count: ${patient.missedAppointments}/5)`
              });
            }
          }
        }
      }
      
      // Check waiting list for replacement (only if WaitingList model exists)
      let assignedToWaiting = false;
      
      if (WaitingList) {
        let waitingPatients = await WaitingList.find({
          doctorId: appointment.doctorId._id,
          status: 'waiting'
        })
        .populate('patientId')
        .sort({ priority: 1, requestedAt: 1 });
        
        // Filter by preferredDate matching appointment date
        const appointmentDateStr = new Date(appointment.date).toISOString().split('T')[0];
        waitingPatients = waitingPatients.filter(wp => {
            if (!wp.preferredDate) return true;
            const prefDateStr = new Date(wp.preferredDate).toISOString().split('T')[0];
            return prefDateStr === appointmentDateStr;
        });
        
        if (waitingPatients.length > 0) {
          const nextPatient = waitingPatients[0];
          console.log(`🔄 REASSIGNING slot to waiting patient: ${nextPatient.patientId.name}`);
          
          // Calculate new check-in deadline
          const appointmentDateTime = new Date(appointment.date);
          const [timeStr, ampm] = appointment.time.split(" ");
          let [hours, minutes] = timeStr.split(":").map(Number);
          if (ampm === "PM" && hours !== 12) hours += 12;
          if (ampm === "AM" && hours === 12) hours = 0;
          appointmentDateTime.setHours(hours, minutes, 0, 0);
          
          const newCheckInDeadline = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
          
          // Create new appointment for waiting patient
          const newBooking = new Booking({
            patientId: nextPatient.patientId._id,
            doctorId: appointment.doctorId._id,
            date: appointment.date,
            time: appointment.time,
            name: nextPatient.patientId.name,
            phone: nextPatient.patientId.phone,
            email: nextPatient.patientId.email,
            age: nextPatient.patientId.age || '',
            status: 'confirmed',
            token: await generateToken(appointment.doctorId._id, appointment.date),
            checkInDeadline: newCheckInDeadline
          });
          
          await newBooking.save();
          
          // Update waiting list
          nextPatient.status = 'assigned';
          await nextPatient.save();
          
          // Notify the waiting patient
          // ========== NOTIFICATION TO PATIENT - SLOT ASSIGNED ==========
const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

const checkInTime = newCheckInDeadline.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit'
});

await notifyAll({
  patient: nextPatient.patientId,
  message: `🎉 YOUR APPOINTMENT HAS BEEN BOOKED!

Dear ${nextPatient.patientId.name},

Good news! A slot has opened up and your appointment has been automatically booked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 APPOINTMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 Doctor: Dr. ${appointment.doctorId.name}
📆 Date: ${formattedDate}
⏰ Time: ${appointment.time}
🔑 Your Token Number: ${newBooking.token}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANT - CHECK-IN DEADLINE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST check-in by: ${checkInTime}
(30 minutes before your appointment time)

If you arrive after this time, your slot will be given to someone else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Arrive at the hospital before ${checkInTime}
2. Show your token number: ${newBooking.token}
3. Meet Dr. ${appointment.doctorId.name}

❌ If you cannot make it, please cancel at least 30 minutes before the appointment.

Thank you for choosing DocAssist!`
});
          
          // Notify doctor
          await notifyAll({
            doctor: appointment.doctorId,
            message: `✅ Patient ${nextPatient.patientId.name} from waiting list has been auto-assigned to the ${appointment.time} slot (replacing no-show ${appointment.name})`
          });
          
          assignedToWaiting = true;
        }
      }
      
      // If no waiting list patient assigned, restore the slot
      if (!assignedToWaiting) {
        const formattedDate = appointment.date.toISOString().split('T')[0];
        await Doctor.updateOne(
          { _id: appointment.doctorId._id, "availabilitySlots.date": formattedDate },
          { $push: { "availabilitySlots.$.slots": appointment.time } }
        );
        
        console.log(`📅 Slot restored for doctor ${appointment.doctorId.name} at ${appointment.time}`);
        
        await notifyAll({
          doctor: appointment.doctorId,
          message: `⚠️ Patient ${appointment.name} missed the check-in deadline for ${appointment.time}. No waiting list patients available. Slot has been reopened.`
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in no-show cron job:', error);
  }
});

console.log('✅ No-show detection cron job initialized');