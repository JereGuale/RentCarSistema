require('dotenv').config();
const path = require('path');

// Helper to translate SQLite query placeholders (?) to PostgreSQL ($1, $2, etc)
function sqliteToPgQuery(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

let db;

if (process.env.DATABASE_URL) {
  // CONNECT TO SUPABASE (PostgreSQL)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase connection
  });

  console.log('Using Supabase (PostgreSQL) database connection.');

  db = {
    all(sql, params, callback) {
      // Fix potential rowid query difference since PostgreSQL doesn't have native rowid
      let pgSql = sql.replace(/ORDER BY rowid DESC/i, 'ORDER BY id DESC');
      pgSql = sqliteToPgQuery(pgSql);
      
      pool.query(pgSql, params)
        .then(result => callback(null, result.rows))
        .catch(err => {
          console.error('Postgres error in db.all:', err.message);
          callback(err);
        });
    },
    get(sql, params, callback) {
      const pgSql = sqliteToPgQuery(sql);
      pool.query(pgSql, params)
        .then(result => callback(null, result.rows[0] || null))
        .catch(err => {
          console.error('Postgres error in db.get:', err.message);
          callback(err);
        });
    },
    run(sql, params, callback) {
      const pgSql = sqliteToPgQuery(sql);
      pool.query(pgSql, params)
        .then(result => {
          const ctx = { lastID: null, changes: result.rowCount };
          callback.call(ctx, null);
        })
        .catch(err => {
          console.error('Postgres error in db.run:', err.message);
          callback(err);
        });
    }
  };
} else {
  // CONNECT TO LOCAL SQLITE
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'rentcar.db');
  const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening local SQLite database:', err.message);
    } else {
      console.log('Connected to local SQLite database at:', dbPath);
      initializeDatabase(sqliteDb);
    }
  });

  db = {
    all(sql, params, callback) {
      sqliteDb.all(sql, params, callback);
    },
    get(sql, params, callback) {
      sqliteDb.get(sql, params, callback);
    },
    run(sql, params, callback) {
      sqliteDb.run(sql, params, callback);
    }
  };
}

function initializeDatabase(sqliteDb) {
  sqliteDb.serialize(() => {
    // 1. Arrendadores Table
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS arrendadores (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cedula TEXT NOT NULL,
        ruc TEXT,
        direccion TEXT,
        celular TEXT,
        email TEXT
      )
    `);

    // 2. Vehículos Table
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS vehiculos (
        id TEXT PRIMARY KEY,
        placa TEXT NOT NULL UNIQUE,
        marca TEXT NOT NULL,
        modelo TEXT NOT NULL,
        año INTEGER,
        color TEXT,
        motor TEXT,
        chasis TEXT,
        img1 TEXT,
        img2 TEXT
      )
    `);

    // 3. Clientes Table
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombres TEXT NOT NULL,
        cedula TEXT NOT NULL,
        telefono TEXT,
        ciudad TEXT,
        refLaboral TEXT,
        telLaboral TEXT,
        refPersonal TEXT,
        telPersonal TEXT
      )
    `);

    // 4. Contratos Table
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS contratos (
        id TEXT PRIMARY KEY,
        cliente TEXT NOT NULL,
        placa TEXT NOT NULL,
        marca TEXT,
        modelo TEXT,
        precio REAL,
        dias INTEGER,
        fecha TEXT,
        dueñoNombre TEXT
      )
    `);

    // Seed Data
    seedData(sqliteDb);
  });
}

function seedData(sqliteDb) {
  // Check if arrendadores table is empty
  sqliteDb.get('SELECT COUNT(*) as count FROM arrendadores', [], (err, row) => {
    if (!err && row.count === 0) {
      sqliteDb.run(`
        INSERT INTO arrendadores (id, nombre, cedula, ruc, direccion, celular, email)
        VALUES ('arr1', 'GUALE SANTANA BYRON JOSHUE', '135079905-0', '1350799050001', 'Barrio Costa Azul, Manta', '0998799579', 'g.byron@hotmail.com')
      `);
    }
  });

  // Check if vehiculos table is empty
  sqliteDb.get('SELECT COUNT(*) as count FROM vehiculos', [], (err, row) => {
    if (!err && row.count === 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO vehiculos (id, placa, marca, modelo, año, color, motor, chasis, img1, img2)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('v1', 'GSR6847', 'CHEVROLET', 'SPARK GT', 2016, 'CELESTE', '1.2L DOHC', '', '', '');
      stmt.run('v2', 'PDR4115', 'DONGFENG', 'RICH 6', 2022, 'ROJO', '', '', '', '');
      stmt.run('v3', 'MBG1467', 'CHERY', 'TIGGO 2 PRO', 2023, 'AZUL', '', '', '', '');
      stmt.run('v4', 'MBF6347', 'ISUZU', 'TERRALORD', 2023, 'NEGRA', 'TURBO DIESEL', '', '', '');
      stmt.finalize();
    }
  });

  // Check if clientes table is empty
  sqliteDb.get('SELECT COUNT(*) as count FROM clientes', [], (err, row) => {
    if (!err && row.count === 0) {
      const stmt = sqliteDb.prepare(`
        INSERT INTO clientes (id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('c1', 'RODRÍGUEZ CALLE ERICK ISAAC', '1310768641', '+593 97 886 1195', 'MANTA', '', '', '', '');
      stmt.run('c2', 'ZAMBRANO GARCES GAILER GILSON', '1726470790', '0968656392', 'MANTA', '', '', '', '');
      stmt.finalize();
    }
  });
}

module.exports = db;
