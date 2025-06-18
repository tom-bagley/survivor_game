const express = require('express');
const dotenv = require('dotenv').config();
const {mongoose} = require('mongoose');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const recordStockPrices = require('./jobs/recordPricesJob');
const updateLiveLeaderboard = require('./jobs/recordLeaderboardJob');

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true 
}));


//database connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database Connected'))
.catch((err) => console.log('Database not Connected', err))


recordStockPrices()
  .then(() => console.log("Initial price recording done"))
  .catch(console.error);

//Schedule to run every minute
setInterval(recordStockPrices, 60 * 1000);

// updateLiveLeaderboard()
//   .then(() => console.log('Leaderboard updated'))
//   .catch(console.error);

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

app.use('/auth', require('./routes/authRoutes'));
app.use('/players', require('./routes/playerRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/leaderboard', require('./routes/leaderboardRoutes'))
app.use('/admin', require('./routes/adminRoutes'))

if(process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        console.log('Serving index.html');
        res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
    
}

const port = process.env.PORT || 8000;  
app.listen(port, () => console.log(`Server is running on port ${port}`));
