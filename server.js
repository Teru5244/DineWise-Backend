const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// SQLite Database Setup
// ----------------------
const db = new sqlite3.Database('./dinewise.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // Create Restaurants table
    db.run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        cuisine TEXT
      )
    `);

    // Create Reservations table (with customer_name and phone_number)
    db.run(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        reservation_time TEXT,
        customer_name TEXT,
        phone_number TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `);

    // Create Queue table
    db.run(`
      CREATE TABLE IF NOT EXISTS queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        customer_name TEXT,
        phone_number TEXT,
        join_time TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `);

    // Seed sample restaurant data if table is empty
    db.get(`SELECT COUNT(*) as count FROM restaurants`, (err, row) => {
      if (err) {
        console.error(err.message);
      } else if (row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO restaurants (name, location, cuisine) VALUES (?, ?, ?)
        `);
        stmt.run("The Italian Place", "123 Main St", "Italian");
        stmt.run("Sushi World", "456 Ocean Ave", "Japanese");
        stmt.run("Burger Joint", "789 Market Rd", "American");
        stmt.finalize();
        console.log("Seeded restaurants table with sample data.");
      }
    });
  }
});

// ----------------------
// Restaurant Endpoints
// ----------------------

// GET /restaurants - Retrieve list of restaurants
app.get('/restaurants', (req, res) => {
  db.all(`SELECT * FROM restaurants`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ restaurants: rows });
  });
});

// ----------------------
// Reservation Endpoints
// ----------------------

// POST /reservations - Create a new reservation (30-minute timeslot, max 5 per slot)
app.post('/reservations', (req, res) => {
  const { restaurant_id, reservation_time, customer_name, phone_number } = req.body;
  if (!restaurant_id || !reservation_time || !customer_name || !phone_number) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  
  // Round reservation_time to nearest 30 minutes
  let date = new Date(reservation_time);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const timeslot = date.toISOString();
  
  // Check if timeslot already has 5 reservations
  const checkSql = `SELECT COUNT(*) as count FROM reservations WHERE restaurant_id = ? AND reservation_time = ?`;
  db.get(checkSql, [restaurant_id, timeslot], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count >= 5) {
      return res.status(400).json({ error: "This timeslot is fully booked. Please choose a different time." });
    }
    // Insert the new reservation
    const sql = `
      INSERT INTO reservations (restaurant_id, reservation_time, customer_name, phone_number)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [restaurant_id, timeslot, customer_name, phone_number], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ reservation_id: this.lastID, timeslot });
    });
  });
});

// GET /reservations - Retrieve reservations for a restaurant
app.get('/reservations', (req, res) => {
  const { restaurant_id } = req.query;
  if (!restaurant_id) return res.status(400).json({ error: "Missing required query parameter: restaurant_id" });
  const sql = `SELECT * FROM reservations WHERE restaurant_id = ? ORDER BY reservation_time ASC`;
  db.all(sql, [restaurant_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ reservations: rows });
  });
});

// DELETE /reservations/:id - Delete a reservation
app.delete('/reservations/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM reservations WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Reservation not found." });
    res.json({ success: true });
  });
});

// ----------------------
// Queue Endpoints
// ----------------------

// POST /queue - Customer joins the queue
app.post('/queue', (req, res) => {
  const { restaurant_id, customer_name, phone_number } = req.body;
  if (!restaurant_id || !customer_name || !phone_number) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  const join_time = new Date().toISOString();
  const sql = `
    INSERT INTO queue (restaurant_id, customer_name, phone_number, join_time)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [restaurant_id, customer_name, phone_number, join_time], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const queue_id = this.lastID;
    // Determine position by counting earlier join_time entries
    const countSql = `
      SELECT COUNT(*) as count FROM queue
      WHERE restaurant_id = ? AND join_time < ?
    `;
    db.get(countSql, [restaurant_id, join_time], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const position = row.count + 1;
      res.status(201).json({ queue_id, position });
    });
  });
});

// GET /queue - Retrieve the entire queue for a restaurant
app.get('/queue', (req, res) => {
  const { restaurant_id } = req.query;
  if (!restaurant_id) return res.status(400).json({ error: "Missing query parameter: restaurant_id" });
  const sql = `
    SELECT * FROM queue
    WHERE restaurant_id = ?
    ORDER BY join_time ASC
  `;
  db.all(sql, [restaurant_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ queue: rows });
  });
});

// GET /queue/status - Check a customer's queue status using customer_name, phone_number, and restaurant_id
app.get('/queue/status', (req, res) => {
  const { customer_name, phone_number, restaurant_id } = req.query;
  if (!customer_name || !phone_number || !restaurant_id) {
    return res.status(400).json({ error: "Missing customer_name, phone_number, or restaurant_id" });
  }
  const findSql = `
    SELECT * FROM queue
    WHERE customer_name = ? AND phone_number = ? AND restaurant_id = ?
  `;
  db.get(findSql, [customer_name, phone_number, restaurant_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(200).json(null);
    const countSql = `
      SELECT COUNT(*) as count FROM queue
      WHERE restaurant_id = ? AND join_time < ?
    `;
    db.get(countSql, [row.restaurant_id, row.join_time], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      const position = countRow.count + 1;
      res.json({
        queue_id: row.id,
        customer_name: row.customer_name,
        phone_number: row.phone_number,
        position
      });
    });
  });
});

// DELETE /queue/:id - Remove a customer from the queue
app.delete('/queue/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM queue WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Queue entry not found." });
    res.json({ success: true });
  });
});

// ----------------------
// Serve the React App
// ----------------------
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
