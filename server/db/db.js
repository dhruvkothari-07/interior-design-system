const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

if(!db){
    return console.log("error while connecting")
}
else{
    console.log("connect to db")
}


module.exports = db;
