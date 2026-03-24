const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    chapters: [{
        name: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date }
    }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
}, { timestamps: true });

// Ensure unique syllabus per subject per batch
syllabusSchema.index({ subject: 1, batchId: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
