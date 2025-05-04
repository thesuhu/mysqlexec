const mysql = require('mysql2');
const { sqlLogConsole, logConsole, errorConsole } = require('@thesuhu/colorconsole');
const env = process.env.NODE_ENV || 'dev';
const pools = {};  // Objek untuk menyimpan beberapa pool koneksi

const dbconfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONN_LIMIT, 10) || 10,
    maxIdle: parseInt(process.env.MYSQL_MAX_IDLE, 10) || 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: parseInt(process.env.MYSQL_IDLE_TIMEOUT, 10) || 60000, // idle connections timeout, in milliseconds, the default value 60000
    // keepAliveInterval: 10000, // tidak perlu jika enable keep alive = true
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: process.env.MYSQL_TIMEZONE || 'Z'
};

// // Create the connection pool. The pool-specific settings are the defaults
// exports.initialize = async function initialize(customConfig) {
//     let consoleConfig = { ...customConfig };
//     try {
//         const poolAlias = customConfig && customConfig.poolAlias ? customConfig.poolAlias : 'default';
//         if (customConfig) {
//             if (env === 'dev') {
//                 console.log(consoleConfig);
//             }
//             pools[poolAlias] = mysql.createPool(customConfig); // Use mysql2.Pool to create the pool
//             logConsole('pool created: ' + poolAlias);
//         } else {
//             if (env === 'dev') {
//                 console.log(dbconfig);
//             }
//             pools[poolAlias] = mysql.createPool(dbconfig);
//             logConsole('pool created: ' + poolAlias);
//         }
//     } catch (err) {
//         errorConsole(err.message);
//     }
// };

// Create the connection pool. The pool-specific settings are the defaults
exports.initialize = async function initialize(customConfig) {
    try {
        const poolAlias = customConfig?.poolAlias || 'default';
        if (customConfig) {
            if (env === 'dev') {
                console.log(customConfig);
            }
            // Hapus poolAlias dari customConfig sebelum dipakai
            const { poolAlias: _, ...configWithoutAlias } = customConfig;
            pools[poolAlias] = mysql.createPool(configWithoutAlias);
            logConsole('pool created: ' + poolAlias);
        } else {
            if (env === 'dev') {
                console.log(dbconfig);
            }
            pools[poolAlias] = mysql.createPool(dbconfig);
            logConsole('pool created: ' + poolAlias);
        }
    } catch (err) {
        errorConsole('Error creating pool: ' + err.message);
        throw new Error(err.message);
    }
};


// single query
exports.myexec = function (sql, parameters, poolAlias = 'default') {
    return new Promise((resolve, reject) => {
        const pool = pools[poolAlias];
        if (!pool) {
            reject({ message: 'Pool not found for alias: ' + poolAlias });
            return;
        }
        pool.getConnection((error, connection) => {
            if (error) {
                console.log(error)
                reject({ message: error.sqlMessage || error.code });
                return;
            }
            const querySQL = mysql.format(sql, parameters);
            if (env === 'dev') {
                sqlLogConsole(querySQL);
            }

            // exec query SQL
            connection.query(querySQL, (error, results, fields) => {
                connection.release();
                if (error) {
                    reject({ message: error.sqlMessage || error.code }); //https://github.com/mysqljs/mysql#error-handling
                    return;
                }
                resolve(results);
            });
        });
    });
};

// multi SQL with transaction
exports.myexectrans = function (queries, poolAlias = 'default') {
    const paramCount = queries.length - 1;
    return new Promise((resolve, reject) => {
        const pool = pools[poolAlias];
        if (!pool) {
            reject({ message: 'Pool not found for alias: ' + poolAlias });
            return;
        }
        const ressql = [];
        pool.getConnection((error, connection) => {
            if (error) {
                reject({ message: error.sqlMessage || error.code });
                return;
            }
            connection.beginTransaction((err) => {
                if (err) {
                    reject({ message: err.sqlMessage || err.code });
                    return;
                }
                function running(count) {
                    if (count <= paramCount && count > -1) {
                        const query = queries[count];
                        const querySQL = mysql.format(query.query, query.parameters);
                        const queryId = count;
                        prosesSQL(connection, querySQL, resolve, reject, ressql, queryId, () => {
                            running(count + 1);
                        });
                    } else {
                        completeSQL(connection);
                        resolve(ressql);
                    }
                }
                running(0);
            });
        });
    });
};

// fungsi proses sql, callback
function prosesSQL(connection, sql, resolve, reject, ressql, queryId, callback) {
    const query = connection.query(sql, (err, results, fields) => {
        if (env === 'dev') {
            sqlLogConsole(query.sql);
        }

        if (err) {
            connection.rollback();
            connection.release();
            if (env === 'dev') {
                sqlLogConsole('rollback');
            }
            reject({ message: err.sqlMessage || err.code });
            return;
        }
        ressql[queryId] = {
            queryid: queryId,
            results: results,
            fields: fields,
        };
        callback();
    });
}

// commit
function completeSQL(connection) {
    if (env === 'dev') {
        sqlLogConsole('commit');
    }
    connection.commit();
    connection.release();
}
