import React, { useEffect, useState } from 'react';
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
import { apiService, Supplier } from '../services/api';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

type SupplierDetailsRouteProp = RouteProp<any, 'SupplierDetails'>;

interface Transaction {
  transaction_id: number;
  transaction_date: string;
  description?: string;
  total_amount: number;
  transaction_type: string;
  status: string;
}

interface Receipt {
  receipt_id: number;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method: string;
  description?: string;
}

const SupplierDetails = () => {
  const navigation = useNavigation();
  const route = useRoute<SupplierDetailsRouteProp>();
  const { id } = route.params || {};
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getSupplier(id);
        setSupplier(data);
        setTransactions([]); // Optionally fetch transactions separately if needed
        setReceipts([]); // Optionally fetch receipts separately if needed
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load supplier');
        showErrorAlert('Error', err?.response?.data?.error || 'Failed to load supplier');
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const handleEdit = () => {
    if (supplier) {
      (navigation as any).navigate('EditSupplier', { supplier });
    }
  };

  const handleDelete = () => {
    if (!supplier) return;
    showConfirmAlert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.supplier_name}? This action cannot be undone.`,
      deleteSupplier
    );
  };

  const deleteSupplier = async () => {
    try {
      await apiService.deleteSupplier(supplier!.supplier_id);
      await showSuccessAlert('Success', 'Supplier deleted successfully');
      navigation.goBack();
    } catch (err: any) {
      showErrorAlert('Error', err.response?.data?.error || 'Failed to delete supplier');
    }
  };

  const handleCall = () => {
    if (supplier?.phone) {
      Linking.openURL(`tel:${supplier.phone}`);
    }
  };

  const handleEmail = () => {
    if (supplier?.email) {
      Linking.openURL(`mailto:${supplier.email}`);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? { bg: '#DCFCE7', text: '#16A34A' }
      : { bg: '#FEE2E2', text: '#DC2626' };
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
          <Text style={styles.loadingText}>Loading supplier details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !supplier) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#DC2626" />
          <Text style={styles.errorTitle}>Error Loading Supplier</Text>
          <Text style={styles.errorText}>{error || 'Supplier not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColors = getStatusColor(supplier.is_active);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Details</Text>
        <TouchableOpacity onPress={handleEdit}>
          <Ionicons name="pencil" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Supplier Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(supplier.supplier_name && supplier.supplier_name.charAt(0).toUpperCase()) || '?'}
                </Text>
              </View>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.nameText}>{supplier.supplier_name || 'Unknown Supplier'}</Text>
              {supplier.contact_person && (
                <Text style={styles.contactPersonText}>{supplier.contact_person}</Text>
              )}
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}> 
                <Text style={[styles.statusText, { color: statusColors.text }]}> 
                  {supplier.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.quickActions}>
            {supplier.phone && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Ionicons name="call" size={22} color="#2563EB" />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
            )}
            {supplier.email && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                <Ionicons name="mail" size={22} color="#2563EB" />
                <Text style={styles.actionText}>Email</Text>
              </TouchableOpacity>
            )}
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
                { color: (supplier.current_balance || 0) < 0 ? '#DC2626' : '#16A34A' }
              ]}>
                {formatCurrency(supplier.current_balance || 0)}
              </Text>
            </View>
            {/*
            // Uncomment and implement if you have these fields:
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Total Purchases</Text>
              <Text style={styles.financialValue}>$0.00</Text>
            </View>
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Outstanding Payables</Text>
              <Text style={styles.financialValue}>$0.00</Text>
            </View>
            */}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoGrid}>
            {supplier.email && (
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{supplier.email}</Text>
              </View>
            )}
            {supplier.phone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{supplier.phone}</Text>
              </View>
            )}
            {supplier.contact_person && (
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{supplier.contact_person}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Address Information */}
        {(supplier.address || supplier.city || supplier.state || supplier.country || supplier.postal_code) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <View style={styles.addressText}>
                {supplier.address && <Text style={styles.addressLine}>{supplier.address}</Text>}
                {supplier.city && <Text style={styles.addressLine}>{supplier.city}</Text>}
                {supplier.state && <Text style={styles.addressLine}>{supplier.state}</Text>}
                {supplier.country && <Text style={styles.addressLine}>{supplier.country}</Text>}
                {supplier.postal_code && <Text style={styles.addressLine}>{supplier.postal_code}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Additional Information */}
        {(supplier.tax_id || supplier.payment_terms || supplier.notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            {supplier.tax_id && (
              <View style={styles.infoItem}>
                <Ionicons name="card-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>Tax ID: {supplier.tax_id}</Text>
              </View>
            )}
            {supplier.payment_terms && (
              <View style={styles.infoItem}>
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>Payment Terms: {supplier.payment_terms}</Text>
              </View>
            )}
            {supplier.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{supplier.notes}</Text>
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
                  <Text style={styles.transactionDate}>{formatDate(transaction.transaction_date)}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description || 'No description'}</Text>
                  <Text style={styles.transactionType}>{transaction.transaction_type}</Text>
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

        {/* Recent Receipts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Receipts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {receipts && receipts.length > 0 ? (
            receipts.map((receipt) => (
              <View key={receipt.receipt_id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDate}>{formatDate(receipt.receipt_date)}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{receipt.description || 'No description'}</Text>
                  <Text style={styles.transactionType}>{receipt.payment_method}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: '#2563EB' }
                ]}>
                  {formatCurrency(receipt.amount || 0)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No receipts yet</Text>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete Supplier</Text>
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
  card: {
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactPersonText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
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
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
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

export default SupplierDetails; 