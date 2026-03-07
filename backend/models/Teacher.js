const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchName: { type: String },
    subjects: [{ type: String }]
}, { _id: false });

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, index: true },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    altPhone: { type: String, trim: true },
    address: {
        current: { type: String, trim: true },
        permanent: { type: String, trim: true }
    },
    profileImage: { type: String },
    regNo: { type: String, trim: true, sparse: true, index: true, unique: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    qualifications: { type: String, trim: true },
    experience: { type: String, trim: true },
    joiningDate: { type: Date },
    salary: { type: Number, default: 0 },
    assignments: [assignmentSchema],
    password: { type: String },
    systemRole: { type: String, enum: ['Teacher', 'Admin'], default: 'Teacher' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);
