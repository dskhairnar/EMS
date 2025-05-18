import express from "express";
import auth from "../middleware/auth.js";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Payslip from "../models/Payslip.js";

const router = express.Router();

// Get all employees
router.get("/", auth, async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");
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

// Get employee by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
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

// Update employee
router.put("/:id", auth, async (req, res) => {
  try {
    const { firstName, lastName, email, department, role } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Update fields
    if (firstName) employee.firstName = firstName;
    if (lastName) employee.lastName = lastName;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (role) employee.role = role;

    await employee.save();
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

// Delete employee
router.delete("/:id", auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await employee.remove();
    res.json({
      success: true,
      message: "Employee removed",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get employee payslips
router.get("/:id/payslips", auth, async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.params.id });
    res.json({
      success: true,
      payslips,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Create payslip
router.post("/:id/payslips", auth, async (req, res) => {
  try {
    const { month, year, basicSalary, allowances, deductions } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const payslip = new Payslip({
      employee: req.params.id,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
    });

    await payslip.save();
    res.json({
      success: true,
      payslip,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
