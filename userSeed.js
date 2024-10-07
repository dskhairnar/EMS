import User from "./models/User";
import bcrypt from "bcrypt";
import connectToDatabase from "./db/db";

// Call the function to connect to the database
const userRegister = async () => {
  await connectToDatabase(); // Make sure the database is connected before proceeding

  try {
    const hashPassword = await bcrypt.hash("admin", 10);

    // Create a new user
    const newUser = new User({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashPassword,
      role: "admin",
    });

    // Save the new user in the MongoDB
    await newUser.save();
    console.log("Admin user registered successfully");
  } catch (error) {
    console.log("Error during user registration:", error);
  }
};

userRegister();
