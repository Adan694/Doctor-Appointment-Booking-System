const formatMessage = ({ action, appointment, doctor, patient, recipient }) => {
  let message = '';
  const appointmentDate = new Date(appointment.date).toLocaleDateString();
  const appointmentTime = appointment.time;

  switch (action) {
    case 'book':
      if (recipient === 'patient') {
        message = `📅 Appointment Confirmation

Dear ${patient.name},

Your appointment has been successfully booked with:

Doctor: Dr. ${doctor.name}  
Date: ${appointmentDate}  
Time: ${appointmentTime}

Please arrive at least 10 minutes before your scheduled time and bring any necessary medical records.

Thank you,  
DocAssist`;
      } else if (recipient === 'doctor') {
        message = `📅 New Appointment Booked

Dear Dr. ${doctor.name},

A new appointment has been booked with:

Patient: ${patient.name}  
Date: ${appointmentDate}  
Time: ${appointmentTime}

Please prepare accordingly.

Thank you,  
DocAssist`;
      }
      break;

    case 'cancel-patient':
  if (recipient === 'doctor') {
    message = `❌ Patient-Initiated Cancellation

Dr. ${doctor.name},

${patient.name} has cancelled their appointment:

Original Schedule:
Date: ${appointmentDate}
Time: ${appointmentTime}

This slot is now available for other bookings.

DocAssist Team`;
  } else if (recipient === 'patient') {
    message = `🗓️ Appointment Cancellation Confirmed

${patient.name},

You've successfully cancelled your appointment with Dr. ${doctor.name}.

Cancelled Appointment Details:
Date: ${appointmentDate}
Time: ${appointmentTime}

To book a new appointment, please visit our portal.

DocAssist Support`;
  }
  break;

case 'cancel-doctor':
  if (recipient === 'patient') {
    message = `⚠️ Doctor-Initiated Cancellation

${patient.name},

We regret to inform you that Dr. ${doctor.name} has cancelled your scheduled appointment.

Affected Appointment:
Date: ${appointmentDate}
Time: ${appointmentTime}

Please contact our support team to reschedule. We apologize for any inconvenience.

DocAssist Support`;
  } else if (recipient === 'doctor') {
    message = `⚕️ Cancellation Record

Dr. ${doctor.name},

You've cancelled the appointment with ${patient.name}.

Appointment Details:
Date: ${appointmentDate}
Time: ${appointmentTime}

The patient has been automatically notified.

DocAssist System`;
  }
  break;

    case 'reschedule-doctor':
      if (recipient === 'patient') {
        message = `🔄 Appointment Rescheduling Notice

Dear ${patient.name},

Your appointment with Dr. ${doctor.name} has been rescheduled.

New Appointment Details:  
Date: ${appointmentDate}  
Time: ${appointmentTime}  

If the new time is inconvenient, please contact our office to arrange an alternative slot.

Kind regards,  
DocAssist`;
      } else if (recipient === 'doctor') {
        message = `ℹ Appointment Rescheduled

Dear Dr. ${doctor.name},

The appointment with:

Patient: ${patient.name}  

has been rescheduled to:

Date: ${appointmentDate}  
Time: ${appointmentTime}

Kind regards,  
DocAssist`;
      }
      break;

    case 'complete':
      if (recipient === 'patient') {
        message = `✅ Appointment Completed

Dear ${patient.name},

Your appointment with Dr. ${doctor.name} on ${appointmentDate} at ${appointmentTime} has been marked as completed.

Thank you for choosing our service.

Kind regards,  
DocAssist`;
      } else if (recipient === 'doctor') {
        message = `✅ Appointment Completed

Dear Dr. ${doctor.name},

The appointment with:

Patient: ${patient.name}  

on ${appointmentDate} at ${appointmentTime} has been marked as completed.

Kind regards,  
DocAssist`;
      }
      break;

    default:
      message = `ℹ Appointment Update:\nPatient: ${patient.name}\nDoctor: ${doctor.name}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
  }

  return message;
};

module.exports = formatMessage;
