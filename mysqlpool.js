const mysql = require('mysql')
const tz = process.env.MYSQL_TIMEZONE || 'Asia/Jakarta'
const port = parseInt(process.env.MYSQL_PORT, 10) || 3306

const connectionString = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: port,
    database: process.env.MYSQL_DATABASE,
    timezone: tz
}

var pool = mysql.createPool(connectionString)
module.exports = pool