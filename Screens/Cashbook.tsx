import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'income', amount: 1500, description: 'Client Payment', date: '2024-03-20', category: 'Services' },
  { id: '2', type: 'expense', amount: 500, description: 'Office Supplies', date: '2024-03-19', category: 'Supplies' },
  { id: '3', type: 'income', amount: 2000, description: 'Service Fee', date: '2024-03-18', category: 'Services' },
  { id: '4', type: 'expense', amount: 750, description: 'Equipment', date: '2024-03-17', category: 'Equipment' },
  { id: '5', type: 'expense', amount: 300, description: 'Utilities', date: '2024-03-16', category: 'Utilities' },
];

const MONTHLY_DATA = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    data: [2500, 3500, 4250, 3800, 5000, 4500],
  }],
};

const EXPENSE_BREAKDOWN = [
  {
    name: 'Supplies',
    amount: 500,
    color: '#FF6384',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
  {
    name: 'Equipment',
    amount: 750,
    color: '#36A2EB',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
  {
    name: 'Utilities',
    amount: 300,
    color: '#FFCE56',
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  },
];

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

export default function CashbookScreen() {
  const balance = MOCK_TRANSACTIONS.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: string;
    category: string;
  }
  
  const renderTransactionCard = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.transactionInfo}>
        <MaterialIcons 
          name={item.type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
          size={24} 
          color={item.type === 'income' ? '#28A745' : '#DC3545'}
        />
        <View style={styles.textContainer}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={[styles.amount, item.type === 'income' ? styles.income : styles.expense]}>
          {item.type === 'income' ? '+' : '-'}${item.amount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cashbook</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <BarChart
            data={MONTHLY_DATA}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses Breakdown</Text>
          <PieChart
            data={EXPENSE_BREAKDOWN}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {MOCK_TRANSACTIONS.map((transaction) => (
            <View key={transaction.id} style={styles.card}>
              <View style={styles.transactionInfo}>
                <MaterialIcons 
                  name={transaction.type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
                  size={24} 
                  color={transaction.type === 'income' ? '#28A745' : '#DC3545'}
                />
                <View style={styles.textContainer}>
                  <Text style={styles.description}>{transaction.description}</Text>
                  <Text style={styles.date}>{transaction.date}</Text>
                </View>
                <Text style={[styles.amount, transaction.type === 'income' ? styles.income : styles.expense]}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#343A40',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6C757D',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  income: {
    color: '#28A745',
  },
  expense: {
    color: '#DC3545',
  },
});