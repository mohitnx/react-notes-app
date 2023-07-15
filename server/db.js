const Pool = require('pg').Pool
require('dotenv').config()


const pool = new Pool({
    //for some reason..process.env.USERNAME has different string than the one i defined it with
    //so hardcoding the username

    //update: turns out due to os using the same name for username 
    //.env got confused with username of the pc and the username of postgres database
    //there is another package if you want diff. names for this particalar 
    //username, 
    user: 'postgres',
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DBPORT, 
    database:'todoapp'
})


module.exports = pool; 