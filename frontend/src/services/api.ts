import axios from 'axios';
import { User, Customer, Product, StockMovement, Challan, DashboardStats } from '../types';

const API_BASE_URL = 'https://mini-erp-crm-7lkx.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('erp_token', res.data.token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  }
};

export const customerService = {
  getAll: async (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: Customer[]; pagination: any }>('/customers', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
    return res.data.data;
  },
  create: async (customerData: Partial<Customer>) => {
    const res = await api.post<{ success: boolean; message: string; data: Customer }>('/customers', customerData);
    return res.data;
  },
  update: async (id: string, customerData: Partial<Customer>) => {
    const res = await api.put<{ success: boolean; message: string; data: Customer }>(`/customers/${id}`, customerData);
    return res.data;
  },
  addNote: async (id: string, noteData: { note: string; newFollowUpDate?: string; newStatus?: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/customers/${id}/notes`, noteData);
    return res.data;
  }
};

export const productService = {
  getAll: async (params?: { search?: string; category?: string; lowStockOnly?: boolean; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: Product[]; pagination: any }>('/products', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return res.data.data;
  },
  create: async (productData: Partial<Product>) => {
    const res = await api.post<{ success: boolean; message: string; data: Product }>('/products', productData);
    return res.data;
  },
  update: async (id: string, productData: Partial<Product>) => {
    const res = await api.put<{ success: boolean; message: string; data: Product }>(`/products/${id}`, productData);
    return res.data;
  },
  adjustStock: async (id: string, adjustment: { type: 'IN' | 'OUT'; quantity: number; reason: string }) => {
    const res = await api.post<{ success: boolean; message: string; data: any }>(`/products/${id}/adjust-stock`, adjustment);
    return res.data;
  },
  getMovementsLog: async (params?: { productId?: string; type?: string; search?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: StockMovement[]; pagination: any }>('/products/movements/log', { params });
    return res.data;
  }
};

export const challanService = {
  getAll: async (params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: Challan[]; pagination: any }>('/challans', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Challan }>(`/challans/${id}`);
    return res.data.data;
  },
  create: async (payload: { customerId: string; status?: 'Draft' | 'Confirmed'; items: { productId: string; quantity: number; unitPrice?: number }[] }) => {
    const res = await api.post<{ success: boolean; message: string; data: Challan }>('/challans', payload);
    return res.data;
  },
  updateStatus: async (id: string, status: 'Draft' | 'Confirmed' | 'Cancelled') => {
    const res = await api.put<{ success: boolean; message: string; data: Challan }>(`/challans/${id}/status`, { status });
    return res.data;
  }
};

export const dashboardService = {
  getStats: async () => {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return res.data.data;
  }
};
