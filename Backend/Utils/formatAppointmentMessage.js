const formatMessage = ({ action, appointment, doctor, patient, recipient }) => {
  let message = '';

  // Safe fallbacks
  const patientName = patient?.name || 'the patient';
  const doctorName = doctor?.name || 'the doctor';

  const appointmentDate = appointment?.date
    ? new Date(appointment.date).toLocaleDateString()
    : 'N/A';

  const appointmentTime = appointment?.time || 'N/A';

  switch (action) {
    // ---------------- BOOK ----------------
    case 'book':
      if (recipient === 'patient') {
        message = `📅 Appointment Confirmation

Dear ${patientName},

Your appointment has been successfully booked with:

Doctor: Dr. ${doctorName}  
Date: ${appointmentDate}  
Time: ${appointmentTime}
Age: ${patient.age || 'N/A'}


Please arrive at least 10 minutes before your scheduled time and bring any necessary medical records.

Thank you,  
DocAssist`;
      } else if (recipient === 'doctor') {
        message = `📅 New Appointment Booked

Dear Dr. ${doctorName},

A new appointment has been booked with:

Patient: ${patientName}  
Phone: ${patient.phone || 'N/A'}  
Date: ${appointmentDate}  
Time: ${appointmentTime}
Age: ${patient.age || 'N/A'}


Please prepare accordingly.

Thank you,  
DocAssist`;
      } else if (recipient === 'admin') {
        message = `📢 New Appointment Created

Admin,

A new appointment has been booked.

👤 Patient: ${patientName}  
👨‍⚕️ Doctor: ${doctorName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}


DocAssist System`;
      }
      break;

    // ---------------- CANCELLED BY PATIENT ----------------
   case 'cancel-patient':
  if (recipient === 'doctor') {
    message = `❌ Patient-Initiated Cancellation

Dr. ${doctorName},

${patientName} has cancelled their appointment:

Original Schedule:
Date: ${appointmentDate}
Time: ${appointmentTime}

This slot is now available for other bookings.

DocAssist Team`;
  } else if (recipient === 'patient') {
    message = `🗓️ Appointment Cancellation Confirmed

${patientName},

You've successfully cancelled your appointment with Dr. ${doctorName}.

Cancelled Appointment Details:
Date: ${appointmentDate}
Time: ${appointmentTime}

To book a new appointment, please visit our portal.

DocAssist Support`;
  } else if (recipient === 'admin') {
    message = `📋 Patient Cancelled Appointment

Admin,

The following appointment was cancelled by the patient:

👤 Patient: ${patientName}  
👨‍⚕️ Doctor: ${doctorName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

Please update records accordingly.

DocAssist System`;
  }
  break;

case 'cancel-doctor':
  if (recipient === 'patient') {
    message = `⚠️ Doctor-Initiated Cancellation

${patientName},

We regret to inform you that Dr. ${doctorName} has cancelled your scheduled appointment.

Affected Appointment:
Date: ${appointmentDate}
Time: ${appointmentTime}

Please contact our support team to reschedule. We apologize for any inconvenience.

DocAssist Support`;
  } else if (recipient === 'doctor') {
    message = `⚕️ Cancellation Record

Dr. ${doctorName},

You've cancelled the appointment with ${patientName}.

Appointment Details:
Date: ${appointmentDate}
Time: ${appointmentTime}

The patient has been automatically notified.

DocAssist System`;
  } else if (recipient === 'admin') {
    message = `📋 Doctor Cancelled Appointment

Admin,

The following appointment was cancelled by the doctor:

👨‍⚕️ Doctor: ${doctorName}  
👤 Patient: ${patientName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

Patient has been notified automatically.

DocAssist System`;
  }
  break;

    // ---------------- RESCHEDULED BY DOCTOR ----------------
   case 'reschedule-doctor':
  if (recipient === 'patient') {
    message = `🔄 Appointment Rescheduling Notice

Dear ${patientName},

Your appointment with Dr. ${doctorName} has been rescheduled.

New Appointment Details:  
Date: ${appointmentDate}  
Time: ${appointmentTime}  

If the new time is inconvenient, please contact our office to arrange an alternative slot.

Kind regards,  
DocAssist`;
  } else if (recipient === 'doctor') {
    message = `ℹ Appointment Rescheduled

Dear Dr. ${doctorName},

The appointment with:

Patient: ${patientName}  

has been rescheduled to:

Date: ${appointmentDate}  
Time: ${appointmentTime}

Kind regards,  
DocAssist`;
  } else if (recipient === 'admin') {
    message = `📋 Doctor Rescheduled Appointment

Admin,

Dr. ${doctorName} has rescheduled an appointment.

👤 Patient: ${patientName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

Please ensure both parties are aligned.

DocAssist System`;
  }
  break;

case 'reschedule-admin':
  if (recipient === 'patient') {
    message = `🔄 Appointment Rescheduling Notice

Dear ${patientName},

Your appointment with Dr. ${doctorName} has been rescheduled by our clinic administrator.

📅 New Appointment Details:  
Date: ${appointmentDate}  
Time: ${appointmentTime}  

If this time is not convenient, please reach out to our office to arrange another slot.

Kind regards,  
DocAssist`;
  } else if (recipient === 'doctor') {
    message = `ℹ Appointment Rescheduled by Admin

Dear Dr. ${doctorName},

The following appointment has been rescheduled by the administrator:

👤 Patient: ${patientName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

Please review your updated schedule.

Kind regards,  
DocAssist`;
  } else if (recipient === 'admin') {
    message = `✅ Admin Confirmation: Appointment Rescheduled

Dear Admin,

You have successfully rescheduled the following appointment:

👤 Patient: ${patientName}  
👨‍⚕️ Doctor: ${doctorName}  
📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

This update has been communicated to both doctor and patient.

DocAssist System`;
  }
  break;


    // ---------------- COMPLETED ----------------
    case 'complete':
      if (recipient === 'patient') {
        message = `✅ Appointment Completed

Dear ${patientName},

Your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime} has been marked as completed.

Thank you for choosing our service.

Kind regards,  
DocAssist`;
      } else if (recipient === 'doctor') {
        message = `✅ Appointment Completed

Dear Dr. ${doctorName},

The appointment with:

Patient: ${patientName}  

on ${appointmentDate} at ${appointmentTime} has been marked as completed.

Kind regards,  
DocAssist`;
      } else if (recipient === 'admin') {
        message = `✅ Appointment Marked Completed

Admin,

The appointment between Dr. ${doctorName} and patient ${patientName} was marked as completed.

📅 Date: ${appointmentDate}  
⏰ Time: ${appointmentTime}  

DocAssist System`;
      }
      break;

    // ---------------- BLOCKED ACCOUNT ----------------
    case 'block':
      if (recipient === 'patient') {
        message = `🚫 Account Blocked Notice

Dear ${patientName},

We regret to inform you that your account has been **temporarily blocked for 7 days** due to **4 missed appointments**.

During this period, you will not be able to book new appointments.  
Your account will automatically be unblocked on: ${patient?.blockedUntil ? new Date(patient.blockedUntil).toLocaleDateString() : 'the unblock date'}.

If you believe this is a mistake, please contact our support team.

Kind regards,  
DocAssist Support`;
      } else if (recipient === 'admin') {
        message = `🚫 Patient Blocked

Admin,

Patient ${patientName} has been blocked for 7 days due to repeated missed appointments.

📅 Unblock Date: ${patient?.blockedUntil ? new Date(patient.blockedUntil).toLocaleDateString() : 'N/A'}

DocAssist System`;
      }
      break;

    // ---------------- DEFAULT ----------------
    default:
      message = `ℹ Appointment Update:
Patient: ${patientName}
Phone: ${patient.phone || 'N/A'}  
Doctor: ${doctorName}
Date: ${appointmentDate}
Time: ${appointmentTime}`;
  }

  return message;
};

module.exports = formatMessage;
