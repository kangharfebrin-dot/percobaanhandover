const fs = require('fs');
const file = 'e:/Magang/HandoverApp/frontend/screens/user/FixVerificationScreen.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const res = await axios.post(`${API_URL}/api/issues/${issue.id}/verify-repair`, formData, {\r\n        headers: { 'Content-Type': 'multipart/form-data' },\r\n      });",
  "const token = await AsyncStorage.getItem('token');\n      const res = await axios.post(`${API_URL}/api/issues/${issue.id}/verify-repair`, formData, {\n        headers: {\n          'Content-Type': 'multipart/form-data',\n          'Authorization': `Bearer ${token}`\n        },\n      });"
);
content = content.replace(
  "const res = await axios.post(`${API_URL}/api/issues/${issue.id}/verify-repair`, formData, {\n        headers: { 'Content-Type': 'multipart/form-data' },\n      });",
  "const token = await AsyncStorage.getItem('token');\n      const res = await axios.post(`${API_URL}/api/issues/${issue.id}/verify-repair`, formData, {\n        headers: {\n          'Content-Type': 'multipart/form-data',\n          'Authorization': `Bearer ${token}`\n        },\n      });"
);
fs.writeFileSync(file, content);
console.log("Done");
