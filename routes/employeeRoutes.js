const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");

// Get employee profile
router.get("/profile", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .select("-password")
      .populate("department", "name");
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    res.json({
      success: true,
      employee,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update employee profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, address },
      { new: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      employee,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get all employees (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const employees = await Employee.find()
      .select("-password")
      .populate("department", "name");
    res.json({
      success: true,
      employees,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get attendance history
router.get("/attendance", auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json({ success: true, attendance });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch attendance data" });
  }
});

// Get today's attendance status
router.get("/attendance/today", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (!attendance) {
      return res.json({ success: true, status: null });
    }

    res.json({ success: true, status: attendance.status });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to check attendance status" });
  }
});

// Mark attendance
router.post("/attendance/mark", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked attendance
    const existingAttendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      employee: req.user.id,
      date: today,
      status: "present",
      time: new Date(),
    });

    await attendance.save();
    res.json({ success: true, message: "Attendance marked successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to mark attendance" });
  }
});

// Get leave history
router.get("/leaves", auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort({
      startDate: -1,
    });
    res.json({ success: true, leaves });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch leave data" });
  }
});

// Apply for leave
router.post("/leaves", auth, async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the past",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      employee: req.user.id,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
      status: { $ne: "rejected" },
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: "You have an overlapping leave request",
      });
    }

    // Create new leave request
    const leave = new Leave({
      employee: req.user.id,
      startDate: start,
      endDate: end,
      type,
      reason,
      status: "pending",
    });

    await leave.save();
    res.json({
      success: true,
      message: "Leave request submitted successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to submit leave request" });
  }
});

module.exports = router;
