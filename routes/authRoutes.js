const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// User registration route
router.get('/auth/register', (req,res) => {
  res.render('register'); // Render registration page
});

// User login route
router.get('/auth/login', (req, res) => {
  res.render("login"); // Render login page
});

router.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("register", { error: 'Email already in use' }); // Send back error to the registration form
  }

  try {
    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new user instance
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the new user to the database
    await newUser.save();

    // Create a JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expiration time
    );

    // Send the token in a cookie or response (e.g., using a cookie)
    res.cookie('token', token, { httpOnly: true });

    // Redirect the user to login after registration
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// User login route
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.render("login", { error: 'Invalid credentials' }); // Send back error to the login form
  }

  // Compare the password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", { error: 'Invalid credentials' }); // Send back error to the login form
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Set token in a cookie and redirect to profile page
  res.cookie('token', token, { httpOnly: true });
  if (!user.bio || !user.age || !user.gender || !user.profilePic) {
    return res.redirect('/users/setup');
  } else {
    return res.redirect('/users/profile');
  }
});

module.exports = router;
