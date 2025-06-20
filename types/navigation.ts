import { Customer } from '../services/api';

// Root Stack Navigation Types
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  AddCustomer: undefined;
  AddSupplier: undefined;
  CustomersList: undefined;
  CustomerDetails: { id: string };
  EditCustomer: { customer: Customer };
};

// Customer Stack Navigation Types
export type CustomerStackParamList = {
  CustomersDashboard: undefined;
  CustomersList: { refresh?: boolean; deletedCustomerId?: number } | undefined;
  CustomerDetails: { id: string };
  AddCustomer: undefined;
  EditCustomer: { customer: Customer };
};

// Drawer Navigation Types
export type DrawerParamList = {
  Login: undefined;
  MainTabs: undefined;
  Profile: undefined;
  Notifications: undefined;
  'Reports & Insights': undefined;
  'Transactions History': undefined;
  'Invoices & Bills': undefined;
  'Help & Support': undefined;
};

// Tab Navigation Types
export type TabParamList = {
  Home: undefined;
  Suppliers: undefined;
  Cashbook: undefined;
  Receipts: undefined;
}; 