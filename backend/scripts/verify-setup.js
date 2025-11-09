/**
 * Setup Verification Script
 * Checks if the environment is properly configured for running Needs Connect
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Needs Connect Setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check Node.js version
console.log('1. Checking Node.js version...');
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
if (nodeMajor >= 18) {
  console.log(`   ✓ Node.js ${nodeVersion} (required: >=18.0.0)`);
} else {
  console.log(`   ✗ Node.js ${nodeVersion} (required: >=18.0.0)`);
  hasErrors = true;
}

// Check npm version
console.log('\n2. Checking npm version...');
const { execSync } = require('child_process');
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  const npmMajor = parseInt(npmVersion.split('.')[0]);
  if (npmMajor >= 9) {
    console.log(`   ✓ npm ${npmVersion} (required: >=9.0.0)`);
  } else {
    console.log(`   ⚠ npm ${npmVersion} (recommended: >=9.0.0)`);
    hasWarnings = true;
  }
} catch (err) {
  console.log('   ✗ Could not check npm version');
  hasErrors = true;
}

// Check .env file
console.log('\n3. Checking environment configuration...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
  require('dotenv').config({ path: envPath });
  
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] && varName !== 'DB_PASSWORD') {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('   ✓ All required environment variables are set');
    console.log(`     DB_HOST: ${process.env.DB_HOST || 'not set'}`);
    console.log(`     DB_USER: ${process.env.DB_USER || 'not set'}`);
    console.log(`     DB_NAME: ${process.env.DB_NAME || 'not set'}`);
    console.log(`     PORT: ${process.env.PORT || '5000 (default)'}`);
  } else {
    console.log(`   ✗ Missing environment variables: ${missingVars.join(', ')}`);
    hasErrors = true;
  }
} else {
  console.log('   ✗ .env file not found');
  console.log('     Create backend/.env with:');
  console.log('     DB_HOST=localhost');
  console.log('     DB_USER=root');
  console.log('     DB_PASSWORD=');
  console.log('     DB_NAME=needs_connect');
  console.log('     PORT=5000');
  hasErrors = true;
}

// Check node_modules
console.log('\n4. Checking dependencies...');
const backendNodeModules = path.join(__dirname, '..', 'node_modules');
const frontendNodeModules = path.join(__dirname, '..', '..', 'frontend', 'node_modules');

if (fs.existsSync(backendNodeModules)) {
  console.log('   ✓ Backend dependencies installed');
} else {
  console.log('   ✗ Backend dependencies not installed');
  console.log('     Run: cd backend && npm install');
  hasErrors = true;
}

if (fs.existsSync(frontendNodeModules)) {
  console.log('   ✓ Frontend dependencies installed');
} else {
  console.log('   ✗ Frontend dependencies not installed');
  console.log('     Run: cd frontend && npm install');
  hasErrors = true;
}

// Check database files
console.log('\n5. Checking database files...');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  console.log('   ✓ Database schema file exists');
} else {
  console.log('   ✗ Database schema file not found');
  hasErrors = true;
}

// Check setup-db.js
const setupDbPath = path.join(__dirname, '..', 'setup-db.js');
if (fs.existsSync(setupDbPath)) {
  console.log('   ✓ Database setup script exists');
} else {
  console.log('   ✗ Database setup script not found');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Setup verification failed!');
  console.log('\nPlease fix the errors above before running the application.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Setup verification passed with warnings.');
  console.log('\nYou can proceed, but consider addressing the warnings.');
  process.exit(0);
} else {
  console.log('✅ Setup verification passed!');
  console.log('\nNext steps:');
  console.log('1. Start database: npm run db:start (in backend/)');
  console.log('2. Initialize database: node setup-db.js (in backend/)');
  console.log('3. Start backend: npm start (in backend/)');
  console.log('4. Start frontend: npm run dev (in frontend/)');
  process.exit(0);
}

