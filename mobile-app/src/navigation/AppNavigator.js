import React from 'react';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyDriveScreen from '../screens/MyDriveScreen'; 
import StarredScreen from '../screens/StarredScreen';
import SharedScreen from '../screens/SharedScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ setUserToken }) => {
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null); 
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'MyDrive') iconName = 'folder';
          else if (route.name === 'Starred') iconName = 'star';
          else if (route.name === 'Shared') iconName = 'folder-shared';
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <Button onPress={handleLogout} title="Logout" color="#ff3b30" />
        ),
      })}
    >
      <Tab.Screen name="MyDrive" component={MyDriveScreen} options={{ title: 'My Drive' }} />
      <Tab.Screen name="Starred" component={StarredScreen} options={{ title: 'Starred' }} />
      <Tab.Screen name="Shared" component={SharedScreen} options={{ title: 'Shared' }} />
    </Tab.Navigator>
  );
};

export default function AppNavigator({ userToken, setUserToken }) {
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
        <Stack.Screen name="Main" options={{ headerShown: false }}>
          {props => <MainTabs {...props} setUserToken={setUserToken} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}