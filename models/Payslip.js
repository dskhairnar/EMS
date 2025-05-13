const mongoose = require("mongoose");

const payslipSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    deductions: {
      tax: {
        type: Number,
        default: 0,
      },
      insurance: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee and date
payslipSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Payslip", payslipSchema); 