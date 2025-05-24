import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  status: 'completed' | 'pending';
}

// Mock data for transactions
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 1500,
    description: 'Client Payment - Project A',
    date: '2024-03-20',
    category: 'Services',
    status: 'completed'
  },
  {
    id: '2',
    type: 'expense',
    amount: 500,
    description: 'Office Supplies',
    date: '2024-03-19',
    category: 'Supplies',
    status: 'completed'
  },
  {
    id: '3',
    type: 'income',
    amount: 2000,
    description: 'Consulting Services',
    date: '2024-03-18',
    category: 'Services',
    status: 'pending'
  },
  // Add more mock transactions as needed
];

const TransactionsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = mockTransactions
    .filter(transaction => {
      if (filter === 'all') return true;
      return transaction.type === filter;
    })
    .filter(transaction =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.typeContainer}>
          <Ionicons
            name={item.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={24}
            color={item.type === 'income' ? '#4CAF50' : '#F44336'}
          />
          <Text style={[
            styles.type,
            { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
          ]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.amount}>
          {item.type === 'income' ? '+' : '-'}${item.amount}
        </Text>
      </View>
      
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.transactionFooter}>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <Text style={styles.date}>{item.date}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'completed' ? '#4CAF50' : '#FF9800' }
          ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'income' && styles.activeFilter]}
          onPress={() => setFilter('income')}
        >
          <Text style={[styles.filterText, filter === 'income' && styles.activeFilterText]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'expense' && styles.activeFilter]}
          onPress={() => setFilter('expense')}
        >
          <Text style={[styles.filterText, filter === 'expense' && styles.activeFilterText]}>
            Expenses
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.transactionsList}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  activeFilter: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    color: '#666666',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  transactionsList: {
    paddingBottom: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  category: {
    color: '#6B7280',
    fontSize: 12,
  },
  date: {
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TransactionsScreen;