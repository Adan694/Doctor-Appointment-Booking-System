const cron = require('node-cron');
const Booking = require('../models/Booking');
const notifyAll = require('../Utils/notifyAll');

// Run every 15 minutes to send reminders
cron.schedule('*/15 * * * *', async () => {
  console.log('📧 Sending check-in reminders...', new Date().toLocaleString());
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  try {
    const upcomingDeadlines = await Booking.find({
      checkInDeadline: { 
        $gte: now, 
        $lte: oneHourFromNow 
      },
      arrivalTime: null,
      notifiedForCheckIn: false,
      status: { $in: ['confirmed', 'pending'] }
    }).populate('patientId');
    
    for (const appointment of upcomingDeadlines) {
      const minutesUntilDeadline = Math.round((appointment.checkInDeadline - now) / 60000);
      
      if (appointment.patientId) {
        await notifyAll({
          patient: appointment.patientId,
          message: `⏰ REMINDER: Your appointment is at ${appointment.time}. You MUST check-in by ${appointment.checkInDeadline.toLocaleTimeString()} (${minutesUntilDeadline} minutes from now). If you don't check-in by then, your slot will be given to someone else!`
        });
      }
      
      appointment.notifiedForCheckIn = true;
      await appointment.save();
      
      console.log(`📨 Reminder sent to ${appointment.name} for ${appointment.time}`);
    }
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
  }
});

console.log('✅ Check-in reminder cron job initialized');