const fs = require('fs');
const path = require('path');

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
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('http://192.168.1.4:3000')) {
      const relativeDepth = path.relative(path.dirname(filePath), 'd:/UKSW/Pertamina/HandoverApp/frontend').split(path.sep).length;
      const importPath = '../'.repeat(relativeDepth - 1) + '../config';
      
      let newContent = content;
      
      // Replace instances of 'http://192.168.1.4:3000' with API_URL (with backticks)
      newContent = newContent.replace(/'http:\/\/192\.168\.1\.4:3000([^']*)'/g, '`${API_URL}$1`');
      
      // Replace instances of "http://192.168.1.4:3000" with API_URL (with backticks)
      newContent = newContent.replace(/"http:\/\/192\.168\.1\.4:3000([^"]*)"/g, '`${API_URL}$1`');
      
      // Replace inside existing backticks
      newContent = newContent.replace(/http:\/\/192\.168\.1\.4:3000/g, '${API_URL}');

      if (!newContent.includes('import { API_URL }')) {
         const lines = newContent.split('\n');
         const reactImportIndex = lines.findIndex(l => l.startsWith('import React'));
         if (reactImportIndex !== -1) {
            lines.splice(reactImportIndex + 1, 0, `import { API_URL } from '${importPath.replace(/\\/g, '/')}';`);
         } else {
            lines.unshift(`import { API_URL } from '${importPath.replace(/\\/g, '/')}';`);
         }
         newContent = lines.join('\n');
      }
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
