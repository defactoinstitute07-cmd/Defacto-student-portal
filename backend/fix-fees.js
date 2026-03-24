require('dotenv').config();
const db = require('./config/postgres');

async function fix() {
    try {
        const result = await db.query(
            "UPDATE fees SET student_id = '69c14127368af9612ff37381' WHERE student_id = '69b10806185468e97a6a5514'"
        );
        console.log('Updated rows:', result.rowCount);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

fix();
