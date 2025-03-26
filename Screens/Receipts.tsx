import React, { useState } from "react";
import { View, FlatList, TextInput, Image, StyleSheet } from "react-native";
import { Card, Text, Button, Chip } from "react-native-paper";

const receipts = [
  {
    id: "1",
    title: "Office Supplies",
    category: "Office Supplies",
    categoryColor: "#4CAF50",
    date: "Oct 15, 2023",
    amount: "$125.99",
    image: "https://via.placeholder.com/60/4CAF50/ffffff?text=OS",
  },
  {
    id: "2",
    title: "Client Lunch",
    category: "Food & Dining",
    categoryColor: "#2E7D32",
    date: "Oct 10, 2023",
    amount: "$84.50",
    image: "https://via.placeholder.com/60/2E7D32/ffffff?text=CL",
  },
  {
    id: "3",
    title: "Taxi Ride",
    category: "Transportation",
    categoryColor: "#1565C0",
    date: "Sep 20, 2023",
    amount: "$35.75",
    image: "https://via.placeholder.com/60/1565C0/ffffff?text=TR",
  },
  {
    id: "4",
    title: "Office Rent",
    category: "Utilities",
    categoryColor: "#FF9800",
    date: "Sep 1, 2023",
    amount: "$980.00",
    image: "https://via.placeholder.com/60/FF9800/ffffff?text=OR",
  },
];

const ReceiptsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReceipts = receipts.filter((receipt) =>
    receipt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search documents..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button mode="contained" icon="camera" style={styles.scanButton}>
          Scan Receipt
        </Button>
        <Button mode="outlined" icon="upload">
          Upload
        </Button>
      </View>

      {/* Receipts List */}
      <FlatList
        data={filteredReceipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              {/* Receipt Image */}
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.categoryContainer}>
                  <Chip textStyle={{ color: "white" }} style={{ backgroundColor: item.categoryColor }}>
                    {item.category}
                  </Chip>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text style={styles.amount}>{item.amount}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchBar: {
    height: 40,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  scanButton: {
    backgroundColor: "#7E57C2",
  },
  card: {
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  date: {
    marginLeft: 8,
    color: "#777",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReceiptsScreen;
