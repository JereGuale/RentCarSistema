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

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
