import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService, Customer as ApiCustomer } from '../services/api';
import { CustomerStackParamList } from '../types/navigation';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

type CustomersListNavigationProp = StackNavigationProp<CustomerStackParamList, 'CustomersList'>;
type CustomersListRouteProp = RouteProp<CustomerStackParamList, 'CustomersList'>;

type RootStackParamList = {
  CustomerDetails: { id: string };
  AddCustomer: undefined;
  EditCustomer: { customer: any };
};

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  customer_type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'lead';
  currentBalance: number;
  creditLimit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

const screenWidth = Dimensions.get('window').width;

// Convert API customer to frontend customer
const convertApiCustomerToCustomer = (apiCustomer: ApiCustomer): Customer => {
  return {
    id: apiCustomer.customer_id.toString(),
    name: apiCustomer.customer_name,
    email: apiCustomer.email,
    phone: apiCustomer.phone,
    address: apiCustomer.address,
    city: apiCustomer.city,
    state: apiCustomer.state,
    country: apiCustomer.country,
    postal_code: apiCustomer.postal_code,
    tax_id: apiCustomer.tax_id,
    customer_type: apiCustomer.customer_type,
    status: apiCustomer.status,
    currentBalance: apiCustomer.current_balance,
    creditLimit: apiCustomer.credit_limit,
    notes: apiCustomer.notes,
    createdAt: apiCustomer.created_at,
    updatedAt: apiCustomer.updated_at,
  };
};

