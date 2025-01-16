const express = require('express');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const Stock = require('../models/survivor_stock'); // Import the Stock model
const router = express.Router();

//Add players page
// Add a route for the new page



// Add a new stock
router.post('/add', async (req, res) => {
  try {
    const { name, symbol, price, available } = req.body;

    // Create a new stock
    const newStock = new Stock({ name, symbol, price, available });
    await newStock.save();

    res.status(201).json({ message: 'Stock added successfully', stock: newStock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding stock', error: err.message });
  }
});

// Get all stocks
router.get('/all', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.status(200).json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stocks', error: err.message });
  }
});

// Get a specific stock by symbol (case-insensitive)

router.get('/:symbol', async (req, res) => {
    try {
      const stock = await Stock.findOne({ symbol: req.params.symbol });
      if (!stock) {
        return res.status(404).json({ message: 'Stock not found' });
      }
      res.status(200).json(stock);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching stock', error: err.message });
    }
  });
  

// Update a stock
router.put('/update/:symbol', async (req, res) => {
  try {
    const updates = req.body; // Contains the fields to update
    const stock = await Stock.findOneAndUpdate(
      { symbol: req.params.symbol },
      updates,
      { new: true } // Return the updated document
    );

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.status(200).json({ message: 'Stock updated successfully', stock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating stock', error: err.message });
  }
});

// Delete a stock
router.delete('/delete/:symbol', async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ symbol: req.params.symbol });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.status(200).json({ message: 'Stock deleted successfully', stock });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting stock', error: err.message });
  }
});

router.post('/add-user', async (req, res) => {
  const { username, password } = req.body;

  // Check if username already exists
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  // Hash the password for security
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);

  // Create a new user using the Mongoose model
  const user = new User({
    username,
    passwordHash,
  });

  try {
    // Save the user to the database
    await user.save();
    res.status(201).json({ message: 'User created successfully!' });
  } catch (err) {
    console.error('Error saving user:', err);
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

/*
//Login
router.post('/users/login', async (req, res) => ) {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser == null) {
    return res.status(400).send('Cannot find user');
  }

  try {
    if(await bcrypt.compare(password, existingUser.passwordHash)) {
      res.send('Sucess');
    }
  } catch {
    res.status(500).send();
  }
}
  */
module.exports = router;
