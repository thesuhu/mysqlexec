# mysqlexec

[![npm](https://img.shields.io/npm/v/mysqlexec.svg?style=flat-square)](https://www.npmjs.com/package/mysqlexec)
[![license](https://img.shields.io/github/license/thesuhu/mysqlexec?style=flat-square)](https://github.com/thesuhu/mysqlexec/blob/master/LICENSE)

Running MySQL queries made easier.

## Install

```sh
npm install mysqlexec --save
```

## Environment Variables Configuration

Before using, set the following environment variables (or via parameters):

| Variable              | Function                                                       | Default Value         |
|-----------------------|----------------------------------------------------------------|-----------------------|
| `MYSQL_HOST`          | MySQL database host address                                    | `localhost`           |
| `MYSQL_USER`          | Username for MySQL connection                                  | `root`                |
| `MYSQL_PASSWORD`      | Password for MySQL connection                                  | (empty)               |
| `MYSQL_DATABASE`      | Database name to use                                           | `test`                |
| `MYSQL_PORT`          | MySQL connection port                                          | `3306`                |
| `MYSQL_CONN_LIMIT`    | Maximum number of active connections in the pool               | `10`                  |
| `MYSQL_MAX_IDLE`      | Maximum number of idle connections in the pool                 | `10`                  |
| `MYSQL_IDLE_TIMEOUT`  | Idle connection timeout (ms) before being removed              | `60000`               |
| `MYSQL_TIMEZONE`      | MySQL connection timezone                                      | `Z` (UTC)             |

**Note:**  
- All variables above can also be set via parameters when initializing the pool.
- If not set, the default values from the table above will be used.

## Pool Initialization

```javascript
const mysqlexec = require('mysqlexec');

// Initialize default pool (using env)
await mysqlexec.initialize();

// Or with custom configuration and pool alias
await mysqlexec.initialize({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test',
  poolAlias: 'mydb'
});
```

## Single Query Execution

```javascript
const sql = 'SELECT * FROM users WHERE id = ?';
const params = [1];

mysqlexec.myexec(sql, params)
  .then(results => {
    console.log(results);
  })
  .catch(err => {
    console.error(err);
  });
```

## Multi Query Execution with Transaction

```javascript
const queries = [
  { query: 'INSERT INTO users (name) VALUES (?)', parameters: ['Alice'] },
  { query: 'UPDATE users SET name = ? WHERE id = ?', parameters: ['Bob', 1] }
];

mysqlexec.myexectrans(queries)
  .then(results => {
    console.log(results);
  })
  .catch(err => {
    console.error(err);
  });
```

## Pool Alias

If you use more than one pool, add the `poolAlias` parameter to the function:

```javascript
mysqlexec.myexec('SELECT 1', [], 'mydb')
```

## License

[MIT](https://github.com/thesuhu/mysqlexec/blob/master/LICENSE)