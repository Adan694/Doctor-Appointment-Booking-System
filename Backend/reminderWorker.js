const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const sendEmail = require('./Utils/sendEmail');
const Booking = require('./models/booking'); // Adjust path if your file is named differently
const {User} = require('./models/users');
const Doctor = require('./models/doctors');


function convertTo24Hour(timeStr) {
  timeStr = timeStr.replace(/"/g, '').trim();

  if (!timeStr.includes(" ")) {
    timeStr = timeStr.replace(/(AM|PM)/, " $1");
  }

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  if (modifier === "PM" && hours !== "12") {
    hours = String(Number(hours) + 12);
  }
  if (modifier === "AM" && hours === "12") {
    hours = "00";
  }
  return `${hours}:${minutes}`;
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(" Reminder worker connected to MongoDB");
}).catch((err) => {
  console.error(" MongoDB connection error:", err.message);
});

cron.schedule('* * * * *', async () => {
  const now = new Date();

  console.log(` Running reminder job at: ${now.toLocaleTimeString()}`);
  try {
    const appointments = await Booking.find({
      status: 'pending',
      $or: [
        { reminderSent24hr: false },
        { reminderSent30min: false }
      ]
    });

    console.log(`Appointments to check: ${appointments.length}`);

    for (const appt of appointments) {
      const time24 = convertTo24Hour(appt.time);
      const dateOnly = new Date(appt.date).toISOString().split('T')[0];
      const appointmentDateTime = new Date(`${dateOnly}T${time24}:00`);
      const timeDiff = appointmentDateTime - now;

      if (timeDiff <= 0) continue; 

      const patient = await User.findById(appt.patientId);
      const doctor = await Doctor.findById(appt.doctorId);
      if (!patient || !doctor) continue;

      const time = `${appt.date.toDateString()} at ${appt.time}`;

      //  30-minute Reminder
if (
  timeDiff <= 30 * 60 * 1000 &&
  timeDiff > 25 * 60 * 1000 &&
  !appt.reminderSent30min
) {
        const patientMsg = ` 30-Min Reminder: You have an appointment with Dr. ${doctor.name} on ${time}`;
        const doctorMsg = ` 30-Min Reminder: You have an appointment with ${patient.name} on ${time}`;

        // await sendEmail(patient.email, 'Appointment Reminder - 30 Mins', patientMsg);
const patientEmail = appt.email || patient.email;

await sendEmail(patientEmail, 'Appointment Reminder - 30 Mins', patientMsg);
        await sendEmail(doctor.email, 'Appointment Reminder - 30 Mins', doctorMsg);
  const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const patientConsoleMsg = ` Patient Reminder: You have an appointment with Dr. ${doctor.name} on ${formattedDate} at ${appt.time}`;
  const doctorConsoleMsg = ` Doctor Reminder: You have an appointment with ${patient.name} on ${formattedDate} at ${appt.time}`;

        console.log(` 30-min reminder sent to ${patientEmail} and ${doctor.email}`);
        console.log(patientConsoleMsg);
console.log(doctorConsoleMsg);

        appt.reminderSent30min = true;
        await appt.save();
      }
else if (
  timeDiff > 23 * 60 * 60 * 1000 &&  // more than 23 hours away
  timeDiff <= 24 * 60 * 60 * 1000 && // less than or equal to 24 hours away
  !appt.reminderSent24hr
) {
  const patientMsg = `24-Hour Reminder: You have an appointment with Dr. ${doctor.name} on ${time}`;
  const doctorMsg = ` 24-Hour Reminder: You have an appointment with ${patient.name} on ${time}`;

  // await sendEmail(patient.email, 'Appointment Reminder - 24 Hours', patientMsg);
  const patientEmail = appt.email || patient.email;

await sendEmail(patientEmail, 'Appointment Reminder - 24 Hours', patientMsg);

  await sendEmail(doctor.email, 'Appointment Reminder - 24 Hours', doctorMsg);
  
  const formattedDate = new Date(appt.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const patientConsoleMsg = ` Patient Reminder: You have an appointment with Dr. ${doctor.name} on ${formattedDate} at ${appt.time}`;
  const doctorConsoleMsg = ` Doctor Reminder: You have an appointment with ${patient.name} on ${formattedDate} at ${appt.time}`;

        console.log(`24-hr reminder sent to ${patientEmail} and ${doctor.email}`);
        console.log(patientConsoleMsg);
console.log(doctorConsoleMsg);

        appt.reminderSent24hr = true;
        await appt.save();
      }
    }
  } catch (err) {
    console.error(" Reminder job failed:", err.message);
  }
});

