import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  const screenWidth = Dimensions.get('window').width;

  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [3500, 4200, 3800, 5000, 4800, 6000],
    }]
  };

  const expenseData = {
    labels: ['Supplies', 'Rent', 'Utilities', 'Salaries', 'Marketing', 'Others'],
    datasets: [{
      data: [1200, 2500, 800, 3000, 1000, 500],
    }]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Reports</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'month' && styles.selectedPeriodText]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'quarter' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('quarter')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'quarter' && styles.selectedPeriodText]}>Quarter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'year' && styles.selectedPeriod]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[styles.periodText, selectedPeriod === 'year' && styles.selectedPeriodText]}>Year</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenue Overview</Text>
        <LineChart
          data={monthlyData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#5196f4"
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expense Breakdown</Text>
        <BarChart
          data={expenseData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel="$"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 }
          }}
          style={styles.chart}
        />
      </View>

      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.summaryTitle}>Total Revenue</Text>
          <Text style={styles.summaryAmount}>$27,300</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Ionicons name="trending-down" size={24} color="#F44336" />
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>$9,000</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="download-outline" size={20} color="white" />
        <Text style={styles.exportButtonText}>Export Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#E8EAF6',
    borderRadius: 10,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPeriod: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodText: {
    color: '#666',
    fontSize: 14,
  },
  selectedPeriodText: {
    color: '#000',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginVertical: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#5C6BC0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default Reports;