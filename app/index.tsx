import React from 'react';
import "react-native-gesture-handler";
import "react-native-reanimated";
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from '../contexts/AuthContext';
import LoginScreen from '../Screens/LoginScreen';
import SignUpScreen from '../Screens/SignUp';
import MainTabs from '../app/MainTabs';
import ForgotPasswordScreen from '@/Screens/ForgotPassword';
import CustomAlert from '../components/CustomAlert';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  CustomersList: undefined;
  CustomerDetails: { id: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <AuthProvider>
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />  
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
      <CustomAlert />
    </AuthProvider>
  );
};

export default App;