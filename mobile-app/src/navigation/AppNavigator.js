import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen'; 
import HomeScreen from '../screens/HomeScreen';
import MyDriveScreen from "../screens/MyDriveScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Create Account' }} 
      />
      <Stack.Screen 
        name="Home" 
        component={MyDriveScreen} 
        options={{ title: 'My Drive' }} 
      />
      <Stack.Screen 
        name="MyDrive" 
        component={MyDriveScreen} 
        options={{ title: 'My Drive' }} 
      />
    </Stack.Navigator>
  );
}