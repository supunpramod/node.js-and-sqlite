const express = require("express")
const app = express()
const db = require("./database.js")
const bodyParser = require("body-parser")
const cors = require("cors")

const HTTP_PORT = 8000

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({ 
    origin: "http://localhost:3000", // Update with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}))

// Start server
app.listen(HTTP_PORT, () => {
    console.log(`Server running on port ${HTTP_PORT}`)
})

// Root endpoint
app.get("/", (req, res) => {
    res.json({ message: "University of Moratuwa" })
})

// Customer registration endpoint
app.post("/api/customer/register", (req, res) => {
    try {
        const errors = []
        const {
            name,
            address,
            email,
            dateOfbirth,
            gender,
            age,
            cardHolderName,
            cardNumber,
            expiryDate,
            cvv,
            timeStamp,
            phone,
            city
        } = req.body

        // Regex patterns
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        const creditCardRegex = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        const expiryDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/
        const phoneRegex = /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/

        // Validation
        if (!name) errors.push("Name is required")
        if (!address) errors.push("Address is required")
        if (!email) errors.push("Email is required")
        if (!dateOfbirth) errors.push("Date of birth is required")
        if (!gender) errors.push("Gender is required")
        if (!age) errors.push("Age is required")
        if (!cardHolderName) errors.push("Card holder name is required")
        if (!cardNumber) errors.push("Card number is required")
        if (!expiryDate) errors.push("Expiry date is required")
        if (!cvv) errors.push("CVV is required")
        if (!phone) errors.push("Phone is required")
        if (!city) errors.push("City is required")

        if (!emailRegex.test(email)) errors.push("Invalid email format")
        
        const normalizedCardNumber = cardNumber?.replace(/[\s-]/g, "") || ""
        if (!creditCardRegex.test(normalizedCardNumber)) errors.push("Invalid credit card number format")

        if (!dateRegex.test(dateOfbirth)) errors.push("Date of birth must be in YYYY-MM-DD format")
        else {
            const dob = new Date(dateOfbirth)
            if (isNaN(dob.getTime())) errors.push("Invalid date of birth")
            else {
                const today = new Date()
                let calculatedAge = today.getFullYear() - dob.getFullYear()
                const monthDiff = today.getMonth() - dob.getMonth()
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    calculatedAge--
                }
                if (Math.abs(calculatedAge - age) > 1) errors.push("Age does not match date of birth")
            }
        }

        if (!expiryDateRegex.test(expiryDate)) errors.push("Expiry date must be in MM/YY format")
        else {
            const [month, year] = expiryDate.split("/").map(Number)
            const currentDate = new Date()
            const expiry = new Date(`20${year}`, month - 1)
            if (expiry < currentDate) errors.push("Expiry date must be in the future")
        }

        if (!/^\d{3,4}$/.test(cvv)) errors.push("CVV must be 3 or 4 digits")
        if (isNaN(age) || age <= 0) errors.push("Age must be a positive number")

        let formattedTimeStamp = timeStamp
        if (timeStamp) {
            const parsedTimeStamp = new Date(timeStamp)
            if (isNaN(parsedTimeStamp.getTime())) errors.push("Invalid timestamp format")
            else formattedTimeStamp = parsedTimeStamp.toISOString().replace("T", " ").substring(0, 19)
        } else {
            formattedTimeStamp = new Date().toISOString().replace("T", " ").substring(0, 19)
        }

        if (!phoneRegex.test(phone)) errors.push("Invalid phone number format")

        if (errors.length > 0) return res.status(400).json({ errors })

        const sql = `INSERT INTO customer (name, address, email, dateOfbirth, gender, age, cardHolderName, cardNumber, expiryDate, cvv, timeStamp, phone, city) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

        const values = [
            name,
            address,
            email,
            dateOfbirth,
            gender,
            age,
            cardHolderName,
            normalizedCardNumber,
            expiryDate,
            cvv,
            formattedTimeStamp,
            phone,
            city
        ]

        db.run(sql, values, function (err) {
            if (err) {
                console.error("Database error:", err.message)
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ error: "Email already registered" })
                }
                return res.status(400).json({ error: "Database error occurred: " + err.message })
            }
            res.status(201).json({
                message: `customer ${name} has registered`,
                customerId: this.lastID
            })
        })
    } catch (error) {
        console.error("Server error:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})