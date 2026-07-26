require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('ERROR: No se detectó DATABASE_URL en el archivo .env.');
  process.exit(1);
}

// Connect to Local SQLite
const sqDbPath = path.join(__dirname, 'rentcar.db');
const sqDb = new sqlite3.Database(sqDbPath, (err) => {
  if (err) {
    console.error('Error al abrir SQLite local:', err.message);
    process.exit(1);
  }
  console.log('1. Conectado a base de datos SQLite local.');
});

// Connect to Supabase Postgres
const pgClient = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await pgClient.connect();
    console.log('2. Conectado a Supabase (PostgreSQL). Iniciando migración...');

    // --- Migrate Arrendadores ---
    const arrendadores = await new Promise((res, rej) => {
      sqDb.all('SELECT * FROM arrendadores', [], (err, rows) => err ? rej(err) : res(rows));
    });
    console.log(`- Migrando ${arrendadores.length} arrendadores...`);
    for (const a of arrendadores) {
      await pgClient.query(
        `INSERT INTO arrendadores (id, nombre, cedula, ruc, direccion, celular, email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET 
         nombre=$2, cedula=$3, ruc=$4, direccion=$5, celular=$6, email=$7`,
        [a.id, a.nombre, a.cedula, a.ruc, a.direccion, a.celular, a.email]
      );
    }

    // --- Migrate Vehiculos ---
    const vehiculos = await new Promise((res, rej) => {
      sqDb.all('SELECT * FROM vehiculos', [], (err, rows) => err ? rej(err) : res(rows));
    });
    console.log(`- Migrando ${vehiculos.length} vehículos...`);
    for (const v of vehiculos) {
      await pgClient.query(
        `INSERT INTO vehiculos (id, placa, marca, modelo, año, color, motor, chasis, img1, img2) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET 
         placa=$2, marca=$3, modelo=$4, año=$5, color=$6, motor=$7, chasis=$8, img1=$9, img2=$10`,
        [v.id, v.placa, v.marca, v.modelo, v.año, v.color, v.motor, v.chasis, v.img1, v.img2]
      );
    }

    // --- Migrate Clientes ---
    const clientes = await new Promise((res, rej) => {
      sqDb.all('SELECT * FROM clientes', [], (err, rows) => err ? rej(err) : res(rows));
    });
    console.log(`- Migrando ${clientes.length} clientes...`);
    for (const c of clientes) {
      await pgClient.query(
        `INSERT INTO clientes (id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO UPDATE SET 
         nombres=$2, cedula=$3, telefono=$4, ciudad=$5, refLaboral=$6, telLaboral=$7, refPersonal=$8, telPersonal=$9`,
        [c.id, c.nombres, c.cedula, c.telefono, c.ciudad, c.refLaboral, c.telLaboral, c.refPersonal, c.telPersonal]
      );
    }

    // --- Migrate Contratos ---
    const contratos = await new Promise((res, rej) => {
      sqDb.all('SELECT * FROM contratos', [], (err, rows) => err ? rej(err) : res(rows));
    });
    console.log(`- Migrando ${contratos.length} contratos...`);
    for (const ct of contratos) {
      await pgClient.query(
        `INSERT INTO contratos (id, cliente, placa, marca, modelo, precio, dias, fecha, dueñoNombre) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
        [ct.id, ct.cliente, ct.placa, ct.marca, ct.modelo, ct.precio, ct.dias, ct.fecha, ct.dueñoNombre]
      );
    }

    console.log('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!');
  } catch (err) {
    console.error('Error durante la migración:', err.message);
  } finally {
    sqDb.close();
    await pgClient.end();
  }
}

runMigration();
