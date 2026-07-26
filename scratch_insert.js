const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'rentcar.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database at:', dbPath);
  insertData();
});

function insertData() {
  db.serialize(() => {
    // 1. Insert Arrendador: BRYAN RAFAEL GUALE SANTANA
    const stmtArr = db.prepare(`
      INSERT OR REPLACE INTO arrendadores (id, nombre, cedula, ruc, direccion, celular, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmtArr.run(
      'arr_rafael',
      'BRYAN RAFAEL GUALE SANTANA',
      '1315077261',
      '1315077261001',
      'MANTA',
      '0984280334',
      'bguale@gmail.com',
      (err) => {
        if (err) console.error('Error inserting Arrendador:', err.message);
        else console.log('Arrendador BRYAN RAFAEL GUALE SANTANA inserted successfully.');
      }
    );
    stmtArr.finalize();

    // 2. Insert Client: MANUEL RICARDO VELASQUEZ
    const stmtCli = db.prepare(`
      INSERT OR REPLACE INTO clientes (id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmtCli.run(
      'c_manuel',
      'MANUEL RICARDO VELASQUEZ',
      '1069765244',
      '0998309141',
      'MANTA',
      '', '', '', '',
      (err) => {
        if (err) console.error('Error inserting Client:', err.message);
        else console.log('Client MANUEL RICARDO VELASQUEZ inserted successfully.');
      }
    );
    stmtCli.finalize();
  });
}
