import express from "express";
import {
  addDepartment,
  getDepartments,
  // editDepartment,
  getDepartment,
  updateDepartment,
} from "../controllers/departmentController.js";

import verifyUser from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", verifyUser, getDepartments);
router.post("/add", verifyUser, addDepartment);
router.get("/:id", verifyUser, updateDepartment);
router.put("/:id", verifyUser, getDepartment);

export default router;
