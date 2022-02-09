const mysql = require('mysql')
const { sqlLogConsole } = require('@thesuhu/colorconsole')
const pool = require('./mysqlpool')
const env = process.env.NODE_ENV || 'dev'

// single query
exports.myexec = function (sql, parameters) {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if (error) {
                reject({
                    message: error.sqlMessage || error.code
                })
                return
            }
            var querySQL = mysql.format(sql, parameters)
            if (env == 'dev') {
                sqlLogConsole(querySQL)
            }

            // exec query SQL
            connection.query(querySQL, (error, results, fields) => {
                connection.release()
                if (error) {
                    reject({
                        message: error.sqlMessage || error.code
                    }) //https://github.com/mysqljs/mysql#error-handling
                    return
                }
                resolve(results)
            })

        })
    })
}

// multi SQL with transaction
exports.myexectrans = function (queries) {
    var paramCount = queries.length - 1
    return new Promise((resolve, reject) => {
        var ressql = []
        pool.getConnection((error, connection) => {
            connection.beginTransaction((err) => {
                function running(count) {
                    if (count <= paramCount && count > -1) {
                        var query = queries[count]
                        var querySQL = mysql.format(query.query, query.parameters)
                        var queryId = count
                        prosesSQL(connection, querySQL, resolve, reject, ressql, queryId, () => {
                            running(count + 1)
                        })
                    } else {
                        completeSQL(connection)
                        resolve(ressql)
                    }
                }
                running(0)
            })
        })
    })
}

// fungsi proses sql, callback
function prosesSQL(connection, sql, resolve, reject, ressql, queryId, callback) {
    var query = connection.query(sql, (err, results, fields) => {
        if (env == 'dev') {
            sqlLogConsole(query.sql)
        }

        if (err) {
            connection.rollback()
            connection.release()
            if (env == 'dev') {
                sqlLogConsole('rollback')
            }
            reject({
                message: err.sqlMessage || error.code
            })
            return
        }
        ressql[queryId] = {
            queryid: queryId,
            results: results,
            fields: fields,
        }
        callback()
    })
}

// commit
function completeSQL(connection) {
    if (env == 'dev') {
        sqlLogConsole('commit')
    }
    connection.commit()
    connection.release()
}