import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, ActivityIndicator, Alert, Platform, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

type RootStackParamList = {
  CustomersList: undefined;
  CustomerDetails: { id: string };
  AddCustomer: undefined;
};

// Mock data for development
const mockCustomers = [
  {
    id: "1",
    name: "John Smith",
    contact: "john.smith@email.com",
    address: "123 Main St, City, State",
    status: "Active"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    contact: "sarah.j@email.com",
    address: "456 Oak Ave, City, State",
    status: "Lead"
  },
  {
    id: "3",
    name: "Michael Brown",
    contact: "m.brown@email.com",
    address: "789 Pine Rd, City, State",
    status: "Active"
  },
  {
    id: "4",
    name: "Emily Davis",
    contact: "emily.d@email.com",
    address: "101 Elm St, City, State",
    status: "Active"
  },
  {
    id: "5",
    name: "Robert Wilson",
    contact: "r.wilson@email.com",
    address: "202 Maple Ave, City, State",
    status: "Lead"
  },
  {
    id: "6",
    name: "Lisa Anderson",
    contact: "lisa.a@email.com",
    address: "303 Cedar Rd, City, State",
    status: "Active"
  }
];

// API Configuration
const API_BASE_URL = Platform.select({
  web: 'http://localhost:8080',  // For web development
  default: 'http://127.0.0.1:8080'  // For mobile development
});

const API_ENDPOINTS = {
  customers: `${API_BASE_URL}/api/customers`
};

const CustomersDashboard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  type Customer = {
    id: string;
    name: string;
    contact: string;
    address: string;
    status: string;
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.customers, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setCustomers(data);
        setError(null);
      } catch (err) {
        console.warn("Using mock data due to:", err);
        // Fallback to mock data
        setCustomers(mockCustomers);
        setError(
          Platform.OS === 'web' 
            ? "Using mock data - Backend not available. Make sure your backend server is running at http://localhost:8080"
            : "Using mock data - Backend not available. Make sure your backend server is running at http://127.0.0.1:8080"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const leads = customers.filter((c) => c.status === "Lead").length;
  const inactiveCustomers = totalCustomers - activeCustomers - leads;

  // Header component for FlatList
  const ListHeaderComponent = () => (
    <View>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Get a quick overview of your customer metrics.</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />
      </View>

      {/* Customer Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: "#FFDDC1" }]}> 
          <Text style={styles.statTitle}>Total Customers</Text>
          <Text style={styles.statValue}>{totalCustomers}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#CFFAFE" }]}> 
          <Text style={styles.statTitle}>Active Customers</Text>
          <Text style={styles.statValue}>{activeCustomers}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#D8BFD8" }]}> 
          <Text style={styles.statTitle}>Leads</Text>
          <Text style={styles.statValue}>{leads}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#FFC0CB" }]}> 
          <Text style={styles.statTitle}>Inactive</Text>
          <Text style={styles.statValue}>{inactiveCustomers}</Text>
        </View>
      </View>

      {/* Advanced Analytics Placeholder */}
      <View style={[styles.analyticsCard, { backgroundColor: "#E6E6FA" }]}> 
        <Ionicons name="bar-chart" size={24} color="gray" />
        <Text style={styles.analyticsTitle}>Advanced Analytics Coming Soon</Text>
        <Text style={styles.analyticsText}>
          In future updates, detailed customer analytics and reports will be available here.
        </Text>
      </View>

      <Text style={styles.customersListTitle}>Recent Customers</Text>
    </View>
  );

  // Footer component for FlatList
  const ListFooterComponent = () => (
    <View style={styles.footerContainer}>
      {/* View All Customers Button */}
      <TouchableOpacity 
        style={[styles.viewCustomersButton, { backgroundColor: "#FF4500" }]} 
        onPress={() => navigation.navigate("CustomersList")}
      >
        <Text style={styles.viewCustomersText}>View All Customers</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : (
          <FlatList
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            data={filteredCustomers}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.customerCard, { backgroundColor: "#E0FFFF" }]}
                onPress={() => navigation.navigate("CustomerDetails", { id: item.id })}
              >
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerContact}>{item.contact}</Text>
                <Text style={styles.customerAddress}>{item.address}</Text>
                <View style={[styles.statusBadge, item.status === 'Active' ? styles.activeBadge : styles.leadBadge]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyMessage}>No customers found</Text>
              </View>
            }
            showsVerticalScrollIndicator={true}
          />
        )}

        {/* Floating "Add Customer" Button */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: "#32CD32" }]} 
          onPress={() => navigation.navigate("AddCustomer")}
        >
          <Ionicons name="person-add" size={25} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for floating button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#111827",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    color: "#111827",
  },
  analyticsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  customersListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: "#DCFCE7",
  },
  leadBadge: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
  },
  footerContainer: {
    marginTop: 16,
  },
  viewCustomersButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewCustomersText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFE4E6",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    marginLeft: 8,
    flex: 1,
  },
});

export default CustomersDashboard;