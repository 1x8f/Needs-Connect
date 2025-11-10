#!/usr/bin/env node

/**
 * Automated Setup Script for Needs Connect
 * This script helps set up the project on any device
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...\n', 'cyan');
  
  const issues = [];
  
  // Check Node.js
  if (!checkCommand('node', 'Node.js')) {
    issues.push('Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/');
  } else {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
      issues.push(`Node.js version ${nodeVersion} is too old. Please install Node.js 18+ from https://nodejs.org/`);
    } else {
      log(`✓ Node.js ${nodeVersion}`, 'green');
    }
  }
  
  // Check npm
  if (!checkCommand('npm', 'npm')) {
    issues.push('npm is not installed. npm comes with Node.js, so please reinstall Node.js.');
  } else {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(npmVersion.split('.')[0]);
    if (majorVersion < 9) {
      issues.push(`npm version ${npmVersion} is too old. Please update npm: npm install -g npm@latest`);
    } else {
      log(`✓ npm ${npmVersion}`, 'green');
    }
  }
  
  if (issues.length > 0) {
    log('\n❌ Prerequisites check failed:\n', 'red');
    issues.forEach(issue => log(`  • ${issue}`, 'yellow'));
    log('\nPlease fix these issues and run the setup again.\n', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ All prerequisites met!\n', 'green');
}

function createEnvFile() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envExamplePath = path.join(__dirname, 'backend', '.env.example');
  
  if (fs.existsSync(envPath)) {
    log('✓ .env file already exists', 'green');
    return;
  }
  
  log('Creating .env file...', 'cyan');
  
  const envContent = `# Database Configuration
# Default values for bundled MariaDB (npm run db:start)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=needs_connect

# Server Configuration
PORT=5000
`;
  
  fs.writeFileSync(envPath, envContent);
  log('✓ .env file created', 'green');
}

function installDependencies() {
  log('\n📦 Installing dependencies...\n', 'cyan');
  
  // Install backend dependencies
  log('Installing backend dependencies...', 'blue');
  try {
    process.chdir(path.join(__dirname, 'backend'));
    execSync('npm install', { stdio: 'inherit' });
    log('✓ Backend dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install backend dependencies', 'red');
    process.exit(1);
  }
  
  // Install frontend dependencies
  log('\nInstalling frontend dependencies...', 'blue');
  try {
    process.chdir(path.join(__dirname, 'frontend'));
    execSync('npm install', { stdio: 'inherit' });
    log('✓ Frontend dependencies installed', 'green');
  } catch (error) {
    log('❌ Failed to install frontend dependencies', 'red');
    process.exit(1);
  }
  
  process.chdir(__dirname);
}

function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  Needs Connect - Automated Setup', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  // Check prerequisites
  checkPrerequisites();
  
  // Create .env file
  log('📝 Setting up environment...\n', 'cyan');
  createEnvFile();
  
  // Install dependencies
  installDependencies();
  
  // Success message
  log('\n' + '='.repeat(60), 'green');
  log('  ✅ Setup Complete!', 'green');
  log('='.repeat(60) + '\n', 'green');
  
  log('Next steps:', 'bright');
  log('\n1. Start the database (Terminal 1):', 'cyan');
  log('   cd backend');
  log('   npm run db:start');
  log('\n2. Initialize database (Terminal 2 - wait 15 seconds after step 1):', 'cyan');
  log('   cd backend');
  log('   npm run setup-db');
  log('\n3. (Optional) Seed sample data (Terminal 2):', 'cyan');
  log('   npm run seed');
  log('\n4. Start backend server (Terminal 2):', 'cyan');
  log('   npm start');
  log('\n5. Start frontend (Terminal 3):', 'cyan');
  log('   cd frontend');
  log('   npm run dev');
  log('\n6. Open http://localhost:3000 in your browser', 'cyan');
  log('\n💡 Tip: Login with username "admin" for manager access\n', 'yellow');
}

main();

