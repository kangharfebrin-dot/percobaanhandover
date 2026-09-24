const fs = require('fs');
let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/HandoverFormScreen.js';
let content = fs.readFileSync(file, 'utf8');

const target1 = "const [shift, setShift] = useState('08:00');";
const replace1 = `const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const [shift, setShift] = useState(\`\${currentHour}:\${currentMinute}\`);`;

const target2 = "const [selectedHour, setSelectedHour] = useState('08');";
const replace2 = "const [selectedHour, setSelectedHour] = useState(currentHour);";

const target3 = "const [selectedMinute, setSelectedMinute] = useState('00');";
const replace3 = "const [selectedMinute, setSelectedMinute] = useState(currentMinute);";

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);
content = content.replace(target3, replace3);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HandoverFormScreen');
