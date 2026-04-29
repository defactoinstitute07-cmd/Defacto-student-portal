const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

/* ═══════════════════════════════════════════════════════════
   1. GET /conversations/:userId
      — Unique conversation partners, last message, unseen count
   ═══════════════════════════════════════════════════════════ */
router.get('/conversations/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const isStudent = await Student.exists({ _id: userId });
        const adminDoc = await Admin.findOne().lean();

        if (isStudent && adminDoc) {
            const adminId = adminDoc._id;
            const adminConvo = await Message.aggregate([
                {
                    $match: {
                        deleted: false,
                        $or: [
                            { senderId: userId, receiverId: adminId },
                            { senderId: adminId, receiverId: userId }
                        ]
                    }
                },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: adminId,
                        lastMessage: { $first: '$text' },
                        lastMessageAt: { $first: '$createdAt' },
                        unseenCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$receiverId', userId] },
                                            { $eq: ['$seenAt', null] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            const adminInfo = {
                _id: adminId,
                name: adminDoc.adminName || adminDoc.coachingName || 'Admin',
                avatar: adminDoc.instituteLogo || null,
                lastMessage: null,
                lastMessageAt: new Date(),
                unseenCount: 0
            };

            if (adminConvo.length > 0) {
                adminInfo.lastMessage = adminConvo[0].lastMessage;
                adminInfo.lastMessageAt = adminConvo[0].lastMessageAt;
                adminInfo.unseenCount = adminConvo[0].unseenCount;
            }

            return res.json({ success: true, conversations: [adminInfo] });
        }

        // If it's the Admin fetching conversations, show students
        const conversations = await Message.aggregate([
            {
                $match: {
                    deleted: false,
                    $or: [{ senderId: userId }, { receiverId: userId }]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    otherUserId: {
                        $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId']
                    }
                }
            },
            {
                $group: {
                    _id: '$otherUserId',
                    lastMessage: { $first: '$text' },
                    lastMessageAt: { $first: '$createdAt' },
                    unseenCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', userId] },
                                        { $eq: ['$seenAt', null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastMessageAt: -1 } },
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: { $ifNull: ['$user.name', 'Unknown User'] },
                    rollNo: { $ifNull: ['$user.rollNo', null] },
                    avatar: { $ifNull: ['$user.profileImage', null] },
                    lastMessage: 1,
                    lastMessageAt: 1,
                    unseenCount: 1
                }
            }
        ]);

        res.json({ success: true, conversations });
    } catch (error) {
        console.error('GET /conversations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ═══════════════════════════════════════════════════════════
   2. GET /messages/:otherUserId
      — Message thread between current user and otherUser
   ═══════════════════════════════════════════════════════════ */
router.get('/messages/:otherUserId', authMiddleware, async (req, res) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.id);
        const otherUserId = new mongoose.Types.ObjectId(req.params.otherUserId);

        const messages = await Message.find({
            deleted: false,
            $or: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        })
            .sort({ createdAt: 1 })
            .select('senderId receiverId text seenAt createdAt deleted')
            .lean();

        // Calculate expiresAt for seen messages (24h after seenAt)
        const enriched = messages.map(msg => ({
            ...msg,
            seen: !!msg.seenAt,
            expiresAt: msg.seenAt
                ? new Date(new Date(msg.seenAt).getTime() + 86400000).toISOString()
                : null
        }));

        res.json({ success: true, messages: enriched });
    } catch (error) {
        console.error('GET /messages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ═══════════════════════════════════════════════════════════
   3. PATCH /seen/:senderId
      — Mark all messages from senderId to current user as seen
   ═══════════════════════════════════════════════════════════ */
router.patch('/seen/:senderId', authMiddleware, async (req, res) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.id);
        const senderId = new mongoose.Types.ObjectId(req.params.senderId);

        const result = await Message.updateMany(
            {
                senderId: senderId,
                receiverId: currentUserId,
                seenAt: null,
                deleted: false
            },
            { $set: { seenAt: new Date() } }
        );

        res.json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('PATCH /seen error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/* ═══════════════════════════════════════════════════════════
   4. POST /send
      — Send a new message { to, text }
   ═══════════════════════════════════════════════════════════ */
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { to, text } = req.body;

        if (!to || !text?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Both "to" and "text" fields are required.'
            });
        }

        const message = await Message.create({
            senderId: req.user.id,
            receiverId: to,
            text: text.trim()
        });

        res.status(201).json({ success: true, message });
    } catch (error) {
        console.error('POST /send error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
