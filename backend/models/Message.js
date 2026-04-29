const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    seenAt: {
        type: Date,
        default: null
    },
    deleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true // createdAt + updatedAt auto
});

// Compound index for fast conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ seenAt: 1, deleted: 1 }); // for auto-delete cron

module.exports = mongoose.model('Message', messageSchema);
