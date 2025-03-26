import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Define the navigation types
type RootStackParamList = {
  Home: undefined; // Ensure this matches the actual name in your navigator
  MainTabs: undefined;
};

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

const Notifications = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Home")}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.backText}>Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>
      {/* Add Notification Details Here */}
    </View>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 5,
    fontSize: 16,
    color: "black",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
