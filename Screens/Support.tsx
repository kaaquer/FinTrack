import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

interface HelpCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
}

interface ContactMethod {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  description: string;
}

const Support = () => {
  const helpCategories: HelpCategory[] = [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      items: ['Account Setup', 'Basic Navigation', 'First Transaction']
    },
    {
      title: 'Managing Finances',
      icon: 'wallet-outline',
      items: ['Add Transactions', 'Track Expenses', 'Generate Reports']
    },
    {
      title: 'Customer Management',
      icon: 'people-outline',
      items: ['Add Customers', 'Customer History', 'Payment Tracking']
    },
    {
      title: 'Reports & Analytics',
      icon: 'bar-chart-outline',
      items: ['Create Reports', 'Export Data', 'Financial Insights']
    }
  ];

  const contactMethods: ContactMethod[] = [
    {
      title: 'Email Support',
      icon: 'mail-outline',
      action: () => Linking.openURL('mailto:support@fintrack.com'),
      description: '24/7 response within 1 business day'
    },
    {
      title: 'Live Chat',
      icon: 'chatbubbles-outline',
      action: () => console.log('Open live chat'),
      description: 'Available Mon-Fri, 9AM-5PM EST'
    },
    {
      title: 'Phone Support',
      icon: 'call-outline',
      action: () => Linking.openURL('tel:+1234567890'),
      description: 'Call us at +1 (234) 567-890'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Help & Support</Text>
      
      {/* Help Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How can we help you?</Text>
        {helpCategories.map((category, index) => (
          <TouchableOpacity key={index} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon} size={24} color="#4F46E5" />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <View style={styles.categoryItems}>
              {category.items.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.categoryItem}>
                  <Ionicons name="chevron-forward-outline" size={16} color="#6B7280" />
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {contactMethods.map((method, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactCard}
            onPress={method.action}
          >
            <View style={styles.contactIcon}>
              <Ionicons name={method.icon} size={24} color="#4F46E5" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={styles.contactDescription}>{method.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <TouchableOpacity style={styles.faqButton}>
          <Text style={styles.faqButtonText}>Visit our FAQ Page</Text>
          <Ionicons name="open-outline" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#374151',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#111827',
  },
  categoryItems: {
    marginLeft: 36,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemText: {
    marginLeft: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 16,
  },
  faqButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginRight: 8,
  },
});

export default Support;