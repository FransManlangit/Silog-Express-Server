const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
require('dotenv').config({path:'./config/.env'});


const errorMiddleware = require("./middlewares/errors");
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

const users = require('./Routes/User');

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true,
  })
);



app.use('/api/v1',users);
app.use(errorMiddleware);

module.exports = app;