const formatMessage = ({ action, appointment, doctor, patient }) => {
  let message = '';
  const appointmentDate = new Date(appointment.date).toLocaleDateString();
  const appointmentTime = appointment.time;

  switch (action) {
    case 'book':
      message = `📅 Appointment Confirmation

Dear ${patient.name},

Your appointment has been successfully booked with:

Doctor: Dr. ${doctor.name}  
Date: ${appointmentDate}  
Time: ${appointmentTime}

Please arrive at least 10 minutes before your scheduled time and bring any necessary medical records.

Thank you,  
DocAssist`;
      break;

    case 'cancel-patient':
      message = `❌ Appointment Cancellation Notice

Dear ${doctor.name},

Please be informed that the following appointment has been cancelled by the patient:

Patient: ${patient.name}  
Date: ${appointmentDate}  
Time: ${appointmentTime}

Kind regards,  
DocAssist`;
      break;

    case 'cancel-doctor':
      message = `❌ Appointment Cancellation Notice

Dear ${patient.name},

We regret to inform you that your upcoming appointment has been cancelled by Dr. ${doctor.name}.

Details of the cancelled appointment:  
Date: ${appointmentDate}  
Time: ${appointmentTime}  

Please contact our office to reschedule at your earliest convenience.

Kind regards,  
DocAssist`;
      break;

    case 'reschedule-doctor':
      message = `🔄 Appointment Rescheduling Notice

Dear ${patient.name},

Your appointment with Dr. ${doctor.name} has been rescheduled.

New Appointment Details:  
Date: ${appointmentDate}  
Time: ${appointmentTime}  

If the new time is inconvenient, please contact our office to arrange an alternative slot.

Kind regards,  
DocAssist`;
      break;

    default:
      message = `ℹ Appointment Update:\nPatient: ${patient.name}\nDoctor: ${doctor.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
  }

  return message;
};

module.exports = formatMessage;
