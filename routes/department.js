const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Department = require("../models/Department");

// Get all departments
router.get("/", auth, async (req, res) => {
  try {
    const departments = await Department.find();
    res.json({ success: true, departments });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch departments" });
  }
});

// Create department
router.post("/", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = new Department({
      name,
      description,
    });
    await department.save();
    res.json({ success: true, department });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create department" });
  }
});

// Update department
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, department });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update department" });
  }
});

// Delete department
router.delete("/:id", auth, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete department" });
  }
});

module.exports = router;
