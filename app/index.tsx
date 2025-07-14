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
import AddEditSupplier from '../Screens/AddEditSupplier';
import SupplierDetails from '../Screens/SupplierDetails';
import AddEditTransaction from '../Screens/AddEditTransaction';

type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  CustomersList: undefined;
  CustomerDetails: { id: string };
  AddSupplier: undefined;
  EditSupplier: { supplier: any };
  SupplierDetails: { id: number };
  AddTransaction: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  if (typeof window !== 'undefined') {
    require('../assets/global.css');
  }
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
      <Stack.Screen name="AddSupplier" component={AddEditSupplier} />
      <Stack.Screen name="EditSupplier" component={AddEditSupplier} />
      <Stack.Screen name="SupplierDetails" component={SupplierDetails} />
      <Stack.Screen name="AddTransaction" component={AddEditTransaction} />
    </Stack.Navigator>
      <CustomAlert />
    </AuthProvider>
  );
};

export default App;