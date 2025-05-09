const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser'); // Fixed typo here

dotenv.config();
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

// Set up EJS
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser()); // Corrected position

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('landing'); // This will render the landing.ejs page
  });

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
