const mysql = require('mysql2');
require('dotenv').config();

// Connect without database first to create it
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  
  console.log('Connected to MySQL server');
  
  // Create database if it doesn't exist
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err, results) => {
    if (err) {
      console.error('Error creating database:', err);
      connection.end();
      return;
    }
    
    console.log(`Database '${process.env.DB_NAME}' created or already exists`);
    
    // Now connect to the specific database and run schema
    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    dbConnection.connect((err) => {
      if (err) {
        console.error('Error connecting to database:', err);
        connection.end();
        return;
      }
      
      console.log('Connected to database');
      
      // Read and execute schema file
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      
      fs.readFile(schemaPath, 'utf8', (err, schema) => {
        if (err) {
          console.error('Error reading schema file:', err);
          dbConnection.end();
          connection.end();
          return;
        }
        
        // Split by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        let completed = 0;
        
        if (statements.length === 0) {
          console.log('No SQL statements to execute');
          dbConnection.end();
          connection.end();
          return;
        }
        
        statements.forEach((statement, index) => {
          const trimmed = statement.trim();
          if (trimmed) {
            dbConnection.query(trimmed, (err, results) => {
              if (err) {
                console.error(`Error executing statement ${index + 1}:`, err);
              } else {
                console.log(`Executed statement ${index + 1} successfully`);
              }
              
              completed++;
              if (completed === statements.length) {
                console.log('Database setup complete!');
                dbConnection.end();
                connection.end();
              }
            });
          }
        });
      });
    });
  });
});