import Department from "../models/Department.js";

// Get all departments
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        return res.status(200).json({ success: true, departments });
    } catch (error) {
        console.error("Error fetching departments:", error); // Log the error for debugging
        return res.status(500).json({ success: false, error: "Server error while fetching departments" });
    }
};

// Add a new department
const addDepartment = async (req, res) => {
    try {
        const { dep_name, description } = req.body;

        // Input validation can be done here
        if (!dep_name) {
            return res.status(400).json({ success: false, error: "Department name is required" });
        }

        const newDep = new Department({
            dep_name,
            description,
        });

        await newDep.save();
        return res.status(201).json({ success: true, department: newDep });
    } catch (error) {
        console.error("Error adding department:", error); // Log the error for debugging
        return res.status(500).json({ success: false, error: "Server error while adding department" });
    }
};

export { addDepartment, getDepartments };
