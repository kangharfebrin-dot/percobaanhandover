import os
path = r'd:\UKSW\Pertamina\HandoverApp\frontend\App.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "import HandoverFormScreen from './screens/user/HandoverFormScreen';\nconst Stack = createNativeStackNavigator();"
replacement1 = "import HandoverFormScreen from './screens/user/HandoverFormScreen';\nimport FixVerificationScreen from './screens/user/FixVerificationScreen';\nconst Stack = createNativeStackNavigator();"

target2 = '<Stack.Screen name="HandoverForm" component={HandoverFormScreen} />\n        <Stack.Screen name="History" component={HistoryScreen} />'
replacement2 = '<Stack.Screen name="HandoverForm" component={HandoverFormScreen} />\n        <Stack.Screen name="FixVerification" component={FixVerificationScreen} />\n        <Stack.Screen name="History" component={HistoryScreen} />'

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced')
