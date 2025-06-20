import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService, Customer as ApiCustomer } from '../services/api';
import { CustomerStackParamList } from '../types/navigation';
import { showAlert, showSuccessAlert, showErrorAlert } from '../utils/alertUtils';
import { useDashboardRefresh } from '../contexts/DashboardRefreshContext';

type AddEditCustomerRouteProp = RouteProp<CustomerStackParamList, 'AddCustomer' | 'EditCustomer'>;
type AddEditCustomerNavigationProp = StackNavigationProp<CustomerStackParamList, 'AddCustomer' | 'EditCustomer'>;

interface CustomerForm {
  customer_name: string;
  customer_type: 'individual' | 'business';
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_id: string;
  credit_limit: string;
  status: 'active' | 'inactive' | 'lead';
  notes: string;
}

const AddEditCustomer = () => {
  const navigation = useNavigation<AddEditCustomerNavigationProp>();
  const route = useRoute<AddEditCustomerRouteProp>();
  const { customer } = route.params || {};
  const { triggerDashboardRefresh } = useDashboardRefresh();
  
  // Determine mode from route name
  const mode = route.name === 'AddCustomer' ? 'add' : 'edit';

  const [form, setForm] = useState<CustomerForm>({
    customer_name: '',
    customer_type: 'individual',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    credit_limit: '0',
    status: 'active',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CustomerForm>>({});

  useEffect(() => {
    if (mode === 'edit' && customer) {
      setForm({
        customer_name: customer.customer_name || '',
        customer_type: customer.customer_type || 'individual',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postal_code: customer.postal_code || '',
        tax_id: customer.tax_id || '',
        credit_limit: customer.credit_limit?.toString() || '0',
        status: customer.status || 'active',
        notes: customer.notes || '',
      });
    }
  }, [mode, customer]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerForm> = {};

    if (!form.customer_name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (form.credit_limit && isNaN(Number(form.credit_limit))) {
      newErrors.credit_limit = 'Credit limit must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please fix the errors in the form',
        buttons: [{ text: 'OK' }]
      });
      return;
    }

    setLoading(true);
    try {
      const customerData: Partial<ApiCustomer> = {
        customer_name: form.customer_name,
        customer_type: form.customer_type,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postal_code: form.postal_code || undefined,
        tax_id: form.tax_id || undefined,
        credit_limit: parseFloat(form.credit_limit) || 0,
        status: form.status,
        notes: form.notes || undefined,
      };

      if (mode === 'add') {
        await apiService.createCustomer(customerData);
        await showSuccessAlert('Success! 🎉', 'Customer has been added successfully!');
        triggerDashboardRefresh();
        navigation.replace('CustomersList');
      } else {
        if (!customer || !customer.customer_id) {
          await showErrorAlert('Error', 'Customer data is missing. Please go back and try again.');
          return;
        }
        await apiService.updateCustomer(customer.customer_id, customerData);
        await showSuccessAlert('Success! ✅', 'Customer has been updated successfully!');
        triggerDashboardRefresh();
        navigation.replace('CustomersList');
      }
    } catch (err: any) {
      console.error('Error saving customer:', err);
      await showErrorAlert('Error', err.response?.data?.error || err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof CustomerForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInput = (
    label: string,
    field: keyof CustomerForm,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default',
    multiline: boolean = false,
    numberOfLines: number = 1
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          errors[field] && styles.inputError
        ]}
        placeholder={placeholder}
        value={form[field]}
        onChangeText={(value) => updateForm(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor="#9CA3AF"
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  const renderPicker = (label: string, field: keyof CustomerForm, options: { label: string; value: string }[]) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              form[field] === option.value && styles.pickerOptionActive
            ]}
            onPress={() => updateForm(field, option.value)}
          >
            <Text style={[
              styles.pickerOptionText,
              form[field] === option.value && styles.pickerOptionTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'add' ? 'Add Customer' : 'Edit Customer'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {renderInput('Customer Name *', 'customer_name', 'Enter customer name')}
            
            {renderPicker('Customer Type', 'customer_type', [
              { label: 'Individual', value: 'individual' },
              { label: 'Business', value: 'business' },
            ])}

            {renderPicker('Status', 'status', [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Lead', value: 'lead' },
            ])}
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {renderInput('Email', 'email', 'Enter email address', 'email-address')}
            {renderInput('Phone', 'phone', 'Enter phone number', 'phone-pad')}
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            {renderInput('Address', 'address', 'Enter street address', 'default', true, 2)}
            {renderInput('City', 'city', 'Enter city')}
            {renderInput('State/Province', 'state', 'Enter state or province')}
            {renderInput('Country', 'country', 'Enter country')}
            {renderInput('Postal Code', 'postal_code', 'Enter postal code')}
          </View>

          {/* Financial Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Information</Text>
            
            {renderInput('Tax ID', 'tax_id', 'Enter tax identification number')}
            {renderInput('Credit Limit', 'credit_limit', 'Enter credit limit', 'numeric')}
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            {renderInput('Notes', 'notes', 'Enter any additional notes', 'default', true, 4)}
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'add' ? 'Create Customer' : 'Update Customer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  pickerOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  submitContainer: {
    paddingVertical: 24,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddEditCustomer; 