require('dotenv').config();
const db = require('./config/postgres');

async function createLiveData() {
    try {
        const studentId = '69c14127368af9612ff37381'; // Rishabh Bisht

        // 1. Delete the old mapped record we used for testing
        await db.query(`DELETE FROM fees WHERE student_id = $1`, [studentId]);

        // 2. Insert new realistic fee records
        const query = `
            INSERT INTO fees (
                student_id, batch_id, monthly_tuition_fee, registration_fee, 
                other_expenses, total_fee, amount_paid, pending_amount, 
                due_date, paid_date, status, fine, month, year, payment_history
            ) VALUES 
            (
                $1, null, 2500, 500, 
                '[]'::jsonb, 3000, 3000, 0, 
                '2026-02-10 00:00:00', '2026-02-09 10:30:00', 'paid', 0, 'February', 2026, 
                '[{"date":"2026-02-09T10:30:00.000Z", "amount":3000, "method":"UPI"}]'::jsonb
            ),
            (
                $1, null, 2500, 0, 
                '[{"title":"Library Fee","amount":200}]'::jsonb, 2700, 0, 2700, 
                '2026-03-10 00:00:00', null, 'pending', 0, 'March', 2026, 
                '[]'::jsonb
            );
        `;

        await db.query(query, [studentId]);
        
        console.log('Successfully deleted old test data and created 2 realistic live records (1 Paid, 1 Pending) for your dashboard!');
    } catch (e) {
        console.error('Error generating live data:', e);
    } finally {
        process.exit(0);
    }
}

createLiveData();
