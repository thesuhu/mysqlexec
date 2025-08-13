# mysqlexec

[![npm](https://img.shields.io/npm/v/mysqlexec.svg?style=flat-square)](https://www.npmjs.com/package/mysqlexec)
[![Build Status](https://img.shields.io/travis/thesuhu/mysqlexec.svg?branch=main&style=flat-square)](https://app.travis-ci.com/thesuhu/mysqlexec)
[![license](https://img.shields.io/github/license/thesuhu/mysqlexec?style=flat-square)](https://github.com/thesuhu/mysqlexec/blob/master/LICENSE)

A simple and easy-to-use MySQL query executor for Node.js applications. Built on top of MySQL2 with connection pooling and multiple database support.

## Features

- ✅ **Connection Pooling** - Automatic connection pool management
- ✅ **Multiple Databases** - Support for multiple database connections with aliases
- ✅ **Promise-based** - Modern async/await support
- ✅ **Environment Variables** - Easy configuration via .env files
- ✅ **Development Logging** - Automatic query logging in development mode
- ✅ **Error Handling** - Built-in error handling and logging
- ✅ **MySQL2 Compatible** - Built on proven MySQL2 driver

## Install

```sh
npm install mysqlexec --save
```

## Quick Start

### Basic Usage

```javascript
const mysqlexec = require('mysqlexec');
const { myexec } = require('mysqlexec');

// Initialize with default configuration
await mysqlexec.initialize();

// Execute queries
const result = await myexec('SELECT * FROM users WHERE id = ?', [1]);
console.log(result);
```

### Environment Variables

Create a `.env` file in your project root:

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=yourdatabase
MYSQL_PORT=3306
MYSQL_CONN_LIMIT=10
MYSQL_MAX_IDLE=10
MYSQL_IDLE_TIMEOUT=60000
MYSQL_TIMEZONE=Z
```

## API Reference

### mysqlexec.initialize(config)

Initialize a connection pool.

```javascript
// Using environment variables (recommended)
await mysqlexec.initialize();

// Using custom configuration
await mysqlexec.initialize({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydb',
    port: 3306,
    timezone: 'local'
});

// Multiple databases with aliases
await mysqlexec.initialize({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'analytics',
    poolAlias: 'analytics'
});
```

### myexec(sql, parameters, poolAlias)

Execute a SQL query.

```javascript
// Simple query
const users = await myexec('SELECT * FROM users');

// Query with parameters
const user = await myexec('SELECT * FROM users WHERE id = ?', [123]);

// Query on specific database pool
const analytics = await myexec('SELECT * FROM events', [], 'analytics');

// Named parameters (object)
const result = await myexec(
    'SELECT * FROM users WHERE name = :name AND age > :age',
    { name: 'John', age: 25 }
);
```

### myexectrans(queries, poolAlias)

Execute multiple queries in a transaction.

```javascript
const { myexectrans } = require('mysqlexec');

const queries = [
    {
        query: 'INSERT INTO users (name, email) VALUES (?, ?)',
        parameters: ['John Doe', 'john@example.com']
    },
    {
        query: 'UPDATE profiles SET updated_at = NOW() WHERE user_id = ?',
        parameters: [1]
    }
];

try {
    await myexectrans(queries);
    console.log('Transaction completed successfully');
} catch (error) {
    console.error('Transaction failed:', error);
}
```

## Multiple Database Example

```javascript
const mysqlexec = require('mysqlexec');
const { myexec } = require('mysqlexec');

async function setupDatabases() {
    // Main database (default pool)
    await mysqlexec.initialize({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'main_app'
    });

    // Analytics database
    await mysqlexec.initialize({
        host: 'analytics-server',
        user: 'analytics_user',
        password: 'analytics_pass',
        database: 'analytics',
        poolAlias: 'analytics'
    });
}

async function queryDatabases() {
    // Query main database
    const users = await myexec('SELECT * FROM users');
    
    // Query analytics database
    const events = await myexec('SELECT * FROM user_events', [], 'analytics');
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | `localhost` | MySQL server hostname |
| `user` | string | `root` | MySQL username |
| `password` | string | `''` | MySQL password |
| `database` | string | `test` | Database name |
| `port` | number | `3306` | MySQL server port |
| `connectionLimit` | number | `10` | Maximum number of connections |
| `maxIdle` | number | `10` | Maximum idle connections |
| `idleTimeout` | number | `60000` | Idle connection timeout (ms) |
| `timezone` | string | `Z` | Timezone setting |
| `poolAlias` | string | `default` | Pool identifier for multiple databases |

## Environment Variables

All configuration options can be set via environment variables:

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=yourdatabase
MYSQL_PORT=3306
MYSQL_CONN_LIMIT=10
MYSQL_MAX_IDLE=10
MYSQL_IDLE_TIMEOUT=60000
MYSQL_TIMEZONE=Z
NODE_ENV=production
```

## Express.js Integration Example

```javascript
const express = require('express');
const mysqlexec = require('mysqlexec');
const { myexec } = require('mysqlexec');

const app = express();

// Initialize database connection
async function initializeApp() {
    try {
        await mysqlexec.initialize();
        console.log('Database connected successfully');
        
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// API endpoint
app.get('/api/users/:id', async (req, res) => {
    try {
        const result = await myexec(
            'SELECT * FROM users WHERE id = ?', 
            [req.params.id]
        );
        
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

initializeApp();
```

## Best Practices

### 1. Always Use Parameters
```javascript
// ✅ Good - prevents SQL injection
const user = await myexec('SELECT * FROM users WHERE id = ?', [userId]);

// ❌ Bad - vulnerable to SQL injection
const user = await myexec(`SELECT * FROM users WHERE id = ${userId}`);
```

### 2. Handle Connections Properly
```javascript
// ✅ Initialize once at application startup
async function startApp() {
    await mysqlexec.initialize();
    // Start your application
}
```

### 3. Use Transactions for Related Operations
```javascript
// ✅ Use transactions for data consistency
const queries = [
    { query: 'INSERT INTO orders (...) VALUES (?)', parameters: [...] },
    { query: 'UPDATE inventory SET quantity = quantity - ? WHERE id = ?', parameters: [...] }
];
await myexectrans(queries);
```

## Error Handling

```javascript
try {
    const result = await myexec('SELECT * FROM users WHERE id = ?', [123]);
    console.log('User found:', result[0]);
} catch (error) {
    console.error('Database error:', error.message);
    // Handle error appropriately
}
```

## Development vs Production

The library automatically adjusts behavior based on `NODE_ENV`:

- **Development** (`NODE_ENV=dev`): Query logging, connection details logging
- **Production** (`NODE_ENV=production`): Silent operation, error logging only

## Troubleshooting

### Common Issues

**Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Check if MySQL server is running
- Verify host and port configuration

**Authentication Failed**
```
Error: Access denied for user 'username'@'host'
```
- Verify username and password
- Check user permissions

## Changelog

### [2.1.1] - 2025-08-13
- Fixed: Remove `poolAlias` from MySQL2 connection config to eliminate deprecation warning
- No breaking changes - fully backward compatible

## License

[MIT](https://github.com/thesuhu/mysqlexec/blob/master/LICENSE)