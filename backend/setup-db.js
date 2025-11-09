const mysql = require('mysql2');
require('dotenv').config();

// Connect without database first to create it
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

console.log('🔧 Setting up database...\n');
console.log('Connecting to MySQL server...');

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure the database server is running (npm run db:start)');
    console.error('2. Wait 10-15 seconds after starting database before running setup');
    console.error('3. Check that .env file exists with correct DB_HOST, DB_USER, DB_PASSWORD');
    console.error('4. Verify the database server is accessible');
    process.exit(1);
    return;
  }
  
  console.log('✓ Connected to MySQL server\n');
  
  // Create database if it doesn't exist
  console.log(`Creating database '${process.env.DB_NAME}'...`);
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err, results) => {
    if (err) {
      console.error('❌ Error creating database:', err.message);
      connection.end();
      process.exit(1);
      return;
    }
    
    console.log(`✓ Database '${process.env.DB_NAME}' created or already exists\n`);
    
    // Now connect to the specific database and run schema
    const dbConnection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
      console.log('Connecting to database...');
      dbConnection.connect((err) => {
      if (err) {
        console.error('❌ Error connecting to database:', err.message);
        connection.end();
        process.exit(1);
        return;
      }
      
      console.log('✓ Connected to database\n');
      
      // Read and execute schema file
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, 'database', 'schema.sql');
      
      console.log('Reading schema file...');
      fs.readFile(schemaPath, 'utf8', (err, schema) => {
        if (err) {
          console.error('❌ Error reading schema file:', err.message);
          console.error(`   Expected file at: ${schemaPath}`);
          dbConnection.end();
          connection.end();
          process.exit(1);
          return;
        }
        
        console.log('✓ Schema file loaded\n');
        console.log('Executing database schema...');
        
        // Split by semicolons and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
        let completed = 0;
        let errors = 0;
        
        if (statements.length === 0) {
          console.log('⚠️  No SQL statements to execute');
          dbConnection.end();
          connection.end();
          return;
        }
        
        statements.forEach((statement, index) => {
          const trimmed = statement.trim();
          if (trimmed && trimmed.length > 10) { // Ignore very short statements
            dbConnection.query(trimmed, (err, results) => {
              if (err) {
                console.error(`   ❌ Error executing statement ${index + 1}:`, err.message);
                errors++;
              } else {
                // Only log important statements to reduce noise
                if (trimmed.toUpperCase().startsWith('CREATE TABLE') || 
                    trimmed.toUpperCase().startsWith('CREATE INDEX')) {
                  const tableMatch = trimmed.match(/CREATE TABLE.*?`?(\w+)`?/i);
                  const indexMatch = trimmed.match(/CREATE INDEX.*?ON.*?`?(\w+)`?/i);
                  const name = tableMatch ? tableMatch[1] : (indexMatch ? `index on ${indexMatch[1]}` : `statement ${index + 1}`);
                  console.log(`   ✓ Created ${name}`);
                }
              }
              
              completed++;
              if (completed === statements.length) {
                console.log('');
                if (errors === 0) {
                  console.log('✅ Database setup complete!');
                  console.log('');
                  console.log('Next steps:');
                  console.log('1. Run "npm run seed" to add sample data (optional)');
                  console.log('2. Run "npm start" to start the backend server');
                } else {
                  console.log(`⚠️  Database setup completed with ${errors} error(s)`);
                }
                dbConnection.end();
                connection.end();
              }
            });
          } else {
            completed++;
            if (completed === statements.length) {
              console.log('');
              console.log('✅ Database setup complete!');
              dbConnection.end();
              connection.end();
            }
          }
        });
      });
    });
  });
});