const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/postgres');
const Fee = require('../models/Fee'); // Assuming MongoDB Fee model still exists

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB`);

        const mongoFees = await Fee.find({}).lean();
        console.log(`Found ${mongoFees.length} fees in MongoDB`);

        let insertedCount = 0;

        for (const fee of mongoFees) {
            try {
                // Ensure array formats are correct
                const otherExpenses = fee.otherExpenses ? JSON.stringify(fee.otherExpenses) : '[]';
                const paymentHistory = fee.paymentHistory ? JSON.stringify(fee.paymentHistory) : '[]';
                
                await db.query(`
                    INSERT INTO fees (
                        student_id, batch_id, monthly_tuition_fee, registration_fee, 
                        other_expenses, total_fee, amount_paid, pending_amount, 
                        due_date, paid_date, status, fine, month, year, payment_history, created_at
                    ) VALUES (
                        $1, $2, $3, $4, 
                        $5::jsonb, $6, $7, $8, 
                        $9, $10, $11, $12, $13, $14, $15::jsonb, $16
                    ) ON CONFLICT (student_id, month, year) DO NOTHING
                `, [
                    fee.studentId.toString(),
                    fee.batchId ? fee.batchId.toString() : null,
                    fee.monthlyTuitionFee || 0,
                    fee.registrationFee || 0,
                    otherExpenses,
                    fee.totalFee || 0,
                    fee.amountPaid || 0,
                    fee.pendingAmount || 0,
                    fee.dueDate || null,
                    fee.paidDate || null,
                    fee.status || 'pending',
                    fee.fine || 0,
                    fee.month || null,
                    fee.year || new Date().getFullYear(),
                    paymentHistory,
                    fee.createdAt || new Date()
                ]);
                insertedCount++;
            } catch (err) {
                console.error('Error inserting fee:', err.message);
            }
        }
        
        console.log(`Successfully migrated ${insertedCount} fees to Postgres`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

migrate();
