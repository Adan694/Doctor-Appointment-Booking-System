const formatMessage = ({ action, appointment, doctor, patient }) => {
  let message = '';
  const appointmentDate = new Date(appointment.date).toLocaleDateString();
  const appointmentTime = appointment.time;

  switch (action) {
    case 'book':
      message = `📅 New Appointment Booked:\nPatient: ${patient.name}\nDoctor: ${doctor.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
      break;

    case 'cancel-patient':
      message = `❌ Appointment Cancelled by Patient:\nPatient: ${patient.name}\nDoctor: ${doctor.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
      break;

    case 'cancel-doctor':
      message = `❌ Appointment Cancelled by Doctor:\nDoctor: ${doctor.name}\nPatient: ${patient.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
      break;

    case 'reschedule-doctor':
      message = `🔄 Appointment Rescheduled by Doctor:\nDoctor: ${doctor.name}\nPatient: ${patient.name}\nNew Date: ${appointmentDate}\nNew Time: ${appointmentTime}`;
      break;

    case 'reschedule-admin':
      message = `🔄 Appointment Rescheduled by Admin:\nDoctor: ${doctor.name}\nPatient: ${patient.name}\nNew Date: ${appointmentDate}\nNew Time: ${appointmentTime}`;
      break;

    default:
      message = `ℹ Appointment Update:\nPatient: ${patient.name}\nDoctor: ${doctor.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
  }

  return message;
};

module.exports = formatMessage;
