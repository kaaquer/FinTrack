import React, { useEffect, useState, useCallback } from "react";
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
import { apiService, Customer as ApiCustomer } from "../services/api";

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
  Suppliers: undefined;
  Cashbook: undefined;
  Receipts: undefined;
};

// Frontend Customer interface (compatible with API)
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
  color: string;
  bgColor: string;
}

interface QuickActionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  bgColor: string;
}

interface RecentActivityProps {
  type: 'customer' | 'transaction' | 'invoice';
  title: string;
  subtitle: string;
  amount?: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Helper function to convert API customer to frontend customer
const convertApiCustomerToCustomer = (apiCustomer: ApiCustomer): Customer => {
  return {
    id: apiCustomer.customer_id.toString(),
    name: apiCustomer.customer_name,
    contact: apiCustomer.email || apiCustomer.phone || 'No contact',
    address: [apiCustomer.address, apiCustomer.city, apiCustomer.state, apiCustomer.country]
      .filter(Boolean)
      .join(', ') || 'No address',
    status: apiCustomer.status === 'active' ? 'Active' : 
            apiCustomer.status === 'lead' ? 'Lead' : 'Inactive',
    totalSpent: apiCustomer.current_balance || 0,
  };
};

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

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendValue, color, bgColor }) => {
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
      <LinearGradient
        colors={[bgColor, `${bgColor}80`]}
        style={styles.metricGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#dcfce7' : '#fee2e2' }]}>
            <Ionicons 
              name={trend >= 0 ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={trend >= 0 ? '#16a34a' : '#dc2626'} 
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? '#16a34a' : '#dc2626' }]}>
              {Math.abs(trendValue)}%
            </Text>
          </View>
        </View>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress, color, bgColor }) => (
  <TouchableOpacity 
    style={styles.quickActionButton} 
    onPress={onPress}
  >
    <LinearGradient
      colors={[bgColor, `${bgColor}80`]}
      style={styles.quickActionGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const RecentActivity: React.FC<RecentActivityProps> = ({ type, title, subtitle, amount, time, icon, color }) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    {amount && (
      <Text style={[styles.activityAmount, { color }]}>{amount}</Text>
    )}
  </View>
);

const CustomersList = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async (isRefresh = false) => {
      try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.getCustomers({
        page: 1,
        limit: 50,
        search: searchQuery || undefined,
      });

      const convertedCustomers = response.data.map(convertApiCustomerToCustomer);
      setCustomers(convertedCustomers);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || "Failed to load customers. Please try again later.");
    } finally {
        setLoading(false);
      setRefreshing(false);
      }
    }, [searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchQuery !== "") {
        fetchCustomers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleRefresh = () => {
    fetchCustomers(true);
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const leads = customers.filter((c) => c.status === "Lead").length;
  const inactiveCustomers = customers.filter((c) => c.status === "Inactive").length;

  // Mock data for demonstration
  const recentActivities = [
    {
      type: 'customer' as const,
      title: 'New Customer Added',
      subtitle: 'John Doe - Individual',
      time: '2 hours ago',
      icon: 'person-add' as keyof typeof Ionicons.glyphMap,
      color: '#2563EB'
    },
    {
      type: 'transaction' as const,
      title: 'Payment Received',
      subtitle: 'Invoice #INV-001',
      amount: '$1,250.00',
      time: '4 hours ago',
      icon: 'cash' as keyof typeof Ionicons.glyphMap,
      color: '#059669'
    },
    {
      type: 'invoice' as const,
      title: 'Invoice Sent',
      subtitle: 'ABC Company',
      amount: '$850.00',
      time: '6 hours ago',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#7C3AED'
    }
  ];

  // Header component for FlatList
  const ListHeaderComponent = () => (
    <View>
      {/* Welcome Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.welcomeHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.welcomeContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.businessName}>FinTrack Business</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</Text>
          </View>
          <View style={styles.welcomeIcon}>
            <Ionicons name="business" size={32} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

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

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="Total Revenue"
          value="$52,450"
          icon="cash"
          trend={12}
          trendValue={8}
          color="#059669"
          bgColor="#dcfce7"
        />
        <MetricCard
          title="Active Customers"
          value={activeCustomers.toString()}
          icon="people"
          trend={5}
          trendValue={3}
          color="#2563EB"
          bgColor="#dbeafe"
        />
        <MetricCard
          title="Pending Invoices"
          value="7"
          icon="document-text"
          trend={-2}
          trendValue={1}
          color="#dc2626"
          bgColor="#fee2e2"
        />
        <MetricCard
          title="Monthly Growth"
          value="+15%"
          icon="trending-up"
          trend={15}
          trendValue={15}
          color="#7C3AED"
          bgColor="#ede9fe"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Add Customer"
            icon="person-add"
            onPress={() => navigation.navigate('AddCustomer')}
            color="#2563EB"
            bgColor="#dbeafe"
          />
          <QuickAction
            title="New Invoice"
            icon="document-text"
            onPress={() => navigation.navigate('Invoice')}
            color="#7C3AED"
            bgColor="#ede9fe"
          />
          <QuickAction
            title="Add Transaction"
            icon="cash"
            onPress={() => navigation.navigate('Transactions')}
            color="#059669"
            bgColor="#dcfce7"
          />
          <QuickAction
            title="View Reports"
            icon="bar-chart"
            onPress={() => navigation.navigate('Reports')}
            color="#f97316"
            bgColor="#fed7aa"
          />
        </View>
      </View>

      {/* Financial Overview Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        {Platform.OS === 'web' ? (
          <BarChart
            data={monthlyData}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            style={styles.chart}
            verticalLabelRotation={30}
            yAxisSuffix=""
          />
        ) : (
          <LineChart
            data={monthlyData}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="$"
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            yAxisSuffix=""
          />
        )}
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentActivities.map((activity, index) => (
          <RecentActivity key={index} {...activity} />
        ))}
      </View>

      {/* Customer Overview */}
      <View style={styles.customerOverviewContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CustomersList')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customerStats}>
          <View style={styles.customerStatCard}>
            <View style={[styles.customerStatIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="people" size={24} color="#059669" />
            </View>
            <View style={styles.customerStatContent}>
              <Text style={styles.customerStatValue}>{totalCustomers}</Text>
              <Text style={styles.customerStatLabel}>Total Customers</Text>
            </View>
          </View>
          <View style={styles.customerStatCard}>
            <View style={[styles.customerStatIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
            </View>
            <View style={styles.customerStatContent}>
              <Text style={styles.customerStatValue}>{activeCustomers}</Text>
              <Text style={styles.customerStatLabel}>Active</Text>
            </View>
          </View>
          <View style={styles.customerStatCard}>
            <View style={[styles.customerStatIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="bulb" size={24} color="#d97706" />
            </View>
            <View style={styles.customerStatContent}>
              <Text style={styles.customerStatValue}>{leads}</Text>
              <Text style={styles.customerStatLabel}>Leads</Text>
            </View>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : customers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No customers added yet.</Text>
            <TouchableOpacity style={styles.addCustomerButton} onPress={() => navigation.navigate('AddCustomer')}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addCustomerButtonText}>Add New Customer</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderCustomer = ({ item: customer }: { item: Customer }) => (
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
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.customerListContainer}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  welcomeHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
    borderRadius: 0,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  welcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    marginLeft: 8,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1F2937",
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  metricCard: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricGradient: {
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: "center",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activitiesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "500",
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerOverviewContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customerStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  customerStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customerStatContent: {
    flex: 1,
  },
  customerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  customerStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  customerListContainer: {
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  customerContact: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 20,
  },
  addCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addCustomerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CustomersList;