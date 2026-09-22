const fs = require('fs');
const file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/CameraScreen.js';
let content = fs.readFileSync(file, 'utf8');

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

// insert before takePicture
if (!content.includes('const goToDashboard')) {
  content = content.replace("const takePicture = async () => {", goBackHelper + "\n  const takePicture = async () => {");
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CameraScreen missing goToDashboard');
