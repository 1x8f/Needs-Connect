const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');
const os = require('os');

const mysqlServerRoot = path.dirname(require.resolve('mysql-server/package.json'));
const libDir = path.join(mysqlServerRoot, 'lib');
const zipPath = path.join(libDir, 'xampp.zip');
const xamppDir = path.join(libDir, 'xampp');
const mysqlBinDir = path.join(xamppDir, 'mysql', 'bin');
const myIniPath = path.join(mysqlBinDir, 'my.ini');
const myIniBackupPath = path.join(mysqlBinDir, 'my.ini.backup');

// Detect OS and set appropriate start script
const platform = os.platform();
let startScript;
let startCommand;
let startArgs;

if (platform === 'win32') {
  startScript = path.join(xamppDir, 'mysql_start.bat');
  startCommand = 'cmd.exe';
  startArgs = ['/c', 'call', startScript];
} else {
  // For Mac/Linux, mysql-server package is Windows-only
  console.error('❌ Error: The bundled MySQL server only works on Windows.');
  console.error('');
  console.error('For Mac/Linux, you have two options:');
  console.error('1. Install MySQL/MariaDB locally and update backend/.env with your connection details');
  console.error('2. Use Docker to run MySQL');
  console.error('');
  console.error('See README.md for more details.');
  process.exit(1);
}

function ensureBundleExtracted() {
  if (fs.existsSync(xamppDir) && fs.existsSync(startScript)) {
    console.log('✓ MySQL bundle already extracted.');
    return;
  }

  if (!fs.existsSync(zipPath)) {
    console.error('❌ Error: Bundled MySQL archive not found.');
    console.error(`   Expected at: ${zipPath}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure you ran "npm install" in the backend directory');
    console.error('2. Check that node_modules/mysql-server exists');
    console.error('3. Try deleting node_modules and running "npm install" again');
    process.exit(1);
  }

  console.log('📦 Extracting bundled MySQL (first run may take 1-2 minutes)...');
  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(libDir, true);
    console.log('✓ Extraction complete.');
  } catch (error) {
    console.error('❌ Error extracting MySQL bundle:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure you have enough disk space (at least 200MB free)');
    console.error('2. Check that the zip file is not corrupted');
    console.error('3. Try deleting node_modules/mysql-server/lib/xampp and running again');
    process.exit(1);
  }
}

function ensureMyIni() {
  if (fs.existsSync(myIniPath)) {
    return;
  }

  if (!fs.existsSync(myIniBackupPath)) {
    console.error('❌ Error: MySQL configuration backup not found.');
    console.error(`   Expected at: ${myIniBackupPath}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. The MySQL bundle may not have extracted correctly');
    console.error('2. Try deleting node_modules/mysql-server/lib/xampp and running again');
    process.exit(1);
  }

  console.log('⚙️  Creating MySQL configuration file...');
  try {
    fs.copyFileSync(myIniBackupPath, myIniPath);
    const current = fs.readFileSync(myIniPath, 'utf8');
    const normalizedRoot = mysqlServerRoot.replace(/\\/g, '/');
    const updated = current.replace(/#FULLDIR#/g, normalizedRoot);
    fs.writeFileSync(myIniPath, updated, 'utf8');
    console.log('✓ Configuration file created.');
  } catch (error) {
    console.error('❌ Error creating MySQL configuration:', error.message);
    process.exit(1);
  }
}

function startMysql() {
  if (!fs.existsSync(startScript)) {
    console.error('❌ Error: MySQL start script not found.');
    console.error(`   Expected at: ${startScript}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure the MySQL bundle was extracted correctly');
    console.error('2. Try running "npm install" again in the backend directory');
    process.exit(1);
  }

  console.log('');
  console.log('🚀 Starting bundled MySQL server...');
  console.log('   (Press Ctrl+C to stop)');
  console.log('');
  console.log('Please wait... MySQL is starting...');
  console.log('');
  
  const child = spawn(startCommand, startArgs, {
    stdio: 'inherit',
    shell: false
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('');
      console.error(`❌ MySQL process exited with code ${code}`);
      console.error('');
      console.error('Troubleshooting:');
      console.error('1. Make sure port 3306 is not already in use');
      console.error('2. On Windows: Try running terminal as Administrator');
      console.error('3. Check Windows Firewall settings');
      console.error('4. Make sure no other MySQL server is running');
    }
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('');
    console.error('❌ Failed to start MySQL process:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. On Windows: Try running terminal as Administrator');
    console.error('2. Check that the start script exists and is executable');
    console.error('3. Verify the MySQL bundle was extracted correctly');
    process.exit(1);
  });
}

// Main execution
try {
  ensureBundleExtracted();
  ensureMyIni();
  startMysql();
} catch (error) {
  console.error('');
  console.error('❌ Unable to start bundled MySQL:', error.message);
  console.error('');
  console.error('Troubleshooting:');
  console.error('1. Make sure you ran "npm install" in the backend directory');
  console.error('2. Check that you have sufficient disk space');
  console.error('3. On Windows: Try running terminal as Administrator');
  console.error('4. See README.md for more detailed troubleshooting');
  process.exit(1);
}

