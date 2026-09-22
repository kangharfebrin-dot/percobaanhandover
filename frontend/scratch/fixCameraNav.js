const fs = require('fs');
const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/CameraScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add userRole state
content = content.replace(
  "const [location, setLocation] = useState(null);",
  "const [location, setLocation] = useState(null);\n  const [userRole, setUserRole] = useState('USER');"
);

// 2. Extract role when getting user from AsyncStorage
const oldUserFetch = `const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);`;
const newUserFetch = `const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1, role: 'USER' };
      setUserRole(user.role || 'USER');`;
content = content.replace(oldUserFetch, newUserFetch);

// 3. Create a helper function to go back to the correct dashboard
const goBackHelper = `
  const goToDashboard = () => {
    if (userRole === 'SUPER_ADMIN') {
      navigation.navigate('AdminDashboard');
    } else if (userRole === 'PENGAWAS') {
      navigation.navigate('PengawasDashboard');
    } else {
      navigation.navigate('UserDashboard');
    }
  };
`;
// insert before handleSubmit
content = content.replace("const handleSubmit = async () => {", goBackHelper + "\n  const handleSubmit = async () => {");

// 4. Replace navigation.navigate('UserDashboard') with goToDashboard()
content = content.replace(/navigation\.navigate\('UserDashboard'\)/g, "goToDashboard()");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CameraScreen navigation bug');