// Filter Modal Component
const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                {['all', 'active', 'inactive', 'lead'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.status === status && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters({ ...filters, status })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === status && styles.filterOptionTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                {['name', 'createdAt', 'currentBalance'].map((sortBy) => (
                  <TouchableOpacity
                    key={sortBy}
                    style={[
                      styles.filterOption,
                      filters.sortBy === sortBy && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters({ ...filters, sortBy })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.sortBy === sortBy && styles.filterOptionTextActive
                    ]}>
                      {sortBy === 'name' ? 'Name' : 
                       sortBy === 'createdAt' ? 'Date Created' : 'Balance'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Order */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort Order</Text>
              <View style={styles.filterOptions}>
                {['asc', 'desc'].map((order) => (
                  <TouchableOpacity
                    key={order}
                    style={[
                      styles.filterOption,
                      filters.sortOrder === order && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters({ ...filters, sortOrder: order })}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.sortOrder === order && styles.filterOptionTextActive
                    ]}>
                      {order === 'asc' ? 'Ascending' : 'Descending'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Customer Card Component
const CustomerCard: React.FC<{ customer: Customer; onEdit: (customer: Customer) => void; onDelete: (customer: Customer) => void; onView: (customer: Customer) => void }> = ({ 
  customer, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#DCFCE7', text: '#16A34A' };
      case 'inactive': return { bg: '#FEE2E2', text: '#DC2626' };
      case 'lead': return { bg: '#FEF3C7', text: '#D97706' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const statusColors = getStatusColor(customer.status);

  return (
    <TouchableOpacity style={styles.customerCard} onPress={() => onView(customer)}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>
              {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{customer.name || 'Unknown Customer'}</Text>
            <Text style={styles.customerContact}>
              {customer.email || customer.phone || 'No contact info'}
            </Text>
            <Text style={styles.customerLocation}>
              {[customer.city, customer.state, customer.country].filter(Boolean).join(', ') || 'No location'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={[styles.statValue, { color: (customer.currentBalance || 0) < 0 ? '#DC2626' : '#16A34A' }]}>
            ${Math.abs(customer.currentBalance || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Credit Limit</Text>
          <Text style={styles.statValue}>${(customer.creditLimit || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Created</Text>
          <Text style={styles.statValue}>
            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.customerActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={(e) => {
            e.stopPropagation();
            onView(customer);
          }}
        >
          <Ionicons name="eye-outline" size={16} color="#2563EB" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={(e) => {
            e.stopPropagation();
            onEdit(customer);
          }}
        >
          <Ionicons name="pencil-outline" size={16} color="#059669" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={(e) => {
            e.stopPropagation();
            onDelete(customer);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#DC2626" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const CustomersList = () => {
  const navigation = useNavigation<CustomersListNavigationProp>();
  const route = useRoute<CustomersListRouteProp>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  });

  // Check for refresh parameter from navigation
  useEffect(() => {
    if (route.params?.refresh) {
      fetchCustomers(true);
      // Clear the refresh parameter
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh]);

  const fetchCustomers = useCallback(async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPagination(prev => ({ ...prev, page: 1 }));
      } else if (!isLoadMore) {
        setLoading(true);
      }
      setError(null);

      const currentPage = isLoadMore ? pagination.page + 1 : 1;
      
      const response = await apiService.getCustomers({
        page: currentPage,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: filters.status === 'all' ? undefined : filters.status,
      });

      const convertedCustomers = response.data.map(convertApiCustomerToCustomer);
      
      if (isLoadMore) {
        setCustomers(prev => [...prev, ...convertedCustomers]);
        setPagination(prev => ({
          ...prev,
          page: currentPage,
          total: response.pagination.total,
          hasMore: currentPage < response.pagination.pages,
        }));
      } else {
        setCustomers(convertedCustomers);
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: response.pagination.total,
          hasMore: response.pagination.pages > 1,
        }));
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filters, pagination.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Refresh list when screen comes into focus and handle deleted customer alert
  useFocusEffect(
    useCallback(() => {
      fetchCustomers(true);

      if (route.params?.deletedCustomerId) {
        showSuccessAlert('Success', 'Customer deleted successfully');
        // Delay clearing the deletedCustomerId param to ensure the alert has time to dismiss
        setTimeout(() => {
          navigation.setParams({ deletedCustomerId: undefined });
        }, 500); // Increased delay to 500ms to be safe
      }
    }, [fetchCustomers, route.params?.deletedCustomerId])
  );

  const handleRefresh = () => {
    fetchCustomers(true);
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !loading) {
      fetchCustomers(false, true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleEditCustomer = (customer: Customer) => {
    // Convert frontend Customer to API Customer format
    const apiCustomer: ApiCustomer = {
      customer_id: parseInt(customer.id),
      customer_name: customer.name,
      customer_type: customer.customer_type,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postal_code: customer.postal_code,
      tax_id: customer.tax_id,
      credit_limit: customer.creditLimit,
      current_balance: customer.currentBalance,
      status: customer.status,
      notes: customer.notes,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    };
    
    navigation.navigate('EditCustomer', { customer: apiCustomer });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    showConfirmAlert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      async () => {
        try {
          await apiService.deleteCustomer(parseInt(customer.id));
          // Remove from local state and refresh the list
          setCustomers(prev => prev.filter(c => c.id !== customer.id));
          // Also refresh to update pagination counts
          fetchCustomers(true);
          showSuccessAlert('Success', 'Customer deleted successfully');
        } catch (err: any) {
          console.error('Delete failed:', err);
          showErrorAlert('Error', err.response?.data?.error || 'Failed to delete customer');
        }
      }
    );
  };

  const handleViewCustomer = (customer: Customer) => {
    navigation.navigate('CustomerDetails', { id: customer.id });
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <CustomerCard
      customer={item}
      onEdit={handleEditCustomer}
      onDelete={handleDeleteCustomer}
      onView={handleViewCustomer}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No customers found' : 'No customers yet'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Try adjusting your search terms or filters'
          : 'Start by adding your first customer'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.addFirstButton}
          onPress={() => navigation.navigate('AddCustomer')}
        >
          <Text style={styles.addFirstButtonText}>Add Customer</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!pagination.hasMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadMoreText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddCustomer')}>
            <Ionicons name="add" size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {pagination.total} customers found
          </Text>
          {(filters.status !== 'all' || searchQuery) && (
            <TouchableOpacity onPress={() => {
              setFilters({ status: 'all', sortBy: 'name', sortOrder: 'asc' });
              setSearchQuery('');
            }}>
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer List */}
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchCustomers()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#2563EB',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerContact: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  customerLocation: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#EFF6FF',
  },
  editButton: {
    backgroundColor: '#ECFDF5',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2563EB',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterOptionActive: {
    backgroundColor: '#2563EB',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CustomersList; 