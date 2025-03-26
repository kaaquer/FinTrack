import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const AddCustomer = () => {
  const navigation = useNavigation();
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    status: "Active",
    amountPaid: "",
    itemsBought: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  const handleSaveCustomer = () => {
    console.log("Customer Saved:", customer);
    navigation.goBack(); 
  };

  return (
    <LinearGradient colors={["#F8FAFC", "#E0E7FF"]} style={styles.container}>
      <ScrollView style={styles.form}>
        <Text style={styles.header}>Add New Customer</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="First Name"
              style={styles.input}
              value={customer.firstName}
              onChangeText={(text) => setCustomer({ ...customer, firstName: text })}
            />
            <TextInput
              placeholder="Last Name"
              style={styles.input}
              value={customer.lastName}
              onChangeText={(text) => setCustomer({ ...customer, lastName: text })}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={customer.email}
              onChangeText={(text) => setCustomer({ ...customer, email: text })}
            />
            <TextInput
              placeholder="Phone"
              style={styles.input}
              value={customer.phone}
              onChangeText={(text) => setCustomer({ ...customer, phone: text })}
            />
          </View>
          <TextInput
            placeholder="Company (Optional)"
            style={styles.input}
            value={customer.company}
            onChangeText={(text) => setCustomer({ ...customer, company: text })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          <TextInput
            placeholder="Amount Paid"
            style={styles.input}
            keyboardType="numeric"
            value={customer.amountPaid}
            onChangeText={(text) => setCustomer({ ...customer, amountPaid: text })}
          />
          <TextInput
            placeholder="Items Bought (comma separated)"
            style={styles.input}
            value={customer.itemsBought}
            onChangeText={(text) => setCustomer({ ...customer, itemsBought: text })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <TextInput
            placeholder="Address"
            style={styles.input}
            value={customer.address}
            onChangeText={(text) => setCustomer({ ...customer, address: text })}
          />
          <View style={styles.row}>
            <TextInput
              placeholder="City"
              style={styles.input}
              value={customer.city}
              onChangeText={(text) => setCustomer({ ...customer, city: text })}
            />
            <TextInput
              placeholder="State"
              style={styles.input}
              value={customer.state}
              onChangeText={(text) => setCustomer({ ...customer, state: text })}
            />
            <TextInput
              placeholder="Zip Code"
              style={styles.input}
              keyboardType="numeric"
              value={customer.zipCode}
              onChangeText={(text) => setCustomer({ ...customer, zipCode: text })}
            />
          </View>
          <TextInput
            placeholder="Notes (Optional)"
            style={[styles.input, styles.notesInput]}
            multiline
            value={customer.notes}
            onChangeText={(text) => setCustomer({ ...customer, notes: text })}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveCustomer}>
          <Text style={styles.buttonText}>Save Customer</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default AddCustomer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  form: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginHorizontal: 5,
    color: "#111827",
  },
  placeholder: {
    color: "#111827", 
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
