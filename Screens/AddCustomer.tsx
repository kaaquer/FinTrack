import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, StatusBar 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Define navigation types
type RootStackParamList = {
  Home: undefined;
  CustomersList: undefined;
  CustomerDetails: { id: string };
  AddCustomer: undefined;
};

type AddCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddCustomer'>;

const AddCustomer: React.FC = () => {
  const navigation = useNavigation<AddCustomerScreenNavigationProp>();
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

  const validateForm = () => {
    if (!customer.firstName.trim() || !customer.lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return false;
    }
    if (!customer.email.trim()) {
      Alert.alert("Error", "Email is required");
      return false;
    }
    if (!customer.phone.trim()) {
      Alert.alert("Error", "Phone number is required");
      return false;
    }
    return true;
  };

  const handleSaveCustomer = () => {
    if (!validateForm()) return;

    // Here you would typically save to your backend
    console.log("Customer Saved:", customer);
    
    Alert.alert(
      "Success",
      "Customer added successfully!",
      [
        {
          text: "View Customer List",
          onPress: () => navigation.navigate("CustomersList"),
        },
        {
          text: "Add Another",
          onPress: () => setCustomer({
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
          }),
        },
      ]
    );
  };

  const handleCancel = () => {
    // Check if any fields have been filled
    const hasChanges = Object.values(customer).some(value => value.trim() !== "");
    
    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Stay",
            style: "cancel",
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Customer</Text>
      </View>

      {/* Scrollable Content */}
      <LinearGradient colors={["#F8FAFC", "#E0E7FF"]} style={styles.scrollContainer}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.row}>
              <TextInput
                placeholder="First Name *"
                style={styles.input}
                value={customer.firstName}
                onChangeText={(text) => setCustomer({ ...customer, firstName: text })}
              />
              <TextInput
                placeholder="Last Name *"
                style={styles.input}
                value={customer.lastName}
                onChangeText={(text) => setCustomer({ ...customer, lastName: text })}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                placeholder="Email *"
                style={styles.input}
                value={customer.email}
                onChangeText={(text) => setCustomer({ ...customer, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                placeholder="Phone *"
                style={styles.input}
                value={customer.phone}
                onChangeText={(text) => setCustomer({ ...customer, phone: text })}
                keyboardType="phone-pad"
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
      </LinearGradient>

      {/* Fixed Buttons at Bottom */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={handleCancel}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSaveCustomer}
        >
          <Text style={styles.buttonText}>Save Customer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    color: "#111827",
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButtonText: {
    color: "#374151",
  },
});

export default AddCustomer;