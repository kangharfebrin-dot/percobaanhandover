const fs = require('fs');

const updateListScreen = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add screenWidth state if not exists
  if (!content.includes('const [screenWidth, setScreenWidth]')) {
    content = content.replace(
      'export default function',
      `const { Dimensions } = require('react-native');\nexport default function`
    );
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      `const [loading, setLoading] = useState(true);\n  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);\n\n  useEffect(() => {\n    const onChange = ({ window }) => setScreenWidth(window.width);\n    const subscription = Dimensions.addEventListener('change', onChange);\n    return () => subscription?.remove();\n  }, []);\n\n  const isLargeScreen = Platform.OS === 'web' && screenWidth > 768;\n  const numCols = isLargeScreen ? 3 : 1;`
    );
  }

  // Find FlatList and replace properties
  content = content.replace(/<FlatList/g, '<FlatList key={numCols} numColumns={numCols} columnWrapperStyle={isLargeScreen ? tw`justify-start gap-4` : undefined}');
  
  // Replace max-w-4xl to max-w-7xl
  content = content.replace(/max-w-4xl mx-auto/g, 'max-w-7xl mx-auto');

  // Find renderItem's outer TouchableOpacity/View and adjust width for grid
  // We'll add a class for flex-1 and min-width if isLargeScreen
  content = content.replace(
    /style={tw`bg-white p-5 rounded-2xl/g,
    'style={tw`${isLargeScreen ? "flex-1 min-w-[30%] mx-2" : "w-full"} bg-white p-5 rounded-2xl'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', filePath);
};

updateListScreen('d:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/VehicleListScreen.js');
updateListScreen('d:/UKSW/Pertamina/HandoverApp/frontend/screens/admin/WorkerListScreen.js');
updateListScreen('d:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/IssueListScreen.js');

