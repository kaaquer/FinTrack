import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';

const AddSupplierScreen: React.FC = () => {
  const navigation = useNavigation();
  const { control, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data: any) => {
    console.log('Supplier Data:', data);
    // Add logic to save data to backend
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Supplier</Text>
      
      <Controller
        control={control}
        name="companyName"
        rules={{ required: 'Company Name is required' }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter company name"
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.companyName && <Text style={styles.error}>{errors.companyName.message?.toString()}</Text>}

      <Controller
        control={control}
        name="email"
        rules={{ required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message?.toString()}</Text>}

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            onChangeText={onChange}
            value={value}
            keyboardType="phone-pad"
          />
        )}
      />
      
      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Add Supplier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
  error: { color: 'red', marginBottom: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelButton: { backgroundColor: '#ccc', padding: 10, borderRadius: 5 },
  saveButton: { backgroundColor: '#000', padding: 10, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center' }
});

export default AddSupplierScreen;