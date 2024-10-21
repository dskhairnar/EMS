import Department from "../models/Department.js";


const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        return res.status(200).json({ success: true, departments });
    } catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ success: false, error: "Server error while fetching departments" });
    }
};

const addDepartment = async (req, res) => {
    try {
        const { dep_name, description } = req.body;

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
        console.error("Error adding department:", error);
        return res.status(500).json({ success: false, error: "Server error while adding department" });
    }
};

const getDepartment = async (req, res) =>{
    try {
        const { id } = req.params;
        const department = await Department.findById({ _id: id})
        return res.status(200).json({success:true, department})
    } catch (error) {
        return res.status(500).json({success: false, error: "get department server error"})
    }
}

const updateDepartment = async (req,res)=>{
    try {
        const {id} = req.params;
        const {dep_name, description} = req.body;
        const updateDep = await Departement.findByIdAndUpdate({_id : id}, {
            dep_name,
            description
        })
        return res.status(200).json({success: true , UpdateDep})
    } catch (error) {
        return res.status(500).json({success:false,  error: "edit department sever error"})
    }
}

export { addDepartment, getDepartments, getDepartment,updateDepartment};
