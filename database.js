var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message)
        throw err
    }
    console.log('Connected to the SQLite database.')
   // DROP TABLE IF EXISTS customer;  table delete
    db.run(` CREATE TABLE IF NOT EXISTS customer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        dateOfbirth TEXT NOT NULL,
        gender TEXT NOT NULL,
        age INTEGER NOT NULL,
        cardHolderName TEXT NOT NULL,
        cardNumber TEXT NOT NULL,
        expiryDate TEXT NOT NULL,
        cvv INTEGER NOT NULL,
        timeStamp TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating customer table:', err.message)
        } else {
            console.log('Customer table created or already exists.')
        }
    })
})

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message)
        }
        console.log('Database connection closed')
        process.exit(0)
    })
})

module.exports = db