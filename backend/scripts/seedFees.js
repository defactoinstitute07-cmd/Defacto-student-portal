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
            { month: 'September', year: 2025, status: 'paid', tuition: 2500, reg: 1000, books: 500 },
            { month: 'October', year: 2025, status: 'paid', tuition: 2500, reg: 0, lab: 150 },
            { month: 'November', year: 2025, status: 'paid', tuition: 2500, reg: 0, activity: 200 },
            { month: 'December', year: 2025, status: 'paid', tuition: 2500, reg: 0, books: 300 },
            { month: 'January', year: 2026, status: 'paid', tuition: 2600, reg: 0, lab: 150 },
            { month: 'February', year: 2026, status: 'partial', tuition: 2600, reg: 0, paid: 1500 },
            { month: 'March', year: 2026, status: 'pending', tuition: 2600, reg: 0 }
        ];

        for (const m of months) {
            const otherExpenses = [];
            if (m.books) otherExpenses.push({ title: 'Books', amount: m.books });
            if (m.lab) otherExpenses.push({ title: 'Lab Fee', amount: m.lab });
            if (m.activity) otherExpenses.push({ title: 'Activity Fee', amount: m.activity });

            const feeData = {
                studentId: student._id,
                monthlyTuitionFee: m.tuition,
                registrationFee: m.reg || 0,
                otherExpenses: otherExpenses,
                month: m.month,
                year: m.year,
                status: m.status,
                fine: m.status === 'overdue' ? 200 : 0
            };

            // Calculate total totalFee for the specific month
            const total = (m.tuition || 0) + (m.reg || 0) + otherExpenses.reduce((sum, e) => sum + e.amount, 0) + (feeData.fine || 0);

            if (m.status === 'paid') {
                feeData.amountPaid = total;
                feeData.paidDate = new Date(`${m.month} 05, ${m.year}`);
                feeData.paymentHistory = [{
                    paidAmount: total,
                    paymentMethod: 'UPI',
                    transactionId: `TXN₹{Math.random().toString(36).slice(2, 11).toUpperCase()}`,
                    receiptNo: `REC-${m.month.slice(0,3).toUpperCase()}-${m.year}-001`,
                    date: feeData.paidDate
                }];
            } else if (m.status === 'partial') {
                feeData.amountPaid = m.paid || 1500;
                feeData.paidDate = new Date(`${m.month} 10, ${m.year}`);
                feeData.paymentHistory = [{
                    paidAmount: feeData.amountPaid,
                    paymentMethod: 'Cash',
                    receiptNo: `REC-${m.month.slice(0,3).toUpperCase()}-${m.year}-002`,
                    date: feeData.paidDate
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
