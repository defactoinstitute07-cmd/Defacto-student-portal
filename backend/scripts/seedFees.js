const mongoose = require('mongoose');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const seedFees = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const student = await Student.findOne();
        if (!student) {
            console.error('No student found in database. Please register a student first.');
            process.exit(1);
        }

        // Add some dummy info if missing for better receipt testing
        if (!student.fatherName || student.fatherName === 'N/A') {
            student.fatherName = 'Ram Singh';
            student.motherName = 'Sita Devi';
            student.contact = '9876543210';
            student.dob = new Date('2005-01-01');
            student.gender = 'Male';
            student.address = '123, Main Street, Patna, Bihar';
            student.email = student.rollNo + '@example.com';
            await student.save();
        }

        console.log(`Found student: ${student.name} (${student.rollNo})`);

        const months = [
            { month: 'January', year: 2026, status: 'paid' },
            { month: 'February', year: 2026, status: 'partial' },
            { month: 'March', year: 2026, status: 'pending' }
        ];

        for (const m of months) {
            const feeData = {
                studentId: student._id,
                monthlyTuitionFee: 2500,
                registrationFee: m.month === 'January' ? 1000 : 0,
                otherExpenses: [
                    { title: 'Books', amount: 500 }
                ],
                month: m.month,
                year: m.year,
                status: m.status,
                fine: m.status === 'overdue' ? 200 : 0
            };

            if (m.status === 'paid') {
                feeData.amountPaid = 4000; // 2500 + 1000 + 500
                feeData.paymentHistory = [{
                    paidAmount: 4000,
                    paymentMethod: 'UPI',
                    transactionId: 'TXN123456789',
                    receiptNo: `REC-${m.month.slice(0,3).toUpperCase()}-001`,
                    date: new Date()
                }];
            } else if (m.status === 'partial') {
                feeData.amountPaid = 1500;
                feeData.paymentHistory = [{
                    paidAmount: 1500,
                    paymentMethod: 'Cash',
                    receiptNo: `REC-${m.month.slice(0,3).toUpperCase()}-002`,
                    date: new Date()
                }];
            }

            // check if exists
            const existing = await Fee.findOne({ studentId: student._id, month: m.month, year: m.year });
            if (existing) {
                console.log(`Updating fee for ${m.month} ${m.year}`);
                Object.assign(existing, feeData);
                await existing.save();
            } else {
                console.log(`Creating fee for ${m.month} ${m.year}`);
                const fee = new Fee(feeData);
                await fee.save();
            }
        }

        console.log('Fee data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedFees();
