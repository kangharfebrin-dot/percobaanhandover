const fs = require('fs');
const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/HandoverFormScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add userRole state
content = content.replace(
  "const [uploading, setUploading] = useState(false);",
  "const [uploading, setUploading] = useState(false);\n  const [userRole, setUserRole] = useState('USER');"
);

// 2. Extract role when getting user from AsyncStorage
const oldUserFetch = `const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1 }; // Fallback for dev
      formData.append('userId', user.id);`;
const newUserFetch = `const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 1, role: 'USER' }; // Fallback for dev
      setUserRole(user.role || 'USER');
      formData.append('userId', user.id);`;
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
console.log('Fixed HandoverFormScreen navigation bug');
