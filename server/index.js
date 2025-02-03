const express = require('express');
const dotenv = require('dotenv').config();
const {mongoose} = require('mongoose');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');


console.log('MONGO_URL:', process.env.MONGO_URL);


//database connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log('Database Connected'))
.catch((err) => console.log('Database not Connected', err))

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));

app.use('/auth', require('./routes/authRoutes'));
app.use('/players', require('./routes/playerRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));

console.log(process.env.NODE_ENV);

if(process.env.NODE_ENV === 'production') {
    console.log('in heree');
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        console.log('Serving index.html');
        res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
    
}

const port = process.env.PORT || 8000;  
app.listen(port, () => console.log(`Server is running on port ${port}`));
