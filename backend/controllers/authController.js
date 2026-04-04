const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Teacher = require('../models/Teacher');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Syllabus = require('../models/Syllabus');
const ChapterCompletion = require('../models/ChapterCompletion');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { invalidateUserCache } = require('../middleware/cache');
const { sendApiError } = require('../utils/apiError');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeKey = (value = '') => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normalizeCodeKey = (value = '') => String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const normalizeDeviceInfo = (payload = {}) => ({
    platform: String(payload.platform || '').trim(),
    model: String(payload.model || '').trim(),
    manufacturer: String(payload.manufacturer || '').trim(),
    appVersion: String(payload.appVersion || '').trim(),
    deviceId: String(payload.deviceId || '').trim(),
    appType: String(payload.appType || '').trim(),
    packageName: String(payload.packageName || '').trim()
});

const getActivityWindow = () => {
    const minutes = parseInt(process.env.ACTIVITY_UPDATE_MINUTES || '5', 10);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
};

const getAttendanceSnapshot = async (studentId) => {
    const match = { studentId };

    const [rows, subjectRows, recentRows] = await Promise.all([
        Attendance.aggregate([
            { $match: match },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Attendance.aggregate([
            { $match: match },
            { 
                $group: { 
                    _id: '$subjectId', 
                    present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
                    total: { $sum: 1 }
                } 
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subject'
                }
            },
            { $unwind: '$subject' },
            {
                $project: {
                    subjectId: '$_id',
                    subjectName: '$subject.name',
                    subjectCode: '$subject.code',
                    present: 1,
                    absent: 1,
                    late: 1,
                    total: 1,
                    percentage: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] },
                            0
                        ]
                    }
                }
            }
        ]),
        Attendance.find(match)
            .sort({ attendanceDate: -1, createdAt: -1, _id: -1 })
            .limit(8)
            .populate('subjectId', 'name code')
            .lean()
    ]);

    const present = rows.find((row) => row._id === 'Present')?.count || 0;
    const absent = rows.find((row) => row._id === 'Absent')?.count || 0;
    const late = rows.find((row) => row._id === 'Late')?.count || 0;
    const total = present + absent + late;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
        summary: { total, present, absent, late, percentage },
        subjects: subjectRows,
        recent: recentRows.map((row) => ({
            _id: row._id,
            status: row.status,
            attendanceDate: row.attendanceDate,
            subjectId: row.subjectId
                ? {
                    _id: row.subjectId._id,
                    name: row.subjectId.name,
                    code: row.subjectId.code
                }
                : null,
            subjectName: row.subjectId?.name || ''
        }))
    };
};

exports.getSubjectAttendanceDetail = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const studentId = req.user.id;

        const records = await Attendance.find({ studentId, subjectId })
            .sort({ attendanceDate: -1 })
            .lean();

        res.json({ success: true, records });
    } catch (error) {
        console.error('Error in getSubjectAttendanceDetail:', error);
        sendApiError(res, error, 'Server error');
    }
};

// Add Student (Admin Side)
exports.addStudent = async (req, res) => {
    try {
        const { name, rollNo, password, className, batchId } = req.body;

        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNo });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'Student with this roll number already exists.' });
        }

        // Create new student
        const newStudent = new Student({
            name,
            rollNo,
            password, // Password will be hashed by the pre-save hook in the model
            className,
            batchId
        });

        await newStudent.save();

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            student: {
                _id: newStudent._id,
                name: newStudent.name,
                rollNo: newStudent.rollNo,
                className: newStudent.className,
                batchId: newStudent.batchId
            }
        });
    } catch (error) {
        console.error('Error in addStudent:', error);
        sendApiError(res, error, 'Unable to add student right now.');
    }
};

