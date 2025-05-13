const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payslip = require("../models/Payslip");

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

// Get all attendance records (admin only)
router.get("/attendance/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const attendance = await Attendance.find()
      .sort({ date: -1 })
      .populate("employee", "firstName lastName email");
    res.json({ success: true, attendance });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch attendance data" });
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

// Generate reports (admin only)
router.get("/reports/attendance", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("employee", "firstName lastName email department")
      .sort({ date: 1 });

    // Group attendance by employee
    const report = attendance.reduce((acc, record) => {
      const employeeId = record.employee._id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: record.employee,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        };
      }
      acc[employeeId][record.status]++;
      acc[employeeId].total++;
      return acc;
    }, {});

    res.json({
      success: true,
      report: Object.values(report),
      period: { month, year },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
    });
  }
});

router.get("/reports/leave", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const leaves = await Leave.find({
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
      .populate("employee", "firstName lastName email department")
      .sort({ startDate: 1 });

    // Group leaves by employee
    const report = leaves.reduce((acc, leave) => {
      const employeeId = leave.employee._id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: leave.employee,
          approved: 0,
          pending: 0,
          rejected: 0,
          total: 0,
        };
      }
      acc[employeeId][leave.status]++;
      acc[employeeId].total++;
      return acc;
    }, {});

    res.json({
      success: true,
      report: Object.values(report),
      period: { month, year },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to generate leave report" });
  }
});

router.get("/reports/department", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const employees = await Employee.find()
      .populate("department", "name")
      .select("-password");

    // Group employees by department
    const report = employees.reduce((acc, employee) => {
      const deptId = employee.department?._id || "No Department";
      if (!acc[deptId]) {
        acc[deptId] = {
          department: employee.department?.name || "No Department",
          total: 0,
          positions: {},
        };
      }
      acc[deptId].total++;
      acc[deptId].positions[employee.position] =
        (acc[deptId].positions[employee.position] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      report: Object.values(report),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate department report",
    });
  }
});

// Get employee payslips
router.get("/payslips", auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const payslips = await Payslip.find({
      employee: req.user.id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    res.json({ success: true, payslips });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payslips" });
  }
});

// Download payslip
router.get("/payslips/:id/download", auth, async (req, res) => {
  try {
    const payslip = await Payslip.findOne({
      _id: req.params.id,
      employee: req.user.id,
    }).populate("employee", "firstName lastName email department");

    if (!payslip) {
      return res
        .status(404)
        .json({ success: false, message: "Payslip not found" });
    }

    // TODO: Generate PDF using a library like PDFKit
    // For now, we'll just send the payslip data
    res.json({
      success: true,
      payslip: {
        ...payslip.toObject(),
        employee: payslip.employee,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to download payslip" });
  }
});

// Get all leave requests (admin only)
router.get("/leaves/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { status } = req.query;
    const query = status && status !== "all" ? { status } : {};

    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName email department")
      .sort({ createdAt: -1 });

    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
});

// Update leave status (admin only)
router.put("/leaves/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("employee", "firstName lastName email department");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    res.json({
      success: true,
      message: "Leave status updated successfully",
      leave,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update leave status",
    });
  }
});

module.exports = router;
