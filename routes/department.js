import express from "express";
import { addDepartment, getDepartments } from "../controllers/departmentController.js";

import verifyUser from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', verifyUser, getDepartments);
router.post('/add', verifyUser, addDepartment);


export default router;
