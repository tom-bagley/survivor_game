const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const {mongoose} = require('mongoose');
const app = express();
const cookieParser = require('cookie-parser')

console.log('MONGO_URL:', process.env.MONGO_URL);



//database connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database Connected'))
.catch((err) => console.log('Database not Connected', err))


//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

app.use('/', require('./routes/authRoutes'));
app.use('/players', require('./routes/playerRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));

const port = 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`))