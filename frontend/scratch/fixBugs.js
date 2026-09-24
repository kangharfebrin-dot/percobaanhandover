const fs = require('fs');

const fixHistoryScreen = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HistoryScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('const numCols =')) {
    content = content.replace(
      'const isLargeScreen = screenWidth > 768;',
      'const isLargeScreen = screenWidth > 768;\n  const numCols = isLargeScreen && Platform.OS === "web" ? 3 : 1;'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed HistoryScreen');
  }
};

const fixHandoverFormScreen = () => {
  let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/HandoverFormScreen.js';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('const now = new Date();')) {
    content = content.replace(
      "const { noPolisi: initialNoPolisi, type } = route?.params || {};",
      `const { noPolisi: initialNoPolisi, type } = route?.params || {};
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');`
    );

    content = content.replace(
      "const [shift, setShift] = useState('08:00');",
      "const [shift, setShift] = useState(`${currentHour}:${currentMinute}`);"
    );

    content = content.replace(
      "const [selectedHour, setSelectedHour] = useState('08');",
      "const [selectedHour, setSelectedHour] = useState(currentHour);"
    );

    content = content.replace(
      "const [selectedMinute, setSelectedMinute] = useState('00');",
      "const [selectedMinute, setSelectedMinute] = useState(currentMinute);"
    );
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed HandoverFormScreen');
  }
};

fixHistoryScreen();
fixHandoverFormScreen();
