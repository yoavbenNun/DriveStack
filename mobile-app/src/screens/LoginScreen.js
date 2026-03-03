import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { MaterialIcons } from '@expo/vector-icons'; 

export default function LoginScreen({ navigation, setUserToken }) {
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
      
      try {
        let extractedId = response.data.userId || response.data.user?._id || response.data.user?.id;

        if (!extractedId) {
          const decoded = jwtDecode(token);
          extractedId = decoded.userId || decoded._id || decoded.id; 
        }

        if (extractedId) {
          await AsyncStorage.setItem('userId', String(extractedId));
          console.log("User ID saved successfully:", extractedId);
        } else {
          console.warn("Could not find User ID in response or token");
        }
      } catch (decodeErr) {
        console.error("Error extracting user ID:", decodeErr);
      }
        
      setUserToken(token);

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialIcons name="cloud-done" size={64} color="#1a73e8" />
          <Text style={styles.title}>Drive Clone</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person-outline" size={20} color="#5f6368" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#5f6368"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#5f6368" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#5f6368"
              value={password}
              onChangeText={setPassword}
              secureTextEntry 
            />
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a73e8" />
            </View>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1f1f1f',
  },
  loginButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#5f6368',
    fontSize: 15,
  },
  registerLink: {
    color: '#1a73e8',
    fontSize: 15,
    fontWeight: '600',
  },
});