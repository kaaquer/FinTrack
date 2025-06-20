import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CustomersDashboard from '../components/CustomersDashboard';
import CustomersList from '../Screens/CustomersList';
import CustomerDetails from '../Screens/CustomerDetails';
import AddEditCustomer from '../Screens/AddEditCustomer';

const Stack = createStackNavigator();

const CustomerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CustomersDashboard" 
        component={CustomersDashboard}
        options={{
          title: 'Customers'
        }}
      />
      <Stack.Screen 
        name="CustomersList" 
        component={CustomersList}
        options={{
          title: 'All Customers'
        }}
      />
      <Stack.Screen 
        name="CustomerDetails" 
        component={CustomerDetails}
        options={{
          title: 'Customer Details'
        }}
      />
      <Stack.Screen 
        name="AddCustomer" 
        component={AddEditCustomer}
        options={{
          title: 'Add Customer'
        }}
      />
      <Stack.Screen 
        name="EditCustomer" 
        component={AddEditCustomer}
        options={{
          title: 'Edit Customer'
        }}
      />
    </Stack.Navigator>
  );
};

export default CustomerStack; 