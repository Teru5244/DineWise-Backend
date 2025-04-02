const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM restaurants WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Restaurant not found.' });
    res.json({ restaurant: row });
  });
});

app.put('/api/restaurants/:id', (req, res) => {
  const { id } = req.params;
  const { name, location, cuisine, userid, password } = req.body;
  if (!name || !userid || !password) {
    return res.status(400).json({ error: 'Name, userid and password are required.' });
  }
  const sql = `
    UPDATE restaurants
    SET name = ?, location = ?, cuisine = ?, userid = ?, password = ?
    WHERE id = ?
  `;
  db.run(sql, [name, location || null, cuisine || null, userid, password, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Restaurant not found.' });
    res.json({ message: 'Restaurant updated successfully.' });
  });
});

app.post('/api/restaurants/signup', (req, res) => {
    const { name, location, cuisine, userid, password, opening_hours } = req.body;
    if (!name || !userid || !password) {
        return res.status(400).json({ error: "Name, userid and password are required." });
    }
    const sql = `
      INSERT INTO restaurants (name, location, cuisine, userid, password)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [name, location || null, cuisine || null, userid, password], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({ error: "User ID already exists." });
            }
            return res.status(500).json({ error: err.message });
        }
        const restaurantId = this.lastID;
        if (opening_hours && Array.isArray(opening_hours)) {
            const stmt = db.prepare("INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)");
            opening_hours.forEach(day => {
                stmt.run(restaurantId, day.day_of_week, day.open_time, day.close_time);
            });
            stmt.finalize((err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: "Restaurant signed up successfully.", restaurantId });
            });
        } else {
            res.status(201).json({ message: "Restaurant signed up successfully.", restaurantId });
        }
    });
});

const db = new sqlite3.Database('./dinewise.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    db.run(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        cuisine TEXT,
        userid TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
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
    db.run(`
      CREATE TABLE IF NOT EXISTS opening_hours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        day_of_week INTEGER,
        open_time TEXT,
        close_time TEXT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )
    `, (err) => {
      if (!err) { }
    });
    db.get(`SELECT COUNT(*) as count FROM restaurants`, (err, row) => {
      if (err) {
        console.error(err.message);
      } else if (row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO restaurants (name, location, cuisine, userid, password) VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run("The Italian Place", "123 Main St", "Italian", "italian", "pass123");
        stmt.run("Sushi World", "456 Ocean Ave", "Japanese", "sushiworld", "sushi456");
        stmt.run("Burger Joint", "789 Market Rd", "American", "burgerjoint", "burger789");
        stmt.finalize(() => {
          console.log("Seeded restaurants table with sample data.");
          db.get("SELECT COUNT(*) as count FROM opening_hours", (err, row) => {
            if (!err && row.count === 0) {
              const hoursData1 = [
                { day: 0, open: "12:00", close: "20:00" },
                { day: 1, open: "11:00", close: "22:00" },
                { day: 2, open: "11:00", close: "22:00" },
                { day: 3, open: "11:00", close: "22:00" },
                { day: 4, open: "11:00", close: "22:00" },
                { day: 5, open: "11:00", close: "22:00" },
                { day: 6, open: "12:00", close: "20:00" }
              ];
              const hoursData2 = [
                { day: 0, open: "00:00", close: "00:00" },
                { day: 1, open: "12:00", close: "21:00" },
                { day: 2, open: "12:00", close: "21:00" },
                { day: 3, open: "12:00", close: "21:00" },
                { day: 4, open: "12:00", close: "21:00" },
                { day: 5, open: "12:00", close: "22:00" },
                { day: 6, open: "12:00", close: "22:00" }
              ];
              const hoursData3 = [
                { day: 0, open: "11:00", close: "20:00" },
                { day: 1, open: "10:00", close: "20:00" },
                { day: 2, open: "10:00", close: "20:00" },
                { day: 3, open: "10:00", close: "22:00" },
                { day: 4, open: "10:00", close: "22:00" },
                { day: 5, open: "11:00", close: "22:00" },
                { day: 6, open: "11:00", close: "20:00" }
              ];
              const allHours = [
                { restaurant_id: 1, data: hoursData1 },
                { restaurant_id: 2, data: hoursData2 },
                { restaurant_id: 3, data: hoursData3 }
              ];
              allHours.forEach(item => {
                const stmt2 = db.prepare("INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)");
                item.data.forEach(d => {
                  stmt2.run(item.restaurant_id, d.day, d.open, d.close);
                });
                stmt2.finalize();
              });
              console.log("Seeded opening_hours table with sample data.");
            }
          });
        });
      }
    });
  }
});

function cleanupOldQueueEntries() {
  db.run("DELETE FROM queue WHERE date(join_time) < date('now','localtime')", (err) => {
      if (err) {
          console.error("Error cleaning old queue entries:", err.message);
      } else {
          console.log("Old queue entries cleaned");
      }
  });
}

cron.schedule('0 0 * * *', () => {
  console.log("Running daily cleanup");
  cleanupOldQueueEntries();
});

cleanupOldQueueEntries();

app.get('/restaurants', (req, res) => {
  db.all(`SELECT * FROM restaurants`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ restaurants: rows });
  });
});

app.post('/api/restaurants/login', (req, res) => {
  const { userid, password } = req.body;
  if (!userid || !password) {
    return res.status(400).json({ error: 'Missing userid or password' });
  }
  const sql = 'SELECT * FROM restaurants WHERE userid = ?';
  db.get(sql, [userid], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row || row.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful', restaurantId: row.id });
  });
});

app.post('/api/customers/login', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone are required." });
    }
    const reservationsSql = `SELECT * FROM reservations WHERE LOWER(customer_name) = LOWER(?) AND phone_number = ?`;
    db.all(reservationsSql, [name, phone], (err, reservations) => {
        if (err) return res.status(500).json({ error: err.message });
        const queueSql = `SELECT * FROM queue WHERE LOWER(customer_name) = LOWER(?) AND phone_number = ?`;
        db.all(queueSql, [name, phone], (err, queues) => {
            if (err) return res.status(500).json({ error: err.message });
            if ((!reservations || reservations.length === 0) && (!queues || queues.length === 0)) {
                return res.status(404).json({ error: "No record found for this customer." });
            }
            res.json({ reservations, queues });
        });
    });
});

app.post('/reservations', (req, res) => {
  const { restaurant_id, reservation_time, customer_name, phone_number } = req.body;
  if (!restaurant_id || !reservation_time || !customer_name || !phone_number) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  let date = new Date(reservation_time);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const dayOfWeek = date.getDay();
  const reservationTimeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
  const timeslot = date.toISOString();
  const openingSql = "SELECT open_time, close_time FROM opening_hours WHERE restaurant_id = ? AND day_of_week = ?";
  db.get(openingSql, [restaurant_id, dayOfWeek], (err, opening) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!opening) return res.status(500).json({ error: "Opening hours not set for this restaurant." });
    if (opening.open_time === opening.close_time || reservationTimeStr < opening.open_time || reservationTimeStr >= opening.close_time) {
      return res.status(400).json({ error: "Reservation time is outside opening hours." });
    }
    const checkSql = `SELECT COUNT(*) as count FROM reservations WHERE restaurant_id = ? AND reservation_time = ?`;
    db.get(checkSql, [restaurant_id, timeslot], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row.count >= 5) {
        return res.status(400).json({ error: "This timeslot is fully booked. Please choose a different time." });
      }
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
});

app.put('/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { restaurant_id, reservation_time, customer_name, phone_number } = req.body;
  if (!restaurant_id || !reservation_time || !customer_name || !phone_number) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  let date = new Date(reservation_time);
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 30) * 30;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const timeslot = date.toISOString();
  const countSql = `SELECT COUNT(*) as count FROM reservations WHERE restaurant_id = ? AND reservation_time = ? AND id != ?`;
  db.get(countSql, [restaurant_id, timeslot, id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count >= 5) {
      return res.status(409).json({ error: "This timeslot is fully booked. Please choose a different time." });
    }
    const sql = `UPDATE reservations SET reservation_time = ? WHERE id = ?`;
    db.run(sql, [timeslot, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Reservation not found." });
      res.json({ message: "Reservation updated successfully.", timeslot });
    });
  });
});

app.get('/reservations', (req, res) => {
  const { restaurant_id } = req.query;
  if (!restaurant_id) return res.status(400).json({ error: "Missing required query parameter: restaurant_id" });
  const sql = `SELECT * FROM reservations WHERE restaurant_id = ? ORDER BY reservation_time ASC`;
  db.all(sql, [restaurant_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ reservations: rows });
  });
});

app.delete('/reservations/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM reservations WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Reservation not found." });
    res.json({ success: true });
  });
});

app.use('/queue', (req, res, next) => {
  db.run("DELETE FROM queue WHERE date(join_time) < date('now','localtime')", (err) => {
    if (err) console.error("Error cleaning old queue entries:", err.message);
    next();
  });
});

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

app.delete('/queue/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM queue WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Queue entry not found." });
    res.json({ success: true });
  });
});

app.get('/api/opening_hours/:restaurant_id', (req, res) => {
  const { restaurant_id } = req.params;
  const sql = `SELECT day_of_week, open_time, close_time FROM opening_hours WHERE restaurant_id = ? ORDER BY day_of_week ASC`;
  db.all(sql, [restaurant_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ opening_hours: rows });
  });
});

app.put('/api/opening_hours/:restaurant_id', (req, res) => {
  const { restaurant_id } = req.params;
  const { opening_hours } = req.body;
  if (!opening_hours || !Array.isArray(opening_hours)) {
    return res.status(400).json({ error: "Invalid opening_hours payload." });
  }
  for (const day of opening_hours) {
    const [openHour, openMin] = day.open_time.split(":");
    const [closeHour, closeMin] = day.close_time.split(":");
    if (!(['00','30'].includes(openMin)) || !(['00','30'].includes(closeMin))) {
      return res.status(400).json({ error: "Invalid time: opening and closing times must be on a 30-minute interval." });
    }
  }
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("DELETE FROM opening_hours WHERE restaurant_id = ?", [restaurant_id], (err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      const stmt = db.prepare("INSERT INTO opening_hours (restaurant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)");
      opening_hours.forEach(day => {
        stmt.run([restaurant_id, day.day_of_week, day.open_time, day.close_time]);
      });
      stmt.finalize((err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        db.run("COMMIT");
        res.json({ message: "Opening hours updated successfully." });
      });
    });
  });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;