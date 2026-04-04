const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    durationDays: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    },
    projectedStartDate: {
        type: Date,
        default: null
    },
    projectedCompletionDate: {
        type: Date,
        default: null
    }
}, { _id: true });

const assignedTeacherSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    assignedAt: {
        type: Date,
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, { _id: false });

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true,
        default: null
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        index: true
    },
    // Legacy direct teacher reference retained for query compatibility.
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null,
        index: true
    },
    // Canonical assignment object for clear teacher ownership on each subject.
    assignedTeacher: {
        type: assignedTeacherSchema,
        default: () => ({})
    },
    totalChapters: {
        type: Number,
        default: null,
        min: 0
    },
    chapters: {
        type: [chapterSchema],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

subjectSchema.pre('save', function () {
    this.updatedAt = new Date();

    if (!this.assignedTeacher || typeof this.assignedTeacher !== 'object') {
        this.assignedTeacher = {};
    }

    // Keep both teacherId fields in sync for old and new code paths.
    if (this.assignedTeacher.teacherId && !this.teacherId) {
        this.teacherId = this.assignedTeacher.teacherId;
    }
    if (this.teacherId && !this.assignedTeacher.teacherId) {
        this.assignedTeacher.teacherId = this.teacherId;
    }

    // Stamp assignment timestamp the first time a teacher is linked.
    if ((this.teacherId || this.assignedTeacher.teacherId) && !this.assignedTeacher.assignedAt) {
        this.assignedTeacher.assignedAt = new Date();
    }

    if (!this.code && this.name) {
        this.code = this.name
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 24)
            .toUpperCase();
    }
});

subjectSchema.index({ batchId: 1, name: 1 }, { unique: true });
subjectSchema.index({ batchId: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Subject', subjectSchema);
