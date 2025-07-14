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
import { apiService, Supplier } from '../services/api';
import { showAlert, showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

// Navigation types (adjust as needed)
type AddEditSupplierRouteProp = RouteProp<any, 'AddSupplier' | 'EditSupplier'>;

type SupplierForm = {
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  tax_id: string;
  payment_terms: string;
  is_active: boolean;
  notes: string;
};

const AddEditSupplier = () => {
  const navigation = useNavigation();
  const route = useRoute<AddEditSupplierRouteProp>();
  const { supplier } = route.params || {};
  const mode = route.name === 'AddSupplier' ? 'add' : 'edit';

  const [form, setForm] = useState<SupplierForm>({
    supplier_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    tax_id: '',
    payment_terms: '',
    is_active: true,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SupplierForm>>({});

  useEffect(() => {
    if (mode === 'edit' && supplier) {
      setForm({
        supplier_name: supplier.supplier_name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        country: supplier.country || '',
        postal_code: supplier.postal_code || '',
        tax_id: supplier.tax_id || '',
        payment_terms: supplier.payment_terms || '',
        is_active: supplier.is_active ?? true,
        notes: supplier.notes || '',
      });
    }
  }, [mode, supplier]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SupplierForm> = {};
    if (!form.supplier_name.trim()) {
      newErrors.supplier_name = 'Supplier name is required';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please fix the errors in the form',
        buttons: [{ text: 'OK' }],
      });
      return;
    }
    setLoading(true);
    try {
      const supplierData: Partial<Supplier> = {
        supplier_name: form.supplier_name,
        contact_person: form.contact_person || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postal_code: form.postal_code || undefined,
        tax_id: form.tax_id || undefined,
        payment_terms: form.payment_terms || undefined,
        is_active: form.is_active,
        notes: form.notes || undefined,
      };
      if (mode === 'add') {
        await apiService.createSupplier(supplierData);
        await showSuccessAlert('Success! 🎉', 'Supplier has been added successfully!');
        navigation.goBack();
      } else {
        if (!supplier || !supplier.supplier_id) {
          await showErrorAlert('Error', 'Supplier data is missing. Please go back and try again.');
          return;
        }
        await apiService.updateSupplier(supplier.supplier_id, supplierData);
        await showSuccessAlert('Success! ✅', 'Supplier has been updated successfully!');
        navigation.goBack();
      }
    } catch (err: any) {
      console.error('Error saving supplier:', err);
      await showErrorAlert('Error', err.response?.data?.error || err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof SupplierForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInput = (
    label: string,
    field: keyof SupplierForm,
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
        value={form[field] as string}
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
            {mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
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
            {renderInput('Supplier Name *', 'supplier_name', 'Enter supplier name')}
            {renderInput('Contact Person', 'contact_person', 'Enter contact person')}
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

          {/* Financial & Other Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Information</Text>
            {renderInput('Tax ID', 'tax_id', 'Enter tax identification number')}
            {renderInput('Payment Terms', 'payment_terms', 'Enter payment terms')}
            {/* is_active toggle */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Active</Text>
              <TouchableOpacity
                style={[styles.toggle, form.is_active ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => updateForm('is_active', !form.is_active)}
              >
                <Ionicons
                  name={form.is_active ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={form.is_active ? '#059669' : '#DC2626'}
                />
                <Text style={{ marginLeft: 8, color: form.is_active ? '#059669' : '#DC2626' }}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>
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
                  {mode === 'add' ? 'Create Supplier' : 'Update Supplier'}
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
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    width: 120,
  },
  toggleActive: {
    borderColor: '#059669',
    backgroundColor: '#dcfce7',
  },
  toggleInactive: {
    borderColor: '#DC2626',
    backgroundColor: '#fee2e2',
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

export default AddEditSupplier; 