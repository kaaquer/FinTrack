import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Define the navigation types
type RootStackParamList = {
  Home: undefined; // Ensure this matches the actual name in your navigator
  MainTabs: undefined;
};

type NotificationsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

type NotificationType = "payment" | "reminder" | "alert";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "payment",
    title: "Payment Received",
    message: "You received a payment of $1,500 from Tech Solutions Inc.",
    timestamp: "2024-03-20T10:30:00",
    read: false,
  },
  {
    id: "2",
    type: "reminder",
    title: "Invoice Due",
    message: "Invoice #INV-2024-002 is due in 3 days",
    timestamp: "2024-03-19T15:45:00",
    read: true,
  },
  {
    id: "3",
    type: "alert",
    title: "Low Balance Alert",
    message: "Your account balance is below $1,000",
    timestamp: "2024-03-19T09:15:00",
    read: false,
  },
];

const Notifications = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "payment":
        return "cash-outline";
      case "reminder":
        return "calendar-outline";
      case "alert":
        return "alert-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case "payment":
        return "#4CAF50";
      case "reminder":
        return "#2196F3";
      case "alert":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays > 1) return date.toLocaleDateString();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, read: true }))
    );
  };

  const handleNotificationPress = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item.id)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.type) + "20" },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate("Home")}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              When you receive notifications, they will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  markAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  markAllText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  message: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F46E5",
    position: "absolute",
    top: 16,
    right: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
