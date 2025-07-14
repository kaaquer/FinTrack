import React, { useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { StackNavigationProp } from "@react-navigation/stack";
import { useAuth } from '../contexts/AuthContext';
import { showConfirmAlert, showErrorAlert } from '../utils/alertUtils';
import { DashboardRefreshProvider } from '../contexts/DashboardRefreshContext';

import CustomerStack from "./CustomerStack";
import Cashbook from "../Screens/Cashbook";
import Receipts from "../Screens/Receipts";
import Suppliers from "../Screens/Suppliers";
import Profile from "../Screens/Profile";
import Invoice from "@/Screens/Invoice";
import Transactions from "@/Screens/Transactions";
import Notifications from "@/Screens/Notifications";
import Reports from "../Screens/Report";
import Support from "@/Screens/Support";
import AddEditTransaction from '../Screens/AddEditTransaction';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const HeaderRight = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  
  return (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={styles.headerIcon}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color="#111827" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons name="person-circle-outline" size={24} color="#111827" />
      </TouchableOpacity>
    </View>
  );
};

const HeaderLeft = () => {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity
      style={styles.headerIcon}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <Ionicons name="menu-outline" size={24} color="#111827" />
    </TouchableOpacity>
  );
};

const HomeTabScreen = () => {
  return (
    <DashboardRefreshProvider>
      <CustomerStack />
    </DashboardRefreshProvider>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight />,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "";
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Suppliers":
              iconName = focused ? "storefront" : "storefront-outline";
              break;
            case "Cashbook":
              iconName = focused ? "wallet" : "wallet-outline";
              break;
            case "Receipts":
              iconName = focused ? "receipt" : "receipt-outline";
              break;
            default:
              iconName = "help-circle-outline";
          }
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeTabScreen}
        options={{
          title: "Home"
        }}
      />
      <Tab.Screen 
        name="Suppliers" 
        component={Suppliers}
        options={{
          title: "Suppliers"
        }}
      />
      <Tab.Screen 
        name="Cashbook" 
        component={Cashbook}
        options={{
          title: "Cashbook"
        }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={Receipts}
        options={{
          title: "Receipts"
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={Transactions}
        options={{
          title: "Transactions",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "swap-horizontal" : "swap-horizontal-outline"} size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

type DrawerParamList = {
  Login: undefined;
  MainTabs: undefined;
};

const CustomDrawerContent = (props: any) => {
  const navigation = useNavigation<StackNavigationProp<DrawerParamList>>();
  const { logout } = useAuth();

  const handleLogout = async () => {
    showConfirmAlert(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await logout();
          // Using replace instead of reset to avoid any navigation stack issues
          navigation.replace('Login');
        } catch (error) {
          showErrorAlert("Error", "Failed to log out. Please try again.");
        }
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          padding: 15,
          borderTopWidth: 1,
          borderTopColor: "#ccc",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="red" />
        <Text style={{ fontSize: 16, marginLeft: 10, color: "red" }}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerRight: () => <HeaderRight />,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={TabNavigator}
        options={{
          headerShown: false,
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={Profile}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={Notifications}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Reports & Insights"
        component={Reports}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Transactions History"
        component={Transactions}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Invoices & Bills"
        component={Invoice}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Help & Support"
        component={Support}
        options={{
          drawerIcon: ({ color, size }) => <Ionicons name="help-circle-outline" size={size} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
  },
});

export default MainTabs;
