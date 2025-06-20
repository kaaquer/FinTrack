import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MainTabs: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

type SettingOption = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

type MenuItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

const Profile = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);

  const handleLogout = async () => {
    // If you need logout, use useAuth from '../contexts/AuthContext' and call logout().
  };

  const settingsOptions: SettingOption[] = [
    {
      title: "Push Notifications",
      icon: "notifications-outline",
      value: notificationsEnabled,
      onValueChange: setNotificationsEnabled,
    },
    {
      title: "Dark Mode",
      icon: "moon-outline",
      value: darkMode,
      onValueChange: setDarkMode,
    },
    {
      title: "Biometric Login",
      icon: "finger-print-outline",
      value: biometricLogin,
      onValueChange: setBiometricLogin,
    },
  ];

  const menuItems: MenuItem[] = [
    {
      title: "Personal Information",
      icon: "person-outline",
      onPress: () => console.log("Navigate to Personal Info"),
    },
    {
      title: "Security",
      icon: "shield-outline",
      onPress: () => console.log("Navigate to Security"),
    },
    {
      title: "Payment Methods",
      icon: "card-outline",
      onPress: () => console.log("Navigate to Payment Methods"),
    },
    {
      title: "Notification Preferences",
      icon: "notifications-outline",
      onPress: () => console.log("Navigate to Notifications"),
    },
    {
      title: "Privacy Policy",
      icon: "lock-closed-outline",
      onPress: () => console.log("Navigate to Privacy Policy"),
    },
    {
      title: "Terms of Service",
      icon: "document-text-outline",
      onPress: () => console.log("Navigate to Terms"),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {/* Replace with actual user email or placeholder */}
            U
          </Text>
        </View>
        <Text style={styles.userName}>User</Text>
        <Text style={styles.userRole}>Business Owner</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {settingsOptions.map((option, index) => (
          <View key={index} style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name={option.icon} size={24} color="#4F46E5" />
              <Text style={styles.settingText}>{option.title}</Text>
            </View>
            <Switch
              value={option.value}
              onValueChange={option.onValueChange}
              trackColor={{ false: "#D1D5DB", true: "#818CF8" }}
              thumbColor={option.value ? "#4F46E5" : "#F3F4F6"}
            />
          </View>
        ))}
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={24} color="#4F46E5" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginVertical: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    color: "#6B7280",
  },
});

export default Profile;
