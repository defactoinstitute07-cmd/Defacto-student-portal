require('dotenv').config();
const db = require('./config/postgres');

async function describeTables() {
    try {
        const query = `
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('FeeStructure', 'FeePayment', 'FeeBalance')
            ORDER BY table_name, ordinal_position;
        `;
        const res = await db.query(query);
        
        let struct = {};
        res.rows.forEach(r => {
            if (!struct[r.table_name]) struct[r.table_name] = [];
            struct[r.table_name].push(`${r.column_name} (${r.data_type})`);
        });
        
        console.log(JSON.stringify(struct, null, 2));
        
        // Let's also grab one sample row from each to see what "live data" looks like
        const b = await db.query('SELECT * FROM "FeeBalance" LIMIT 1');
        console.log("FeeBalance Sample:", b.rows[0]);
        
        const p = await db.query('SELECT * FROM "FeePayment" LIMIT 1');
        console.log("FeePayment Sample:", p.rows[0]);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

describeTables();
