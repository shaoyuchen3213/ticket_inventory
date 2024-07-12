const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // for parsing application/json

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

// Ticket Schema
const TicketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    date: { type: Date, required: true }, 
    location: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

const User = mongoose.model('User', UserSchema);
const Ticket = mongoose.model('Ticket', TicketSchema);

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();
        res.status(201).send("User created successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error creating user");
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send("Invalid credentials");
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, userId: user._id, });
    } catch (error) {
        console.log(error)
        res.status(500).send("Authentication failed");
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        const { userId } = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
        const tickets = await Ticket.find({ userId });
        res.json(tickets);
    } catch (error) {
        res.status(401).send("Unauthorized");
    }
});

app.post('/api/tickets', async (req, res) => {
    const { userId, name, date, location, quantity, price } = req.body;
    console.log(userId)
    try {
        const newTicket = new Ticket({
            userId,
            name,
            date,
            location,
            quantity,
            price
        });

        await newTicket.save();
        res.status(201).send('Ticket added successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('Failed to add ticket');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
