// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from './screens/LoginPage';
import RegisterPage from './screens/RegisterPage';
import MainPage from './screens/MainPage';
import BookCasePage from './screens/BookCasePage';
import BooksPage from './screens/BooksPage';
import ProfilePage from './screens/ProfilePage';
import BookDetailPage from './screens/BookDetailPage';
import { TouchableOpacity, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Ana Sayfa" 
          component={MainPage} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="BookCase" 
          component={BookCasePage} 
          options={{ 
            title: 'Kitaplığım',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <Stack.Screen 
          name="Books" 
          component={BooksPage} 
          options={({ route }) => ({ 
            title: route.params.bookCase.name,
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          })} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfilePage}
          options={{
            title: 'Profile',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen name="BookDetail" component={BookDetailPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}