const fs = require('fs');
const path = require('path');

const dirs = [
  'admin',
  'pengawas',
  'shared',
  'user'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', 'screens', dir);
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(dirPath, file);
      let content = fs.readFileSync(filePath, 'utf-8');

      // Simple deduper for the react-native import line
      const reactNativeImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];/g;
      let changed = false;

      content = content.replace(reactNativeImportRegex, (match, importsStr) => {
        const parts = importsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const uniqueParts = [...new Set(parts)];
        if (parts.length !== uniqueParts.length) {
          changed = true;
          return `import { ${uniqueParts.join(', ')} } from 'react-native';`;
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Deduplicated imports in ${dir}/${file}`);
      }
    }
  });
});
