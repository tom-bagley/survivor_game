const express = require('express');
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

module.exports = router;
