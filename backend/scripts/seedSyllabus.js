const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const BATCHES = [
    { id: '69b94259edf3a9f7ba4d2baa', name: 'PCM', subjects: ['Physics', 'Chemistry', 'Math'] },
    { id: '69b9459615c71461d447e79a', name: 'PCB', subjects: ['Physics', 'Chemistry', 'Biology'] }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        for (const batch of BATCHES) {
            console.log(`Seeding ${batch.name} (${batch.id})...`);
            
            const student = await Student.findOne({ batchId: batch.id });
            if (!student) {
                console.log(`No student found for ${batch.name}. Skipping exams/results.`);
            }

            // 1. Seed Syllabus
            await Syllabus.deleteMany({ batchId: batch.id });
            for (const sub of batch.subjects) {
                await Syllabus.create({
                    subject: sub,
                    batchId: batch.id,
                    chapters: [
                        { name: 'Introduction', isCompleted: true, completedAt: new Date('2026-02-01') },
                        { name: 'Basic Concepts', isCompleted: true, completedAt: new Date('2026-02-15') },
                        { name: 'Advanced Topics', isCompleted: false },
                        { name: 'Revision', isCompleted: false }
                    ]
                });
            }

            if (student) {
                // 2. Seed Exams
                await Exam.deleteMany({ batchId: batch.id });
                await ExamResult.deleteMany({ batchId: batch.id, studentId: student._id });

                for (const sub of batch.subjects) {
                    // Assignment
                    const assignment = await Exam.create({
                        name: `${sub} Assignment 1`,
                        subject: sub,
                        chapter: 'Introduction',
                        batchId: batch.id,
                        date: new Date('2026-02-10'),
                        totalMarks: 50,
                        type: 'Assignment',
                        status: 'completed'
                    });
                    await ExamResult.create({
                        examId: assignment._id,
                        studentId: student._id,
                        batchId: batch.id,
                        marksObtained: 45
                    });

                    // Quiz
                    const quiz = await Exam.create({
                        name: `${sub} Surprise Quiz`,
                        subject: sub,
                        chapter: 'Basic Concepts',
                        batchId: batch.id,
                        date: new Date('2026-03-01'),
                        totalMarks: 20,
                        type: 'Quiz',
                        status: 'completed'
                    });
                    await ExamResult.create({
                        examId: quiz._id,
                        studentId: student._id,
                        batchId: batch.id,
                        marksObtained: 18
                    });

                    // Mid-term Exam
                    const exam = await Exam.create({
                        name: `${sub} Mid-term`,
                        subject: sub,
                        chapter: 'Chapters 1-3',
                        batchId: batch.id,
                        date: new Date('2026-03-15'),
                        totalMarks: 100,
                        type: 'Exam',
                        status: 'completed'
                    });
                    await ExamResult.create({
                        examId: exam._id,
                        studentId: student._id,
                        batchId: batch.id,
                        marksObtained: 88
                    });
                }
            }
        }
        console.log('Seeding complete.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
