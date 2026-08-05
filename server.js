const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ARRENDADORES API ====================
app.get('/api/arrendadores', (req, res) => {
  db.all('SELECT * FROM arrendadores', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/arrendadores', (req, res) => {
  const { id, nombre, cedula, ruc, direccion, celular, email } = req.body;
  if (!nombre || !cedula) {
    return res.status(400).json({ error: 'Nombre y Cédula son obligatorios' });
  }
  const query = `INSERT INTO arrendadores (id, nombre, cedula, ruc, direccion, celular, email) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [id || 'arr' + Date.now(), nombre, cedula, ruc, direccion, celular, email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Arrendador creado', id: this.lastID });
  });
});

app.put('/api/arrendadores/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, ruc, direccion, celular, email } = req.body;
  const query = `UPDATE arrendadores SET nombre = ?, cedula = ?, ruc = ?, direccion = ?, celular = ?, email = ? WHERE id = ?`;
  db.run(query, [nombre, cedula, ruc, direccion, celular, email, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Arrendador actualizado', changes: this.changes });
  });
});

app.delete('/api/arrendadores/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM arrendadores WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Arrendador eliminado', changes: this.changes });
  });
});

// ==================== VEHICULOS API ====================
app.get('/api/vehiculos', (req, res) => {
  db.all('SELECT * FROM vehiculos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/vehiculos', (req, res) => {
  const { id, placa, marca, modelo, año, color, motor, chasis, img1, img2 } = req.body;
  if (!placa || !marca || !modelo) {
    return res.status(400).json({ error: 'Placa, Marca y Modelo son obligatorios' });
  }
  const query = `INSERT INTO vehiculos (id, placa, marca, modelo, año, color, motor, chasis, img1, img2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [id || 'v' + Date.now(), placa, marca, modelo, año, color, motor, chasis, img1, img2], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo creado', id: this.lastID });
  });
});

app.put('/api/vehiculos/:id', (req, res) => {
  const { id } = req.params;
  const { placa, marca, modelo, año, color, motor, chasis, img1, img2 } = req.body;
  const query = `UPDATE vehiculos SET placa = ?, marca = ?, modelo = ?, año = ?, color = ?, motor = ?, chasis = ?, img1 = ?, img2 = ? WHERE id = ?`;
  db.run(query, [placa, marca, modelo, año, color, motor, chasis, img1, img2, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo actualizado', changes: this.changes });
  });
});

app.delete('/api/vehiculos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM vehiculos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehículo eliminado', changes: this.changes });
  });
});

// ==================== CLIENTES API ====================
app.get('/api/clientes', (req, res) => {
  db.all('SELECT * FROM clientes', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/clientes', (req, res) => {
  const { id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal } = req.body;
  if (!nombres || !cedula) {
    return res.status(400).json({ error: 'Nombres y Cédula son obligatorios' });
  }
  const query = `INSERT INTO clientes (id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [id || 'c' + Date.now(), nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente creado', id: this.lastID });
  });
});

app.put('/api/clientes/:id', (req, res) => {
  const { id } = req.params;
  const { nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal } = req.body;
  const query = `UPDATE clientes SET nombres = ?, cedula = ?, telefono = ?, ciudad = ?, refLaboral = ?, telLaboral = ?, refPersonal = ?, telPersonal = ? WHERE id = ?`;
  db.run(query, [nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente actualizado', changes: this.changes });
  });
});

app.delete('/api/clientes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM clientes WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente eliminado', changes: this.changes });
  });
});

// ==================== CONTRATOS API ====================
app.get('/api/contratos', (req, res) => {
  db.all('SELECT * FROM contratos ORDER BY rowid DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/contratos', (req, res) => {
  const { id, cliente, placa, marca, modelo, precio, dias, fecha, dueñoNombre } = req.body;
  const query = `INSERT INTO contratos (id, cliente, placa, marca, modelo, precio, dias, fecha, dueñoNombre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [id || 'ct' + Date.now(), cliente, placa, marca, modelo, parseFloat(precio), parseInt(dias), fecha, dueñoNombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Contrato registrado', id: this.lastID });
  });
});

app.delete('/api/contratos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM contratos WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Contrato eliminado', changes: this.changes });
  });
});

// ==================== TEMPORARY MIGRATION API ====================
app.get('/api/migrate', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(400).json({ error: 'DATABASE_URL no está configurada.' });
  }

  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS arrendadores (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        cedula TEXT NOT NULL,
        ruc TEXT,
        direccion TEXT,
        celular TEXT,
        email TEXT
      );
    `);

    await client.query(`
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
      );
    `);

    await client.query(`
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
      );
    `);

    await client.query(`
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
      );
    `);

    // Insert basic seed data if empty
    const checkArrendadores = await client.query('SELECT COUNT(*) FROM arrendadores');
    if (parseInt(checkArrendadores.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO arrendadores (id, nombre, cedula, ruc, direccion, celular, email)
        VALUES ('arr1', 'GUALE SANTANA BYRON JOSHUE', '135079905-0', '1350799050001', 'Barrio Costa Azul, Manta', '0998799579', 'g.byron@hotmail.com')
      `);
    }

    const checkVehiculos = await client.query('SELECT COUNT(*) FROM vehiculos');
    if (parseInt(checkVehiculos.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO vehiculos (id, placa, marca, modelo, año, color, motor, chasis, img1, img2)
        VALUES 
        ('v1', 'GSR6847', 'CHEVROLET', 'SPARK GT', 2016, 'CELESTE', '1.2L DOHC', '', '', ''),
        ('v2', 'PDR4115', 'DONGFENG', 'RICH 6', 2022, 'ROJO', '', '', '', ''),
        ('v3', 'MBG1467', 'CHERY', 'TIGGO 2 PRO', 2023, 'AZUL', '', '', '', ''),
        ('v4', 'MBF6347', 'ISUZU', 'TERRALORD', 2023, 'NEGRA', 'TURBO DIESEL', '', '', '')
      `);
    }

    const checkClientes = await client.query('SELECT COUNT(*) FROM clientes');
    if (parseInt(checkClientes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO clientes (id, nombres, cedula, telefono, ciudad, refLaboral, telLaboral, refPersonal, telPersonal)
        VALUES 
        ('c1', 'RODRÍGUEZ CALLE ERICK ISAAC', '1310768641', '+593 97 886 1195', 'MANTA', '', '', '', ''),
        ('c2', 'ZAMBRANO GARCES GAILER GILSON', '1726470790', '0968656392', 'MANTA', '', '', '', '')
      `);
    }

    await client.end();
    res.json({ success: true, message: 'Tablas de base de datos creadas y datos iniciales insertados con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
