const cron = require("node-cron");
const { User } = require("../models/users");

// Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  try {
    const result = await User.updateMany(
      { isBlocked: true, blockedUntil: { $lte: now } },
      { $set: { isBlocked: false, missedAppointments: 0, blockedUntil: null } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Unblocked ${result.modifiedCount} patients`);
    }
  } catch (err) {
    console.error("❌ Error in unblock cron:", err.message);
  }
});
