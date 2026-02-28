import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validation: Check if fields are empty
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Sending POST request to our Node.js server login endpoint
      const response = await api.post('/login', {
        username: username.trim(),
        password: password
      });

      // Extracting the JWT token from the server response
      const { token } = response.data;

      // Persisting the token in the device's local storage
      await AsyncStorage.setItem('userToken', token);
      console.log("Token saved successfully:", token);

      // Navigate to Home screen and reset the stack so the user cannot go back to Login
      navigation.replace('Home');

    } catch (error) {
      console.error('Login error:', error);
      // Retrieve error message from server response or use a default one
      const errorMessage = error.response?.data?.error || 'Something went wrong. Please try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drive Clone 🚀</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Hides password characters
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      {/* Navigation to Register screen - we will implement this next */}
      <View style={{ marginTop: 20 }}>
        <Button 
          title="Don't have an account? Register here" 
          color="gray"
          onPress={() => navigation.navigate('Register')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
});