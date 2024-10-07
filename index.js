import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectToDatabase from "./db/db.js";
import authRouter from "./routes/auth.js";
import departmentRouter from "./routes/department.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/department", departmentRouter);

// Connect to MongoDB
connectToDatabase();

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is Running on the port ${process.env.PORT}`);
});
