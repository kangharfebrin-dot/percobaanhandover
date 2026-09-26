const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

let errorCount = 0;

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
        checkDir(fullPath);
      }
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      try {
        parser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx']
        });
      } catch (err) {
        console.error(`ERROR in ${fullPath}:`, err.message);
        errorCount++;
      }
    }
  }
}

console.log('Checking screens directory...');
checkDir(path.join(__dirname, '..', 'screens'));
console.log('Checking components directory...');
checkDir(path.join(__dirname, '..', 'components'));
console.log(`Check complete. Total errors: ${errorCount}`);
if (errorCount > 0) process.exit(1);
