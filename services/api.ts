import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://100.112.30.166:3000/api'; // Update this to match your backend port

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  customer_type: 'individual' | 'business';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  credit_limit: number;
  current_balance: number;
  status: 'active' | 'inactive' | 'lead';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  supplier_id: number;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms?: string;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  transaction_id: number;
  transaction_number: string;
  transaction_date: string;
  description?: string;
  reference_number?: string;
  total_amount: number;
  transaction_type: 'income' | 'expense' | 'sale' | 'purchase' | 'payment' | 'receipt' | 'journal';
  category_id?: number;
  customer_id?: number;
  supplier_id?: number;
  status: 'draft' | 'posted' | 'cancelled';
  payment_method?: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  created_by?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  supplier_name?: string;
  category_name?: string;
  created_by_name?: string;
}

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
}

export interface Receipt {
  receipt_id: number;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  reference_number?: string;
  description?: string;
  category_id?: number;
  invoice_id?: number;
  image_url?: string;
  created_by?: number;
  created_at: string;
  customer_name?: string;
  supplier_name?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'accountant';
  businessId: number;
  businessName: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
}

export interface CustomerDetailsResponse {
  customer: Customer;
  recentTransactions: Transaction[];
  recentInvoices: Invoice[];
}

export interface Account {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  account_subtype?: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

// API Service Class
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Transform the data to match backend expectations
    const backendData = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      businessName: userData.businessName
    };
    
    const response = await this.api.post<AuthResponse>('/auth/register', backendData);
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile');
    return response.data;
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.api.post('/auth/reset-password', { token, newPassword });
  }

  // Customers
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedResponse<Customer>> {
    const response = await this.api.get('/customers', { params });
    // Transform backend response to match frontend interface
    return {
      data: response.data.customers,
      pagination: response.data.pagination
    };
  }

  async getCustomer(id: number): Promise<CustomerDetailsResponse> {
    const response = await this.api.get<CustomerDetailsResponse>(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    // Transform snake_case to camelCase for backend
    const backendData = {
      customerName: customerData.customer_name,
      customerType: customerData.customer_type,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      country: customerData.country,
      postalCode: customerData.postal_code,
      taxId: customerData.tax_id,
      creditLimit: customerData.credit_limit,
      status: customerData.status,
      notes: customerData.notes
    };
    
    const response = await this.api.post<Customer>('/customers', backendData);
    return response.data;
  }

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer> {
    // Transform snake_case to camelCase for backend
    const backendData = {
      customerName: customerData.customer_name,
      customerType: customerData.customer_type,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      country: customerData.country,
      postalCode: customerData.postal_code,
      taxId: customerData.tax_id,
      creditLimit: customerData.credit_limit,
      status: customerData.status,
      notes: customerData.notes
    };
    
    const response = await this.api.put<Customer>(`/customers/${id}`, backendData);
    return response.data;
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.api.delete(`/customers/${id}`);
  }

  // Suppliers
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<Supplier>> {
    const response = await this.api.get('/suppliers', { params });
    // Transform backend response to match frontend interface
    return {
      data: response.data.suppliers,
      pagination: response.data.pagination
    };
  }

  async getSupplier(id: number): Promise<Supplier> {
    const response = await this.api.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    // Map frontend fields to backend expected fields
    const backendData = {
      supplierName: supplierData.supplier_name,
      contactPerson: supplierData.contact_person,
      email: supplierData.email,
      phone: supplierData.phone,
      address: supplierData.address,
      city: supplierData.city,
      state: supplierData.state,
      country: supplierData.country,
      postalCode: supplierData.postal_code,
      taxId: supplierData.tax_id,
      paymentTerms: supplierData.payment_terms,
      isActive: supplierData.is_active,
      notes: supplierData.notes
    };
    const response = await this.api.post<Supplier>('/suppliers', backendData);
    return response.data;
  }

  async updateSupplier(id: number, supplierData: Partial<Supplier>): Promise<Supplier> {
    // Map frontend fields to backend expected fields
    const backendData = {
      supplierName: supplierData.supplier_name,
      contactPerson: supplierData.contact_person,
      email: supplierData.email,
      phone: supplierData.phone,
      address: supplierData.address,
      city: supplierData.city,
      state: supplierData.state,
      country: supplierData.country,
      postalCode: supplierData.postal_code,
      taxId: supplierData.tax_id,
      paymentTerms: supplierData.payment_terms,
      isActive: supplierData.is_active,
      notes: supplierData.notes
    };
    const response = await this.api.put<Supplier>(`/suppliers/${id}`, backendData);
    return response.data;
  }

  async deleteSupplier(id: number): Promise<void> {
    await this.api.delete(`/suppliers/${id}`);
  }

  // Transactions
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    customerId?: number;
    supplierId?: number;
  }): Promise<PaginatedResponse<Transaction>> {
    const response = await this.api.get('/transactions', { params });
    // Transform backend response to match frontend interface
    return {
      data: response.data.transactions,
      pagination: response.data.pagination
    };
  }

  async getTransaction(id: number): Promise<Transaction> {
    const response = await this.api.get<Transaction>(`/transactions/${id}`);
    return response.data;
  }

  async createTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const response = await this.api.post<Transaction>('/transactions', transactionData);
    return response.data;
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction> {
    const response = await this.api.put<Transaction>(`/transactions/${id}`, transactionData);
    return response.data;
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.api.delete(`/transactions/${id}`);
  }

  // Invoices
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    customerId?: number;
  }): Promise<PaginatedResponse<Invoice>> {
    const response = await this.api.get('/invoices', { params });
    // Transform backend response to match frontend interface
    return {
      data: response.data.invoices,
      pagination: response.data.pagination
    };
  }

  async getInvoice(id: number): Promise<Invoice> {
    const response = await this.api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  }

  async createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const response = await this.api.post<Invoice>('/invoices', invoiceData);
    return response.data;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<void> {
    await this.api.put(`/invoices/${id}/status`, { status });
  }

  async deleteInvoice(id: number): Promise<void> {
    await this.api.delete(`/invoices/${id}`);
  }

  // Receipts
  async getReceipts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    customerId?: number;
    supplierId?: number;
  }): Promise<PaginatedResponse<Receipt>> {
    const response = await this.api.get('/receipts', { params });
    // Transform backend response to match frontend interface
    return {
      data: response.data.receipts,
      pagination: response.data.pagination
    };
  }

  async getReceipt(id: number): Promise<Receipt> {
    const response = await this.api.get<Receipt>(`/receipts/${id}`);
    return response.data;
  }

  async createReceipt(receiptData: Partial<Receipt>): Promise<Receipt> {
    const response = await this.api.post<Receipt>('/receipts', receiptData);
    return response.data;
  }

  async updateReceipt(id: number, receiptData: Partial<Receipt>): Promise<Receipt> {
    const response = await this.api.put<Receipt>(`/receipts/${id}`, receiptData);
    return response.data;
  }

  async deleteReceipt(id: number): Promise<void> {
    await this.api.delete(`/receipts/${id}`);
  }

  // Reports
  async getProfitLossReport(startDate: string, endDate: string): Promise<any> {
    const response = await this.api.get('/reports/profit-loss', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async getCashFlowReport(startDate: string, endDate: string): Promise<any> {
    const response = await this.api.get('/reports/cash-flow', {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async getDashboardSummary(): Promise<any> {
    const response = await this.api.get('/reports/dashboard');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.api.get('/health');
    return response.data;
  }

  async getAccounts(): Promise<Account[]> {
    const response = await this.api.get<{ accounts: Account[] }>("/accounts");
    return response.data.accounts;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 