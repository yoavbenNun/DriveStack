import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    const { username, password, name, email } = formData;

    // Basic validation
    if (!username || !password || !email || !name) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    setIsLoading(true);

    try {
      // Sending request to our Node.js server
      await api.post('/users', {
        username: username.trim(),
        password: password,
        name: name.trim(),
        email: email.trim().toLowerCase()
      });

      Alert.alert('Success', 'Account created successfully! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to register. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Join Drive Clone 📁</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData({...formData, name: text})}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => setFormData({...formData, username: text})}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => setFormData({...formData, password: text})}
        secureTextEntry
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Register" onPress={handleRegister} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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