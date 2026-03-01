import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
  if (!username || !password) {
    Alert.alert('Error', 'Please enter both username and password');
    return;
  }

  setIsLoading(true);

  try {
    const response = await api.post('/tokens', {
      username: username.trim(),
      password,
    });

    console.log("LOGIN RES:", response.data);

    const token =
      response.data.token ||
      response.data.jwt ||
      response.data.accessToken;

    if (!token) {
      Alert.alert("Login Failed", "Server did not return a token");
      return;
    }

    await AsyncStorage.setItem('userToken', token);
    console.log("Token saved successfully:", token);

    navigation.replace('Home');
  } catch (error) {
    console.error(
      'Login error:',
      error?.response?.status,
      error?.response?.data || error?.message
    );

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Something went wrong. Please try again.';

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