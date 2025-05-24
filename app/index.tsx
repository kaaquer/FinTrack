import React from 'react';
import "react-native-gesture-handler";
import "react-native-reanimated";
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../Screens/LoginScreen';
import SignUpScreen from '../Screens/SignUp';
import MainTabs from '../app/MainTabs';
import AddCustomer from '../Screens/AddCustomer';
import AddSupplier from '../Screens/AddSupplier';
import ForgotPasswordScreen from '@/Screens/ForgotPassword';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  AddCustomer: undefined;
  AddSupplier: undefined;
  CustomersList: undefined;
  CustomerDetails: { id: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
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
      <Stack.Screen 
        name="AddCustomer" 
        component={AddCustomer} 
        options={{ 
          headerShown: true,
          headerTitle: 'Add Customer',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
          },
        }} 
      />
      <Stack.Screen 
        name="AddSupplier" 
        component={AddSupplier} 
        options={{ 
          headerShown: true,
          headerTitle: 'Add Supplier',
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
          },
        }} 
      />
    </Stack.Navigator>
  );
};

export default App;