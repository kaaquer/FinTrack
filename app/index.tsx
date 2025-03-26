import React from 'react';
import "react-native-gesture-handler";
import "react-native-reanimated";

//import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
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
};

const Stack = createStackNavigator<RootStackParamList>();

//const Stack = createStackNavigator();

const App = () => {
  return (
    
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />  
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="AddCustomer" component={AddCustomer} options={{ headerTitle: 'Add Customer' }} />
        <Stack.Screen name="AddSupplier" component={AddSupplier} options={{ headerTitle: 'Add Supplier' }} />
      </Stack.Navigator>
    
  );
};
export default App;