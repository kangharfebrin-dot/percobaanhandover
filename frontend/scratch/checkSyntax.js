const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f !== 'node_modules' && f !== '.expo' && f !== '.git') {
      isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    }
  });
};

walk('d:/UKSW/Pertamina/HandoverApp/frontend/screens', (filePath) => {
  if (filePath.endsWith('.js')) {
    try {
      execSync(`node -c "${filePath}"`, {stdio: 'ignore'});
    } catch (e) {
      console.log('Syntax Error in:', filePath);
    }
  }
});
