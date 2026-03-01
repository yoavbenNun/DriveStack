import React from 'react';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyDriveScreen from '../screens/MyDriveScreen'; 

const Stack = createStackNavigator();

export default function AppNavigator({ userToken, setUserToken }) {
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null); 
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  return (
    <Stack.Navigator>
      {userToken == null ? (
        <>
          <Stack.Screen name="Login" options={{ headerShown: false }}>
            {props => <LoginScreen {...props} setUserToken={setUserToken} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen 
          name="MyDrive" 
          options={{ 
            title: 'My Drive',
            headerRight: () => (
              <Button onPress={handleLogout} title="Logout" color="#ff3b30" />
            ),
          }}
        >
          {props => <MyDriveScreen {...props} setUserToken={setUserToken} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}