import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService, Customer as ApiCustomer } from '../services/api';
import { CustomerStackParamList } from '../types/navigation';
import { showConfirmAlert, showSuccessAlert, showErrorAlert, showAlert } from '../utils/alertUtils';
import { useDashboardRefresh } from '../contexts/DashboardRefreshContext';

type CustomerDetailsRouteProp = RouteProp<CustomerStackParamList, 'CustomerDetails'>;
type CustomerDetailsNavigationProp = StackNavigationProp<CustomerStackParamList, 'CustomerDetails'>;

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_type: 'individual' | 'business';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  transaction_id: number;
  transaction_number: string;
  transaction_date: string;
  description?: string;
  total_amount: number;
  transaction_type: string;
  status: string;
}

const CustomerDetails = () => {
  const navigation = useNavigation<CustomerDetailsNavigationProp>();
  const route = useRoute<CustomerDetailsRouteProp>();
  const { id } = route.params;
  const { refreshDashboard } = useDashboardRefresh();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customerData, transactionsData] = await Promise.all([
        apiService.getCustomer(parseInt(id)),
        apiService.getTransactions({ customerId: parseInt(id), limit: 10 })
      ]);

      console.log('Customer data received:', customerData); // Debug log
      setCustomer(customerData.customer);
      setTransactions(transactionsData.data || []);
    } catch (err: any) {
      console.error('Error fetching customer details:', err);
      setError(err.response?.data?.error || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (customer) {
      navigation.navigate('EditCustomer', { customer });
    }
  };

  const handleDelete = () => {
    if (!customer) return;

    showConfirmAlert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.customer_name}? This action cannot be undone.`,
      deleteCustomer
    );
  };

  const deleteCustomer = async () => {
    try {
      await apiService.deleteCustomer(customer!.customer_id);
      
      // Navigate back to customers list with a parameter indicating successful deletion
      navigation.navigate('CustomersList', { deletedCustomerId: customer!.customer_id });
      
    } catch (err: any) {
      console.error('Delete failed:', err);
      showErrorAlert('Error', err.response?.data?.error || 'Failed to delete customer');
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleEmail = () => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  };

  const handleAddTransaction = () => {
    // TODO: Create AddTransaction screen
    showAlert({
      title: 'Coming Soon',
      message: 'Add Transaction functionality will be available soon!',
      buttons: [{ text: 'OK' }]
    });
    // navigation.navigate('AddTransaction', { customerId: id });
  };

  const handleAddInvoice = () => {
    // TODO: Create AddInvoice screen
    showAlert({
      title: 'Coming Soon',
      message: 'Add Invoice functionality will be available soon!',
      buttons: [{ text: 'OK' }]
    });
    // navigation.navigate('AddInvoice', { customerId: id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#DCFCE7', text: '#16A34A' };
      case 'inactive': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'lead': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading customer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Error Loading Customer</Text>
          <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCustomerDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(customer.status);

  console.log('Rendering CustomerDetails for:', customer?.customer_name);
  console.log('Customer Type:', customer?.customer_type);
  console.log('Customer Status:', customer?.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Ionicons name="pencil" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>
                {(customer.customer_name && customer.customer_name.charAt(0).toUpperCase()) || '?'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer.customer_name || 'Unknown Customer'}</Text>
              <Text style={styles.customerType}>
                {(customer.customer_type && customer.customer_type.charAt(0).toUpperCase() + customer.customer_type.slice(1)) || 'Unknown Type'}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {(customer.status && customer.status.charAt(0).toUpperCase() + customer.status.slice(1)) || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {customer.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call" size={20} color="#2563EB" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}
            {customer.email && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                <Ionicons name="mail" size={20} color="#2563EB" />
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleAddTransaction}>
              <Ionicons name="add-circle" size={20} color="#059669" />
              <Text style={styles.actionText}>Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleAddInvoice}>
              <Ionicons name="document-text" size={20} color="#7C3AED" />
              <Text style={styles.actionText}>Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Current Balance</Text>
              <Text style={[
                styles.financialValue,
                { color: (customer.current_balance || 0) < 0 ? '#DC2626' : '#16A34A' }
              ]}>
                {formatCurrency(customer.current_balance || 0)}
              </Text>
            </View>
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Credit Limit</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(customer.credit_limit || 0)}
              </Text>
            </View>
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Available Credit</Text>
              <Text style={styles.financialValue}>
                {formatCurrency((customer.credit_limit || 0) - (customer.current_balance || 0))}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoGrid}>
            {customer.email && (
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{customer.email}</Text>
              </View>
            )}
            {customer.phone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Information */}
        {customer.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <View style={styles.addressText}>
                <Text style={styles.addressLine}>{customer.address}</Text>
                {customer.city && <Text style={styles.addressLine}>{customer.city}</Text>}
                {customer.state && <Text style={styles.addressLine}>{customer.state}</Text>}
                {customer.country && <Text style={styles.addressLine}>{customer.country}</Text>}
                {customer.postal_code && <Text style={styles.addressLine}>{customer.postal_code}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Additional Information */}
        {(customer.tax_id || customer.notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {customer.tax_id && (
              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>Tax ID: {customer.tax_id}</Text>
              </View>
            )}
            {customer.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{customer.notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions && transactions.length > 0 ? (
            transactions.map((transaction) => (
              <View key={transaction.transaction_id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionNumber}>
                    #{transaction.transaction_number}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.transaction_date)}
                  </Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'No description'}
                  </Text>
                  <Text style={styles.transactionType}>
                    {transaction.transaction_type}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: (transaction.total_amount || 0) < 0 ? '#DC2626' : '#16A34A' }
                ]}>
                  {formatCurrency(transaction.total_amount || 0)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete Customer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    marginLeft: 8,
  },
  addressLine: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionDetails: {
    flex: 2,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#374151',
  },
  transactionType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CustomerDetails; 