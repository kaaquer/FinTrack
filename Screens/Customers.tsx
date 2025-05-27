import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart, LineChart } from "react-native-chart-kit";

const API_ENDPOINTS = {
  customers: '/api/customers', // This will be replaced with actual API endpoint
};

type RootStackParamList = {
  CustomersList: undefined;
  CustomerDetails: { id: string };
  AddCustomer: undefined;
  Reports: undefined;
  Invoice: undefined;
  Transactions: undefined;
};

interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  status: "Active" | "Lead" | "Inactive";
  lastTransaction?: string;
  totalSpent?: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  trend: number;
  trendValue: number;
}

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
}

// Mock data with proper types
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Smith",
    contact: "john.smith@email.com",
    address: "123 Main St, City, State",
    status: "Active",
    lastTransaction: "2024-05-20",
    totalSpent: 12500
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
    status: "Active",
    lastTransaction: "2024-05-18",
    totalSpent: 8900
  }
];

const screenWidth = Dimensions.get('window').width;

const monthlyData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [{
    data: [30000, 45000, 38000, 55000, 52000, 59000],
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2
  }]
};

const chartConfig = {
  backgroundGradientFrom: "#FFFFFF",
  backgroundGradientTo: "#FFFFFF",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

const BusinessMetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendValue }) => {
  const animatedValue = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 20,
      friction: 2,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.metricCard,
        {
          transform: [
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
          opacity: animatedValue,
        },
      ]}
    >
      <View style={styles.metricIconContainer}>
        <View style={[styles.metricIcon, { backgroundColor: `${trend >= 0 ? '#dcfce7' : '#fee2e2'}` }]}>
          <Ionicons name={icon} size={24} color={trend >= 0 ? '#16a34a' : '#dc2626'} />
        </View>
        <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#dcfce7' : '#fee2e2' }]}>
          <Ionicons 
            name={trend >= 0 ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={trend >= 0 ? '#16a34a' : '#dc2626'} 
          />
          <Text style={[styles.trendText, { color: trend >= 0 ? '#16a34a' : '#dc2626' }]}>
            {Math.abs(trendValue)}%
          </Text>
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </Animated.View>
  );
};

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress, color }) => (
  <TouchableOpacity 
    style={[styles.quickActionButton, { backgroundColor: `${color}10` }]} 
    onPress={onPress}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#FFFFFF" />
    </View>
    <Text style={[styles.quickActionText, { color }]}>{title}</Text>
  </TouchableOpacity>
);

const CustomersDashboard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data
        setCustomers(mockCustomers);
        setLoading(false);
      } catch (err) {
        setError("Failed to load customers. Please try again later.");
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const leads = customers.filter((c) => c.status === "Lead").length;
  const inactiveCustomers = customers.filter((c) => c.status === "Inactive").length;

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

  const metrics: MetricCardProps[] = [
    { 
      title: "Total Customers",
      value: "1,234",
      icon: "people",
      trend: 12,
      trendValue: 12
    },
    {
      title: "Active Deals",
      value: "23",
      icon: "trending-up",
      trend: 8,
      trendValue: 8
    },
    {
      title: "Monthly Revenue",
      value: "$52,000",
      icon: "cash",
      trend: 15,
      trendValue: 15
    },
    {
      title: "Pending Invoices",
      value: "7",
      icon: "document-text",
      trend: -3,
      trendValue: 3
    }
  ];

  const quickActions: QuickActionProps[] = [
    {
      title: "Add Customer",
      icon: "person-add",
      color: "#2563EB",
      onPress: () => navigation.navigate("AddCustomer")
    },
    {
      title: "New Invoice",
      icon: "receipt",
      color: "#7C3AED",
      onPress: () => navigation.navigate("Invoice")
    },
    {
      title: "Add Transaction",
      icon: "cash",
      color: "#059669",
      onPress: () => navigation.navigate("Transactions")
    },
    {
      title: "View Reports",
      icon: "bar-chart",
      color: "#EA580C",
      onPress: () => navigation.navigate("Reports")
    }
  ];
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.businessName}>FinTrack Business</Text>
            </View>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
              <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Business Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <BusinessMetricCard key={index} {...metric} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Overview</Text>
          <View style={styles.chartCard}>
            <LineChart
              data={monthlyData}
              width={Dimensions.get('window').width - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Recent Customers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Customers</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("CustomersList")}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
          {mockCustomers.slice(0, 3).map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              onPress={() => navigation.navigate("CustomerDetails", { id: customer.id })}
            >
              <View style={styles.customerInfo}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.avatarText}>
                    {customer.name.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerContact}>{customer.contact}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: customer.status === "Active" ? "#DCFCE7" : "#FEF3C7" }]}>
                <Text style={[styles.statusText, { color: customer.status === "Active" ? "#16A34A" : "#D97706" }]}>
                  {customer.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1e293b',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  quickActionIcon: {
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    color: '#64748b',
  },
  analyticsCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  analyticsText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  metricsContainer: {
    padding: 16,
    marginTop: -30,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    padding: 8,
    borderRadius: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    color: '#64748b',
  },
  customersListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    marginLeft: 16,
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563eb',
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
export default CustomersDashboard;