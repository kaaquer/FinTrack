import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceItem {
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  items: InvoiceItem[];
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customerName: 'Tech Solutions Inc.',
    amount: 1500.00,
    dueDate: '2024-04-15',
    status: 'pending',
    items: [
      { description: 'Web Development', amount: 1000 },
      { description: 'UI/UX Design', amount: 500 }
    ]
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customerName: 'Digital Marketing Co.',
    amount: 2500.00,
    dueDate: '2024-04-20',
    status: 'paid',
    items: [
      { description: 'SEO Services', amount: 1500 },
      { description: 'Content Creation', amount: 1000 }
    ]
  }
];

const InvoiceScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderInvoiceCard = ({ item }: { item: Invoice }) => (
    <TouchableOpacity style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'paid' ? '#E8F5E9' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'paid' ? '#4CAF50' : '#FF9800' }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>${item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{item.dueDate}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.viewButton]}>
          <Ionicons name="eye-outline" size={20} color="#4F46E5" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.downloadButton]}>
          <Ionicons name="download-outline" size={20} color="#4F46E5" />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Invoice</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'paid'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.activeFilter
            ]}
            onPress={() => setFilterStatus(status as 'all' | 'pending' | 'paid')}
          >
            <Text style={[
              styles.filterText,
              filterStatus === status && styles.activeFilterText
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  activeFilter: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    color: '#6B7280',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  detailValue: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  viewButton: {
    backgroundColor: '#EEF2FF',
  },
  downloadButton: {
    backgroundColor: '#EEF2FF',
  },
  viewButtonText: {
    color: '#4F46E5',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  downloadButtonText: {
    color: '#4F46E5',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvoiceScreen;