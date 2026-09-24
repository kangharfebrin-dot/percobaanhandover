const fs = require('fs');

const updateHistoryScreen = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add screenWidth state if not exists
  if (!content.includes('const [screenWidth, setScreenWidth]')) {
    content = content.replace(
      'export default function HistoryScreen({ navigation }) {',
      `const { Dimensions } = require('react-native');\nexport default function HistoryScreen({ navigation }) {`
    );
    content = content.replace(
      'const [handovers, setHandovers] = useState([]);',
      `const [handovers, setHandovers] = useState([]);\n  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);\n\n  useEffect(() => {\n    const onChange = ({ window }) => setScreenWidth(window.width);\n    const subscription = Dimensions.addEventListener('change', onChange);\n    return () => subscription?.remove();\n  }, []);\n\n  const isLargeScreen = Platform.OS === 'web' && screenWidth > 768;\n  const numCols = isLargeScreen ? 3 : 1;`
    );
  }

  // Find FlatList and replace properties
  content = content.replace(/<FlatList/g, '<FlatList key={numCols} numColumns={numCols} columnWrapperStyle={isLargeScreen ? tw`justify-start gap-4` : undefined}');
  
  // Replace max-w-4xl to max-w-7xl
  content = content.replace(/max-w-4xl mx-auto/g, 'max-w-7xl mx-auto');

  // Find renderItem's outer TouchableOpacity and adjust width for grid
  content = content.replace(
    /style={tw`bg-white p-5 rounded-2xl mb-4 shadow-md border \${isNormal \? 'border-green-100' : \(isResolved \? 'border-blue-200' : 'border-red-200'\)}`}/g,
    'style={tw`${isLargeScreen ? "flex-1 min-w-[30%] mx-2" : "w-full"} bg-white p-5 rounded-2xl mb-4 shadow-md border ${isNormal ? "border-green-100" : (isResolved ? "border-blue-200" : "border-red-200")}`}'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated HistoryScreen');
};

updateHistoryScreen('d:/UKSW/Pertamina/HandoverApp/frontend/screens/shared/HistoryScreen.js');

