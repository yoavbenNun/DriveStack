import React from 'react';
import { Button, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyDriveScreen from '../screens/MyDriveScreen'; 
import StarredScreen from '../screens/StarredScreen';
import SharedScreen from '../screens/SharedScreen';
import TrashScreen from '../screens/TrashScreen';
import ProfileWidget from '../components/ProfileWidget';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ setUserToken }) => {
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId'); 
      setUserToken(null); 
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'MyDrive') iconName = 'folder';
          else if (route.name === 'Starred') iconName = 'star';
          else if (route.name === 'Shared') iconName = 'folder-shared';
          else if (route.name === 'Trash') iconName = 'delete-outline';
          
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="MyDrive" options={{ title: 'My Drive' }}>
        {props => <MyDriveScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Starred" options={{ title: 'Starred' }}>
        {props => <StarredScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Shared" options={{ title: 'Shared' }}>
        {props => <SharedScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Trash" options={{ title: 'Trash' }}>
      {props => <TrashScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
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