// Student Login
exports.studentLogin = async (req, res) => {
    try {
        let { rollNo, password } = req.body;

        rollNo = String(rollNo || '').trim();
        password = String(password || '');

        if (!rollNo || !password) {
            return res.status(400).json({ success: false, message: 'Please provide roll number and password' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'Server auth configuration missing' });
        }

        // Check if student exists (case-insensitive) and populate batch
        const safeRollNoPattern = new RegExp(`^${escapeRegex(rollNo)}$`, 'i');
        const student = await Student.findOne({ rollNo: { $regex: safeRollNoPattern } }).populate('batchId');
        if (!student) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (student.status === 'inactive') {
            return res.status(403).json({
                success: false,
                message: 'Your account is inactive. Please contact the admin.'
            });
        }

        // Verify password
        if (!student.password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const now = new Date();
        const portalAccess = student.portalAccess || {};
        student.portalAccess = {
            signupStatus: portalAccess.signupStatus || 'yes',
            signedUpAt: portalAccess.signedUpAt || now,
            lastLoginAt: now
        };
        student.lastActiveAt = now;
        student.lastAppOpenAt = now;
        await student.save();

        // Generate JWT token
        const payload = {
            id: student._id,
            rollNo: student.rollNo,
            name: student.name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        const needsSetup = student.isFirstLogin || !student.profileImage;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            student: {
                id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                class: student.className, // Frontend expects 'class' in its dashboard
                batch: student.batchId ? student.batchId.name : 'N/A', // Return batch name instead of ID
                isFirstLogin: student.isFirstLogin,
                profileImage: student.profileImage || null,
                needsSetup
            }
        });
    } catch (error) {
        console.error('Error in studentLogin:', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            code: error?.code
        });
        sendApiError(res, error, 'Login failed. Please try again.');
    }
};

exports.registerDevice = async (req, res) => {
    try {
        const { fcmToken } = req.body || {};
        if (!fcmToken || !String(fcmToken).trim()) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        const now = new Date();
        const token = String(fcmToken).trim();
        const deviceInfo = normalizeDeviceInfo(req.body);

        await Student.updateOne(
            { _id: req.user.id },
            {
                $addToSet: { deviceTokens: token },
                $set: {
                    lastDevice: deviceInfo,
                    lastAppOpenAt: now,
                    lastActiveAt: now
                }
            }
        );

        res.json({ success: true, message: 'Device registered', registeredAt: now.toISOString() });
    } catch (error) {
        console.error('Error in registerDevice:', error);
        sendApiError(res, error, 'Unable to register this device right now.');
    }
};

exports.trackActivity = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'User not identified' });
        }

        const event = String(req.body?.event || 'heartbeat').toLowerCase();
        const now = new Date();
        const update = { $set: { lastActiveAt: now } };

        if (event === 'app_open') {
            update.$set.lastAppOpenAt = now;
        }

        const deviceInfo = normalizeDeviceInfo(req.body);
        const hasDevicePayload = Object.values(deviceInfo).some((val) => val);
        if (hasDevicePayload) {
            update.$set.lastDevice = deviceInfo;
        }

        // If it's an app_open, always update
        if (event === 'app_open') {
            await Student.updateOne({ _id: req.user.id }, update);
            return res.json({ success: true, message: 'Activity recorded (open)', updated: true });
        }

        const minMinutes = getActivityWindow();
        const threshold = new Date(now.getTime() - minMinutes * 60 * 1000);

        // For heartbeat, only update if threshold passed
        const result = await Student.updateOne(
            {
                _id: req.user.id,
                $or: [
                    { lastActiveAt: { $lt: threshold } },
                    { lastActiveAt: { $exists: false } },
                    { lastActiveAt: null }
                ]
            },
            update
        );

        res.json({ success: true, message: 'Activity recorded', updated: result.modifiedCount > 0 });
    } catch (error) {
        console.error('[authController.trackActivity] CRITICAL ERROR:', error);
        sendApiError(res, error, 'Unable to record activity right now.');
    }
};

