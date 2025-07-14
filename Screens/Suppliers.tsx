import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, NavigationProp, useFocusEffect } from "@react-navigation/native";
import { apiService, Supplier } from "../services/api";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/alertUtils';

type RootStackParamList = {
  AddSupplier: undefined;
  EditSupplier: { supplier: Supplier };
  SupplierDetails: { id: number };
};

const Suppliers = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSuppliers({ search });
      setSuppliers(response.data);
    } catch (err) {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh suppliers list every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSuppliers();
    }, [search])
  );

  const handleEditSupplier = (supplier: Supplier) => {
    navigation.navigate("EditSupplier", { supplier });
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    showConfirmAlert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.supplier_name}"? This action cannot be undone!`,
      async () => {
        setDeletingId(supplier.supplier_id);
        try {
          await apiService.deleteSupplier(supplier.supplier_id);
          await showSuccessAlert('Success', 'Supplier deleted successfully');
          fetchSuppliers();
        } catch (err: any) {
          const msg = err?.response?.data?.error || 'Failed to delete supplier.';
          await showErrorAlert('Error', msg);
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const handleViewSupplier = (supplier: Supplier) => {
    navigation.navigate('SupplierDetails', { id: supplier.supplier_id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Suppliers</Text>
      <Text style={styles.subHeader}>Manage your supplier relationships in one place</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchSuppliers}
        />
      </View>

      {/* Add Supplier Button */}
      <TouchableOpacity style={styles.addSupplierButton} onPress={() => navigation.navigate("AddSupplier")}> 
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addSupplierText}>Add Supplier</Text>
      </TouchableOpacity>

      {/* Empty State */}
      {loading ? (
        <Text>Loading...</Text>
      ) : suppliers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={50} color="#A1A1AA" />
          <Text style={styles.emptyTitle}>No suppliers found</Text>
          <Text style={styles.emptyText}>You haven't added any suppliers yet. Get started by adding your first supplier.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("AddSupplier")}> 
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.primaryButtonText}>Add Your First Supplier</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.supplier_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.supplierItem} onPress={() => handleViewSupplier(item)} activeOpacity={0.8}>
              <Text style={styles.supplierName}>{item.supplier_name}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleEditSupplier(item); }} style={styles.editButton}>
                  <Ionicons name="create-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteSupplier(item); }} style={styles.deleteButton} disabled={deletingId === item.supplier_id}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Chat Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Suppliers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subHeader: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addSupplierButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 16,
  },
  addSupplierText: {
    fontSize: 16,
    color: "white",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginHorizontal: 20,
    marginTop: 5,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    color: "white",
    marginLeft: 8,
  },
  supplierItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'space-between',
  },
  supplierName: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginLeft: 12,
    padding: 4,
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#9333EA",
    padding: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
