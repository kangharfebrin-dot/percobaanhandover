const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.js')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const screensDir = 'e:/Magang/HandoverApp/frontend/screens';
const files = walkSync(screensDir);

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Ensure Toast is imported if we are replacing something
  let hasReplaced = false;

  // We want to replace Alert.alert('Title', 'Message');
  // With Toast.show({ type: 'success'/'error'/'info', text1: 'Title', text2: 'Message' });
  // Regex to match Alert.alert with exactly 2 string arguments
  const alertRegex = /Alert\.alert\(\s*(['"`])(.*?)\1\s*,\s*(['"`])(.*?)\3\s*\);?/g;

  content = content.replace(alertRegex, (match, q1, title, q2, message) => {
    // If the string contains variables (like template literals), we should try to keep them if they are backticks
    let type = 'info';
    let titleLower = title.toLowerCase();
    if (titleLower.includes('sukses') || titleLower.includes('berhasil')) type = 'success';
    else if (titleLower.includes('error') || titleLower.includes('gagal')) type = 'error';
    else if (titleLower.includes('peringatan') || titleLower.includes('izin')) type = 'info'; // 'info' is usually good enough for warnings, or we can use 'error'

    hasReplaced = true;
    return `Toast.show({
        type: '${type}',
        text1: \`${title}\`,
        text2: \`${message}\`
      });`;
  });

  if (hasReplaced) {
    if (!content.includes('react-native-toast-message')) {
      // Add import at the top
      content = `import Toast from 'react-native-toast-message';\n` + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated', file);
  }
});

console.log('Total files changed:', changedFiles);
