const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");



const errorMiddleware = require("./middlewares/errors");
require('dotenv').config({path:'./config/.env'});

app.use(express.json({ limit: '100mb' }));


// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true,
// }));

const users = require('./Routes/User');
const product = require('./Routes/Product');

// app.use(
//   cors({
//     origin: `${process.env.FRONTEND_URL}`,
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());


app.use('/api/v1', users);
app.use('/api/v1', product)
app.use(errorMiddleware);

module.exports = app;