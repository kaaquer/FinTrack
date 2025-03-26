import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";


type RootStackParamList = {
  CustomersList: undefined;
  CustomerDetails: { id: string };
  AddCustomer: undefined;
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

  useEffect(() => {
    fetch("http://127.0.0.1:8080/api/customers") 
      .then((response) => response.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
        setLoading(false);
      });
  }, []);

  // Filter customers based on search query
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.includes(searchQuery) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const leads = customers.filter((c) => c.status === "Lead").length;
  const inactiveCustomers = totalCustomers - activeCustomers - leads;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Get a quick overview of your customer metrics.</Text>

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

        {/* Show Loading Spinner While Fetching Data */}
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.customerCard, { backgroundColor: "#E0FFFF" }]}
                onPress={() => navigation.navigate("CustomerDetails", { id: item.id })}
              >
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerContact}>{item.contact}</Text>
                <Text style={styles.customerAddress}>{item.address}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyMessage}>No customers found</Text>}
          />
        )}

        {/* View All Customers Button */}
        <TouchableOpacity style={[styles.viewCustomersButton, { backgroundColor: "#FF4500" }]} onPress={() => navigation.navigate("CustomersList")}>
          <Text style={styles.viewCustomersText}>View All Customers</Text>
        </TouchableOpacity>
      </View>

      {/* Floating "Add Customer" Button */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: "#32CD32" }]} onPress={() => navigation.navigate("AddCustomer")}>
        <Ionicons name="person-add" size={25} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  
  statCard: {
    width: "48%", // Two columns layout
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    backgroundColor: "white",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
    marginBottom: 10, // Space between rows
  },
  
  statTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  analyticsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  customerContact: {
    fontSize: 14,
    color: "#6B7280",
  },
  customerAddress: {
    fontSize: 14,
    color: "#6B7280",
  },
  emptyMessage: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 16,
  },
  viewCustomersButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  viewCustomersText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CustomersDashboard;
