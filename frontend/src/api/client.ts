const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: any;
}

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('erp_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data?.errors);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getCurrentUser: () => request<any>('/auth/me'),
  getDemoAccounts: () => request<any[]>('/auth/demo-accounts'),

  // Dashboard
  getDashboardOverview: () => request<any>('/dashboard/overview'),

  // Customers
  getCustomers: (params?: { page?: number; limit?: number; search?: string; status?: string; customerType?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.customerType) query.append('customerType', params.customerType);
    return request<any[]>(`/customers?${query.toString()}`);
  },
  getCustomerById: (id: string) => request<any>(`/customers/${id}`),
  createCustomer: (data: any) =>
    request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: any) =>
    request<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addFollowUpNote: (customerId: string, data: { note: string; nextFollowUpDate?: string | null }) =>
    request<any>(`/customers/${customerId}/follow-up`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Products & Inventory
  getProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStock) query.append('lowStock', 'true');
    return request<any[]>(`/products?${query.toString()}`);
  },
  getProductById: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) =>
    request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: any) =>
    request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adjustStock: (id: string, data: { quantity: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    request<any>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStockLogs: (params?: { page?: number; limit?: number; productId?: string; movementType?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.productId) query.append('productId', params.productId);
    if (params?.movementType) query.append('movementType', params.movementType);
    return request<any[]>(`/products/logs/movements?${query.toString()}`);
  },

  // Sales Challan
  getChallans: (params?: { page?: number; limit?: number; status?: string; customerId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.search) query.append('search', params.search);
    return request<any[]>(`/challans?${query.toString()}`);
  },
  getChallanById: (id: string) => request<any>(`/challans/${id}`),
  createChallan: (data: { customerId: string; status: 'Draft' | 'Confirmed'; notes?: string; items: { productId: string; quantity: number }[] }) =>
    request<any>('/challans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateChallanStatus: (id: string, status: 'Confirmed' | 'Cancelled') =>
    request<any>(`/challans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  downloadPdfUrl: (challanId: string) => `${API_BASE}/challans/${challanId}/pdf`,
};
