import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../services/api';

interface TransactionDetail {
  accountId: number;
  debitAmount: string;
  creditAmount: string;
  description?: string;
}

interface Category {
  category_id: number;
  category_name: string;
  category_type: string;
}

interface Props {
  route?: any;
  navigation?: any;
}

const AddEditTransaction: React.FC<Props> = ({ route, navigation }) => {
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'sale' | 'purchase' | 'payment' | 'receipt' | 'journal'>('income');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [supplierId, setSupplierId] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [details, setDetails] = useState<TransactionDetail[]>([{ accountId: 0, debitAmount: '', creditAmount: '', description: '' }]);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsData, customersData, suppliersData] = await Promise.all([
          apiService.getAccounts(),
          apiService.getCustomers({ limit: 100 }),
          apiService.getSuppliers({ limit: 100 })
        ]);
        setAccounts(accountsData);
        setCustomers(customersData.data);
        setSuppliers(suppliersData.data);
        // Fetch categories manually (no API method, so fallback to /categories if exists)
        const res = await fetch('http://100.112.30.166:3000/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        } else {
          setCategories([]);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load form data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add or remove transaction detail lines
  const addDetail = () => {
    setDetails([...details, { accountId: 0, debitAmount: '', creditAmount: '', description: '' }]);
  };
  const removeDetail = (idx: number) => {
    if (details.length === 1) return;
    setDetails(details.filter((_, i) => i !== idx));
  };
  const updateDetail = (idx: number, field: keyof TransactionDetail, value: string | number) => {
    setDetails(details.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  // Form submission
  const handleSubmit = async () => {
    // Basic validation
    if (!transactionDate || !description || !totalAmount || !transactionType || details.length === 0) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }
    if (details.some(d => !d.accountId || (d.debitAmount === '' && d.creditAmount === ''))) {
      Alert.alert('Validation Error', 'Each detail must have an account and at least a debit or credit amount.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        transactionDate,
        description,
        totalAmount: parseFloat(totalAmount),
        transactionType,
        categoryId,
        customerId,
        supplierId,
        paymentMethod,
        referenceNumber,
        details: details.map(d => ({
          accountId: d.accountId,
          debitAmount: parseFloat(d.debitAmount) || 0,
          creditAmount: parseFloat(d.creditAmount) || 0,
          description: d.description || ''
        }))
      };
      await apiService.createTransaction(payload);
      Alert.alert('Success', 'Transaction saved successfully!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>Add/Edit Transaction</Text>
        <Text style={styles.label}>Date <Text style={styles.required}>*</Text></Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={transactionDate}
          onChangeText={setTransactionDate}
          style={styles.input}
        />
        <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
        />
        <Text style={styles.label}>Total Amount <Text style={styles.required}>*</Text></Text>
        <TextInput
          placeholder="Total Amount"
          value={totalAmount}
          onChangeText={setTotalAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.label}>Transaction Type <Text style={styles.required}>*</Text></Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={transactionType}
            onValueChange={v => setTransactionType(v)}
            style={styles.picker}
          >
            <Picker.Item label="Income" value="income" />
            <Picker.Item label="Expense" value="expense" />
            <Picker.Item label="Sale" value="sale" />
            <Picker.Item label="Purchase" value="purchase" />
            <Picker.Item label="Payment" value="payment" />
            <Picker.Item label="Receipt" value="receipt" />
            <Picker.Item label="Journal" value="journal" />
          </Picker>
        </View>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId}
            onValueChange={v => setCategoryId(v)}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value={undefined} />
            {categories.map(cat => (
              <Picker.Item key={cat.category_id} label={cat.category_name} value={cat.category_id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Customer</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={customerId}
            onValueChange={v => setCustomerId(v)}
            style={styles.picker}
          >
            <Picker.Item label="Select Customer" value={undefined} />
            {customers.map(c => (
              <Picker.Item key={c.customer_id} label={c.customer_name} value={c.customer_id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Supplier</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={supplierId}
            onValueChange={v => setSupplierId(v)}
            style={styles.picker}
          >
            <Picker.Item label="Select Supplier" value={undefined} />
            {suppliers.map(s => (
              <Picker.Item key={s.supplier_id} label={s.supplier_name} value={s.supplier_id} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={paymentMethod}
            onValueChange={v => setPaymentMethod(v)}
            style={styles.picker}
          >
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="Check" value="check" />
            <Picker.Item label="Bank Transfer" value="bank_transfer" />
            <Picker.Item label="Credit Card" value="credit_card" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
        <Text style={styles.label}>Reference Number</Text>
        <TextInput
          placeholder="Reference Number"
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: 24, fontSize: 18 }]}>Transaction Details <Text style={styles.required}>*</Text></Text>
        {details.map((detail, idx) => (
          <View key={idx} style={styles.detailCard}>
            <Text style={styles.detailHeader}>Detail #{idx + 1}</Text>
            <Text style={styles.label}>Account <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={detail.accountId}
                onValueChange={v => updateDetail(idx, 'accountId', v)}
                style={styles.picker}
              >
                <Picker.Item label="Select Account" value={0} />
                {accounts.map(a => (
                  <Picker.Item key={a.account_id} label={`${a.account_code} - ${a.account_name}`} value={a.account_id} />
                ))}
              </Picker>
            </View>
            <Text style={styles.label}>Debit Amount</Text>
            <TextInput
              placeholder="Debit"
              value={detail.debitAmount}
              onChangeText={v => updateDetail(idx, 'debitAmount', v)}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.label}>Credit Amount</Text>
            <TextInput
              placeholder="Credit"
              value={detail.creditAmount}
              onChangeText={v => updateDetail(idx, 'creditAmount', v)}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Detail Description"
              value={detail.description}
              onChangeText={v => updateDetail(idx, 'description', v)}
              style={styles.input}
            />
            <View style={styles.detailButtonRow}>
              <TouchableOpacity onPress={addDetail} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add Line</Text>
              </TouchableOpacity>
              {details.length > 1 && (
                <TouchableOpacity onPress={() => removeDetail(idx)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.saveButton, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.saveButtonText}>{submitting ? 'Saving...' : 'Save Transaction'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    color: '#374151',
  },
  required: {
    color: 'red',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    fontSize: 15,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  detailCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#2563EB',
  },
  detailButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});

export default AddEditTransaction;
