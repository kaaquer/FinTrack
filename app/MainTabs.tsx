import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAuth, signOut } from "firebase/auth";

import Cashbook from "../Screens/Cashbook";
import Customers from "../Screens/Customers";
import Receipts from "../Screens/Receipts";
import Suppliers from "../Screens/Suppliers";
import Profile from "../Screens/Profile";
import Invoice from "@/Screens/Invoice";
import Transactions from "@/Screens/Transactions";
import Notifications from "@/Screens/Notifications";
import Reports from "../Screens/Report";
import Support from "@/Screens/Support";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "";
          switch (route.name) {
            case "Customers":
              iconName = focused ? "people" : "people-outline";
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
        tabBarActiveTintColor: "green",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Customers" component={Customers} />
      <Tab.Screen name="Suppliers" component={Suppliers} />
      <Tab.Screen name="Cashbook" component={Cashbook} />
      <Tab.Screen name="Receipts" component={Receipts} />
    </Tab.Navigator>
  );
};

import { DrawerContentComponentProps } from "@react-navigation/drawer";

type RootStackParamList = {
  Login: undefined; // Add Login to the navigation stack
  Home: undefined;
};

const CustomDrawerContent = (props: DrawerContentComponentProps) => {
  const navigation = useNavigation<import("@react-navigation/native").NavigationProp<RootStackParamList>>();
  const auth = getAuth();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }], // Navigate to Login screen
              });
            } catch (error) {
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button */}
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
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="Home"
        component={TabNavigator}
        options={{
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

export default MainTabs;