exports.getStudentSubjectDetail = async (req, res) => {
    try {
        const { subjectName } = req.params;
        const student = await Student.findById(req.user.id)
            .populate('batchId')
            .select('batchId subjectTeachers roomAllocation')
            .lean();

        if (!student?.batchId?._id) {
            return res.status(404).json({ success: false, message: 'Batch not found for this student.' });
        }

        const targetName = normalizeKey(subjectName);
        if (!targetName) {
            return res.status(400).json({ success: false, message: 'Subject name is required.' });
        }

        const subjectDocs = await Subject.find({
            batchId: student.batchId._id,
            isActive: true
        })
            .populate('teacherId', 'name profileImage status')
            .lean();

        const subject = subjectDocs.find((item) => {
            const nameMatch = normalizeKey(item.name) === targetName;
            const codeMatch = normalizeCodeKey(item.code) === normalizeCodeKey(subjectName);
            return nameMatch || codeMatch;
        });

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found for this batch.' });
        }

        const subjectKey = normalizeKey(subject.name);
        let teacher = 'Unassigned';
        let teacherProfileImage = null;
        const rooms = new Set();
        const timings = new Set();

        const studentOverride = student.subjectTeachers?.find((entry) => normalizeKey(entry.subject) === subjectKey);
        if (studentOverride?.teacher) {
            teacher = studentOverride.teacher;
        }

        const subjectAssignedTeacher = String(
            subject.assignedTeacher?.name || subject.teacherId?.name || ''
        ).trim();
        if (teacher === 'Unassigned' && subjectAssignedTeacher) {
            teacher = subjectAssignedTeacher;
            teacherProfileImage = subject.teacherId?.profileImage || null;
        }

        const [teacherDocs, allExams, resultDocs] = await Promise.all([
            Teacher.find({
                status: 'active',
                $or: [
                    { 'assignments.batchId': student.batchId._id },
                    { batchId: student.batchId._id }
                ]
            }).select('name assignments profileImage batchId subjectIds').lean(),
            Exam.find({ batchId: student.batchId._id, subject: subject.name, status: { $ne: 'cancelled' } })
                .sort({ date: -1 })
                .lean(),
            ExamResult.find({ studentId: student._id }).lean()
        ]);

        if (teacher !== 'Unassigned') {
            const overrideDoc = teacherDocs.find((entry) => normalizeKey(entry.name) === normalizeKey(teacher));
            if (overrideDoc?.profileImage) {
                teacherProfileImage = overrideDoc.profileImage;
            }
        }

        const batchIdStr = student.batchId._id.toString();
        teacherDocs.forEach((entry) => {
            const batchAssignment = entry.assignments?.find((assignment) => assignment.batchId?.toString() === batchIdStr);
            const assignmentMatch = Array.isArray(batchAssignment?.subjects)
                ? batchAssignment.subjects.some((assignedSubject) => normalizeKey(assignedSubject) === subjectKey)
                : false;
            const directSchemaMatch = entry.batchId?.toString() === batchIdStr
                && Array.isArray(entry.subjectIds)
                && entry.subjectIds.some((id) => id?.toString() === subject._id?.toString());

            if ((assignmentMatch || directSchemaMatch) && teacher === 'Unassigned') {
                teacher = entry.name;
                teacherProfileImage = entry.profileImage || null;
            }
        });

        if (Array.isArray(student.batchId.schedule)) {
            student.batchId.schedule.forEach((slot) => {
                if (normalizeKey(slot.subject) !== subjectKey) return;
                if (slot.room) rooms.add(slot.room);
                if (slot.time && slot.day) timings.add(`${slot.day} ${slot.time}`);
                if (slot.teacher && teacher === 'Unassigned') {
                    teacher = slot.teacher;
                }
            });
        }

        if (teacher !== 'Unassigned' && !teacherProfileImage) {
            const matchedTeacher = teacherDocs.find((entry) => normalizeKey(entry.name) === normalizeKey(teacher));
            if (matchedTeacher?.profileImage) {
                teacherProfileImage = matchedTeacher.profileImage;
            }

            if (!teacherProfileImage && normalizeKey(subject.teacherId?.name) === normalizeKey(teacher)) {
                teacherProfileImage = subject.teacherId?.profileImage || null;
            }
        }

        const resultMap = new Map(resultDocs.map((result) => [result.examId.toString(), result]));
        const exams = allExams.map((exam) => {
            const result = resultMap.get(exam._id.toString());
            const hasDeclaredResult = Boolean(result && result.isPresent);
            const percentage = hasDeclaredResult && Number(exam.totalMarks) > 0
                ? Math.round((Number(result.marksObtained || 0) / Number(exam.totalMarks)) * 100)
                : null;

            return {
                _id: exam._id,
                name: exam.name,
                chapter: exam.chapter,
                date: exam.date,
                totalMarks: exam.totalMarks,
                passingMarks: exam.passingMarks,
                type: exam.type || 'Exam',
                status: exam.status,
                marksObtained: hasDeclaredResult ? result.marksObtained : null,
                isPresent: result ? result.isPresent : true,
                percentage,
                hasPassed: hasDeclaredResult && Number(exam.totalMarks) > 0
                    ? (Number(result.marksObtained || 0) / Number(exam.totalMarks)) >= 0.4
                    : null
            };
        });

        const chapters = Array.isArray(subject.chapters) ? subject.chapters.map((chapter) => ({
            _id: chapter._id,
            name: chapter.name,
            durationDays: chapter.durationDays,
            status: chapter.status,
            createdAt: chapter.createdAt,
            completedAt: chapter.completedAt,
            projectedStartDate: chapter.projectedStartDate,
            projectedCompletionDate: chapter.projectedCompletionDate,
            isCompleted: chapter.status === 'completed',
            isCompletionTracked: true,
            trackingSource: 'subjectCollection'
        })) : [];

        const totalChapters = Number.isFinite(subject.totalChapters) && subject.totalChapters !== null
            ? subject.totalChapters
            : chapters.length;
        const completedChapters = chapters.filter((chapter) => chapter.isCompleted).length;
        const completionPercentage = totalChapters > 0
            ? Math.round((completedChapters / totalChapters) * 100)
            : 0;

        return res.json({
            success: true,
            subject: {
                _id: subject._id,
                name: subject.name,
                code: subject.code,
                teacher,
                teacherProfileImage,
                rooms: Array.from(rooms),
                timings: Array.from(timings),
                totalChapters,
                completedChapters,
                chapters,
                syllabus: {
                    chapters,
                    completionPercentage,
                    totalChapters,
                    completedChapters,
                    tracking: {
                        trackedChapters: chapters.length,
                        untrackedChapters: 0,
                        source: 'subjectCollection'
                    }
                },
                exams
            }
        });
    } catch (error) {
        console.error('Error fetching student subject detail:', error);
        sendApiError(res, error, 'Unable to fetch subject detail right now.');
    }
};

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('batchId')
            .select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // ── Extract teachers, room, code, and timing ───────────────────────
        let roomAllocation = student.roomAllocation || 'N/A';
        const teachersMap = new Map();
        const teacherProfileMap = new Map();
        const subjectSchedules = new Map(); // subjectName -> { timings: Set, rooms: Set }
        const subjectCodeMap = new Map();
        
        let batchSubjectDocs = [];
        if (student.batchId?._id) {
            batchSubjectDocs = await Subject.find({
                batchId: student.batchId._id,
                isActive: true
            })
                .populate('teacherId', 'name profileImage status')
                .select('name code teacherId assignedTeacher totalChapters')
                .lean();

            batchSubjectDocs.forEach((subjectDoc) => {
                if (!subjectDoc?.name) return;

                subjectCodeMap.set(subjectDoc.name, subjectDoc.code || null);

                const assignedTeacherName = String(
                    subjectDoc.assignedTeacher?.name || subjectDoc.teacherId?.name || ''
                ).trim();

                if (assignedTeacherName) {
                    const existing = teachersMap.get(subjectDoc.name);
                    if (!existing || existing === 'Unassigned') {
                        teachersMap.set(subjectDoc.name, assignedTeacherName);
                    }

                    if (subjectDoc.teacherId?.profileImage) {
                        teacherProfileMap.set(assignedTeacherName, subjectDoc.teacherId.profileImage);
                    }
                }
            });
        }

        // 1. First, populate from Student's own subjectTeachers (individual override)
        if (student.subjectTeachers && student.subjectTeachers.length > 0) {
            student.subjectTeachers.forEach(st => {
                if (st.subject && st.teacher) {
                    teachersMap.set(st.subject, st.teacher);
                }
            });
        }

        // 2. Query Teacher assignments for this batch (Source of truth for Admin)
        if (student.batchId) {
            const batchIdStr = student.batchId._id.toString();
            const teachers = await Teacher.find({ 'assignments.batchId': student.batchId._id })
                .select('name assignments')
                .lean();

            teachers.forEach(t => {
                if (t.name) {
                    teacherProfileMap.set(t.name, t.profileImage || null);
                }

                const batchAssignment = t.assignments.find(a => a.batchId?.toString() === batchIdStr);
                if (batchAssignment && batchAssignment.subjects) {
                    batchAssignment.subjects.forEach(sub => {
                        // Only set if not already set by student-specific override
                        if (!teachersMap.has(sub) || teachersMap.get(sub) === 'Unassigned') {
                            teachersMap.set(sub, t.name);
                        }
                    });
                }
            });

            // Overlay basic info from batch
            const batch = student.batchId;
            roomAllocation = batch.classroom || roomAllocation;

            // Add any subjects listed in batch that still don't have a teacher
            if (batch.subjects && batch.subjects.length > 0) {
                batch.subjects.forEach(s => {
                    if (!teachersMap.has(s)) teachersMap.set(s, 'Unassigned');
                });
            }

            // Fallback: Merge from batch schedule (if any teacher info lives there)
            if (batch.schedule && batch.schedule.length > 0) {
                batch.schedule.forEach(slot => {
                    if (slot.subject) {
                        const currentTeacher = slot.teacher || 'Unassigned';
                        const existing = teachersMap.get(slot.subject);

                        if (!existing || existing === 'Unassigned') {
                            if (currentTeacher !== 'Unassigned') {
                                teachersMap.set(slot.subject, currentTeacher);
                            } else if (!existing) {
                                teachersMap.set(slot.subject, 'Unassigned');
                            }
                        }

                        // Collect schedule info (timings and rooms)
                        if (!subjectSchedules.has(slot.subject)) {
                            subjectSchedules.set(slot.subject, { timings: new Set(), rooms: new Set() });
                        }
                        const sched = subjectSchedules.get(slot.subject);
                        if (slot.time && slot.day) sched.timings.add(`${slot.day} ${slot.time}`);
                        if (slot.room) sched.rooms.add(slot.room);
                    }
                });
            }
        }

        // 4. Fetch Syllabus Completion (from ChapterCompletion collection) ──────
        let syllabusMap = new Map();
        if (student.batchId) {
            const batchObjId = student.batchId._id;
            const normalizeKey = (value) => String(value || '').trim().toLowerCase();

            // Primary: ChapterCompletion docs (created by admin/teacher panel)
            const [completionDocs, batchSubjectDocs, syllabusDocs] = await Promise.all([
                ChapterCompletion.find({ batchId: batchObjId })
                    .sort({ updatedAt: -1, createdAt: -1 })
                    .lean(),
                Subject.find({ batchId: batchObjId, isActive: true }).select('name totalChapters').lean(),
                Syllabus.find({ batchId: batchObjId }).lean()
            ]);

            // Build a map: normalized subject -> total chapters from Subject collection
            const subjectTotalMap = new Map();
            batchSubjectDocs.forEach((subjectDoc) => {
                const key = normalizeKey(subjectDoc.name);
                if (!key) return;
                subjectTotalMap.set(key, subjectDoc.totalChapters);
            });

            // Group latest ChapterCompletion status by subject + chapter.
            const completionBySubject = new Map();
            completionDocs.forEach(doc => {
                const subjectKey = normalizeKey(doc.subject);
                const chapterKey = normalizeKey(doc.chapterName);
                if (!subjectKey || !chapterKey) return;

                if (!completionBySubject.has(subjectKey)) {
                    completionBySubject.set(subjectKey, new Map());
                }

                const chapterMap = completionBySubject.get(subjectKey);

                // Keep only the latest record per chapter (query is sorted latest first).
                if (!chapterMap.has(chapterKey)) {
                    chapterMap.set(chapterKey, {
                        name: String(doc.chapterName || '').trim(),
                        isCompleted: Boolean(doc.isCompleted),
                        completedAt: doc.isCompleted ? (doc.completedAt || doc.updatedAt || null) : null,
                        isCompletionTracked: true,
                        trackingSource: 'chapterCompletion'
                    });
                }
            });

            // Build syllabus chapter map (used for ordered chapter list and fallback metadata).
            const syllabusDataMap = new Map();
            syllabusDocs.forEach(s => {
                const subjectKey = normalizeKey(s.subject);
                if (!subjectKey) return;
                syllabusDataMap.set(subjectKey, (s.chapters || []).map((chapter) => ({
                    name: String(chapter?.name || '').trim(),
                    isCompleted: Boolean(chapter?.isCompleted),
                    completedAt: chapter?.completedAt || null
                })));
            });

            // Merge chapter tracking and syllabus definitions for every known subject.
            const allSubjectKeys = new Set([
                ...completionBySubject.keys(),
                ...syllabusDataMap.keys(),
                ...Array.from(teachersMap.keys()).map((subject) => normalizeKey(subject)),
                ...subjectTotalMap.keys()
            ]);

            allSubjectKeys.forEach((subjectKey) => {
                if (!subjectKey) return;

                const completedChapterMap = completionBySubject.get(subjectKey) || new Map();
                const syllabusChapters = syllabusDataMap.get(subjectKey) || [];
                const totalFromSubjectCol = subjectTotalMap.get(subjectKey);

                // Prefer existing teacher map subject casing if available.
                const teacherSubjectName = Array.from(teachersMap.keys()).find((subject) => normalizeKey(subject) === subjectKey);
                const subjectFromSubjectDoc = batchSubjectDocs.find((subjectDoc) => normalizeKey(subjectDoc.name) === subjectKey)?.name;
                const subjectName = teacherSubjectName || subjectFromSubjectDoc || syllabusDocs.find((s) => normalizeKey(s.subject) === subjectKey)?.subject || subjectKey;

                if (!teachersMap.has(subjectName)) {
                    teachersMap.set(subjectName, 'Unassigned');
                }

                const chapters = [];
                const addedChapterKeys = new Set();

                // Preserve syllabus order and override completion state from ChapterCompletion when present.
                syllabusChapters.forEach(ch => {
                    const chapterKey = normalizeKey(ch.name);
                    if (!chapterKey || addedChapterKeys.has(chapterKey)) return;

                    const trackedChapter = completedChapterMap.get(chapterKey);
                    chapters.push({
                        name: ch.name,
                        isCompleted: trackedChapter ? trackedChapter.isCompleted : Boolean(ch.isCompleted),
                        completedAt: trackedChapter ? trackedChapter.completedAt : (ch.completedAt || null),
                        isCompletionTracked: Boolean(trackedChapter),
                        trackingSource: trackedChapter ? trackedChapter.trackingSource : 'syllabus'
                    });
                    addedChapterKeys.add(chapterKey);
                });

                // Add tracked chapters that were not listed in syllabus.
                completedChapterMap.forEach((trackedChapter, trackedKey) => {
                    if (addedChapterKeys.has(trackedKey)) return;
                    chapters.push({
                        name: trackedChapter.name,
                        isCompleted: trackedChapter.isCompleted,
                        completedAt: trackedChapter.completedAt,
                        isCompletionTracked: true,
                        trackingSource: trackedChapter.trackingSource
                    });
                    addedChapterKeys.add(trackedKey);
                });

                const completedCount = chapters.filter(c => c.isCompleted).length;
                const totalChapters = totalFromSubjectCol || chapters.length || syllabusChapters.length;
                const percentage = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
                const trackedCount = chapters.filter(c => c.isCompletionTracked).length;

                syllabusMap.set(subjectName, {
                    chapters,
                    completionPercentage: Math.min(percentage, 100),
                    totalChapters,
                    completedChapters: completedCount,
                    tracking: {
                        trackedChapters: trackedCount,
                        untrackedChapters: Math.max(totalChapters - trackedCount, 0),
                        source: 'chapterCompletion+syllabus'
                    }
                });
            });
        }

        // 5. Fetch Detailed Exams & Results ──────────────────────────────
        let examDetailsMap = new Map();
        let subjectStatsMap = new Map();
        if (student.batchId) {
            const allExams = await Exam.find({ batchId: student.batchId._id, status: { $ne: 'cancelled' } })
                .sort({ date: -1 })
                .lean();
                
            const allResults = await ExamResult.find({ studentId: student._id })
                .lean();
            
            const resultMap = new Map(allResults.map(r => [r.examId.toString(), r]));

            allExams.forEach(e => {
                if (!examDetailsMap.has(e.subject)) {
                    examDetailsMap.set(e.subject, []);
                }
                const result = resultMap.get(e._id.toString());

                if (result && result.isPresent) {
                    if (!subjectStatsMap.has(e.subject)) {
                        subjectStatsMap.set(e.subject, { totalObtained: 0, totalPossible: 0 });
                    }
                    const stats = subjectStatsMap.get(e.subject);
                    stats.totalObtained += result.marksObtained;
                    stats.totalPossible += e.totalMarks;
                }

                examDetailsMap.get(e.subject).push({
                    _id: e._id,
                    name: e.name,
                    chapter: e.chapter,
                    date: e.date,
                    totalMarks: e.totalMarks,
                    passingMarks: e.passingMarks,
                    type: e.type || 'Exam',
                    status: e.status,
                    marksObtained: result ? result.marksObtained : null,
                    isPresent: result ? result.isPresent : true,
                    percentage: result ? Math.round((result.marksObtained / e.totalMarks) * 100) : null
                });
            });
        }

        const subjectTeachers = Array.from(teachersMap.entries()).map(([subject, teacher]) => {
            let averageMarks = 0;
            if (subjectStatsMap.has(subject)) {
                const stats = subjectStatsMap.get(subject);
                averageMarks = Math.round((stats.totalObtained / stats.totalPossible) * 100);
            }

            const schedule = subjectSchedules.get(subject);
            const syllabus = syllabusMap.get(subject) || { chapters: [], completionPercentage: 0 };
            const exams = examDetailsMap.get(subject) || [];

            return {
                subject,
                teacher,
                teacherProfileImage: teacherProfileMap.get(teacher) || null,
                averageMarks,
                code: subjectCodeMap.get(subject) || null,
                rooms: schedule ? Array.from(schedule.rooms) : [],
                timings: schedule ? Array.from(schedule.timings) : [],
                syllabus,
                exams
            };
        });

        // Calculate Global Average
        let overallTotalObtained = 0;
        let overallTotalPossible = 0;
        subjectStatsMap.forEach(stats => {
            overallTotalObtained += stats.totalObtained;
            overallTotalPossible += stats.totalPossible;
        });
        const overallAverage = overallTotalPossible > 0
            ? Math.round((overallTotalObtained / overallTotalPossible) * 100)
            : 0;

        // Map real data from DB if available
        const profileData = {
            _id: student._id,
            name: student.name,
            rollNo: student.rollNo,
            email: student.email || 'N/A',
            contact: student.contact || 'N/A',
            className: student.className,
            batchName: student.batchId ? student.batchId.name : 'N/A',
            activeBatchId: student.batchId ? student.batchId._id : null,
            fullBatchData: student.batchId || null,
            fees: student.fees || 0,
            registrationFee: student.registrationFee || 0,
            feesPaid: student.feesPaid || 0,
            profileImage: student.profileImage || null,
            fatherName: student.fatherName || 'N/A',
            motherName: student.motherName || 'N/A',
            dob: student.dob,
            gender: student.gender,
            address: student.address,
            admissionDate: student.admissionDate,
            session: student.session,
            status: student.status,
            subjectTeachers,
            roomAllocation,
            overallAverage
        };

        const attendance = await getAttendanceSnapshot(student._id);
        profileData.attendanceSummary = attendance.summary;
        profileData.attendanceSubjects = attendance.subjects;
        profileData.attendanceRecent = attendance.recent;

        res.json({ success: true, student: profileData });
    } catch (error) {
        console.error('Error fetching student profile:', error);
        sendApiError(res, error, 'Unable to fetch student profile right now.');
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
        }

        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, student.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password.' });
        }

        // Update password (pre-save hook will hash it)
        student.password = newPassword;
        await student.save();

        await invalidateUserCache(student._id.toString());

        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        sendApiError(res, error, 'Unable to reset password right now.');
    }
};
// Complete Setup (First Login)
exports.completeSetup = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const student = await Student.findById(req.user.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const needsSetup = student.isFirstLogin || !student.profileImage;
        if (!needsSetup) {
            return res.status(400).json({ success: false, message: 'Setup already completed' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a professional profile picture' });
        }

        // Update password
        if (newPassword) {
            student.password = newPassword;
        }

        // Save image path and mark setup as complete
        student.profileImage = req.file.path; // Cloudinary URL
        student.isFirstLogin = false;
        student.portalAccess = {
            ...(student.portalAccess || {}),
            signupStatus: 'yes',
            signedUpAt: student.portalAccess?.signedUpAt || new Date(),
            lastLoginAt: student.portalAccess?.lastLoginAt || new Date()
        };

        await student.save();

        await invalidateUserCache(student._id.toString());

        res.json({
            success: true,
            message: 'Setup completed successfully',
            student: {
                profileImage: student.profileImage,
                isFirstLogin: student.isFirstLogin,
                needsSetup: false
            }
        });
    } catch (error) {
        console.error('CRITICAL ERROR in completeSetup:', error);
        sendApiError(res, error, 'Unable to complete setup right now.');
    }
};
