const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip');

const mysqlServerRoot = path.dirname(require.resolve('mysql-server/package.json'));
const libDir = path.join(mysqlServerRoot, 'lib');
const zipPath = path.join(libDir, 'xampp.zip');
const xamppDir = path.join(libDir, 'xampp');
const mysqlBinDir = path.join(xamppDir, 'mysql', 'bin');
const myIniPath = path.join(mysqlBinDir, 'my.ini');
const myIniBackupPath = path.join(mysqlBinDir, 'my.ini.backup');
const startScript = path.join(xamppDir, 'mysql_start.bat');

function ensureBundleExtracted() {
  if (fs.existsSync(xamppDir) && fs.existsSync(startScript)) {
    console.log('MySQL bundle already extracted.');
    return;
  }

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Bundled MySQL archive not found at ${zipPath}`);
  }

  console.log('Extracting bundled MySQL (first run may take a minute)...');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(libDir, true);
  console.log('Extraction complete.');
}

function ensureMyIni() {
  if (fs.existsSync(myIniPath)) {
    return;
  }

  if (!fs.existsSync(myIniBackupPath)) {
    throw new Error(`Expected MySQL configuration backup missing at ${myIniBackupPath}`);
  }

  console.log('Creating MySQL configuration file...');
  fs.copyFileSync(myIniBackupPath, myIniPath);
  const current = fs.readFileSync(myIniPath, 'utf8');
  const normalizedRoot = mysqlServerRoot.replace(/\\/g, '/');
  const updated = current.replace(/#FULLDIR#/g, normalizedRoot);
  fs.writeFileSync(myIniPath, updated, 'utf8');
}

function startMysql() {
  console.log('Starting bundled MySQL server... (press Ctrl+C to stop)');
  const child = spawn('cmd.exe', ['/c', 'call', startScript], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    console.log(`MySQL process exited with code ${code}`);
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('Failed to start MySQL process:', error);
    process.exit(1);
  });
}

try {
  ensureBundleExtracted();
  ensureMyIni();
  startMysql();
} catch (error) {
  console.error('Unable to start bundled MySQL:', error);
  process.exit(1);
}

