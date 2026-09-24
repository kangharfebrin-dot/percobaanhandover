const fs = require('fs');

let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/user/UserDashboardScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Update ScrollView
content = content.replace(
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6' : 'p-6 pt-6 pb-32'}`}>",
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full flex-row justify-between' : 'p-6 pt-6 pb-32 w-full'}`}>"
);

// 2. We need to format the layout for Desktop for UserDashboard. Since it doesn't have a sidebar, we split the content into two columns if isLargeScreen.
// However, a simple string replacement for a complex two-column layout is risky if the structure isn't exactly as expected.
// So let's just apply max-width to UserDashboard for now so it's not full-width stretched on large screens.
content = content.replace(
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full flex-row justify-between' : 'p-6 pt-6 pb-32 w-full'}`}>",
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-5xl mx-auto w-full' : 'p-6 pt-6 pb-32 w-full'}`}>"
);

// For alerts map in UserDashboard
content = content.replace(
  "alerts.map(item => <React.Fragment key={item.id}>{renderAlertItem({ item })}</React.Fragment>)",
  `<View style={tw\`\${isLargeScreen ? 'flex-row flex-wrap justify-between' : ''}\`}>
                    {alerts.map(item => (
                      <View key={item.id} style={tw\`\${isLargeScreen ? 'w-[48%] mb-4' : 'w-full'}\`}>
                        {renderAlertItem({ item })}
                      </View>
                    ))}
                  </View>`
);


fs.writeFileSync(file, content, 'utf8');
console.log('UserDashboardScreen updated');
