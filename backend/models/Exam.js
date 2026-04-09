const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    classLevel: { type: String, default: '' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null, index: true },
    chapter: { type: String, required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }], default: [] },
    linkedBatchCount: { type: Number, default: 1, min: 1 },
    date: { type: Date },
    totalMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 40 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    type: { type: String, enum: ['Exam', 'Quiz', 'Assignment'], default: 'Exam' },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

examSchema.index({ batchId: 1, subject: 1, date: -1 });

module.exports = mongoose.model('Exam', examSchema);
