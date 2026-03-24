require('dotenv').config();
const db = require('./config/postgres');
async function check() {
    try {
        const b = await db.query('SELECT * FROM "FeeBalance" LIMIT 2');
        const p = await db.query('SELECT * FROM "FeePayment" LIMIT 2');
        const fs = require('fs');
        const out = {};
        if (b.rows.length) out.FeeBalance = b.rows[0];
        if (p.rows.length) out.FeePayment = p.rows[0];
        fs.writeFileSync('schema_dump.json', JSON.stringify(out, null, 2));
    } catch(e) { console.error(e); }
    process.exit(0);
}
check();
