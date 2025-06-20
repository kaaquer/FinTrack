import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext instead of Firebase

// Define navigation types
type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth(); // Use AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      Alert.alert('Success', 'Login successful!');
      navigation.replace('MainTabs'); // Navigate to the main screen after login
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Invalid email or password. Please try again.');
      console.error('Login Error:', error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FinTrack</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
      />

      {/* Login Button */}
      <TouchableOpacity 
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      {/* Sign Up Button */}
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} disabled={isLoading}>
        <Text style={[styles.signUpText, isLoading && styles.textDisabled]}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={isLoading}>
        <Text style={[styles.forgotPassword, isLoading && styles.textDisabled]}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#818CF8', // lighter shade when disabled
    opacity: 0.7,
  },
  loginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpText: {
    color: '#4F46E5',
    fontSize: 16,
    marginTop: 10,
  },
  forgotPassword: {
    color: '#4F46E5',
    fontSize: 14,
    marginTop: 10,
  },
  textDisabled: {
    opacity: 0.5,
  },
});
