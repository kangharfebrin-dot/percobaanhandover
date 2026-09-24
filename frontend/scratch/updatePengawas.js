const fs = require('fs');

let file = 'd:/UKSW/Pertamina/HandoverApp/frontend/screens/pengawas/PengawasDashboardScreen.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Update ScrollView
content = content.replace(
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6' : 'p-6 pt-6 pb-32'}`}>",
  "<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`${isLargeScreen ? 'p-6 max-w-7xl mx-auto w-full' : 'p-6 pt-6 pb-32 w-full'}`}>"
);

// 2. Update alerts.map
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
console.log('PengawasDashboardScreen updated');
