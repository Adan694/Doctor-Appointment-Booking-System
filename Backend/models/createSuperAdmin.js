
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require('dotenv');
dotenv.config();

const { User } = require("./models/users");
const uri = process.env.MONGO_URI;

async function createSuperAdmin() {
  try {
    if (!uri) {
      throw new Error("MongoDB URI is not defined in environment variables.");
    }
    await mongoose.connect(uri);

    const existingAdmin = await User.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("❗ Admin already exists.");
      return mongoose.disconnect();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    const admin = new User({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();
    console.log("✅ Super Admin created successfully!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    mongoose.disconnect();
  }
}

createSuperAdmin();
