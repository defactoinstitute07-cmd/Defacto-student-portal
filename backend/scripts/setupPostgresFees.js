const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: { rejectUnauthorized: false }
});

const createFeesTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fees (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(24) NOT NULL,
                batch_id VARCHAR(24),
                monthly_tuition_fee NUMERIC NOT NULL,
                registration_fee NUMERIC DEFAULT 0,
                other_expenses JSONB DEFAULT '[]'::jsonb,
                total_fee NUMERIC,
                amount_paid NUMERIC DEFAULT 0,
                pending_amount NUMERIC,
                due_date TIMESTAMP,
                paid_date TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending',
                fine NUMERIC DEFAULT 0,
                receipt VARCHAR(255),
                month VARCHAR(20),
                year INTEGER,
                payment_history JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, month, year)
            );
        `);
        console.log('Fees table created successfully.');
    } catch (error) {
        console.error('Error creating fees table:', error);
    } finally {
        pool.end();
    }
};

createFeesTable();
