const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return `http://${window.location.hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

const normalizeMongoObject = (obj: any): any => {
  if (!obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map(normalizeMongoObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const normalized = { ...obj };

    if (normalized._id) {
      normalized.id = normalized._id;
      delete normalized._id;
    }

    Object.keys(normalized).forEach(key => {
      if (typeof normalized[key] === 'object' && normalized[key] !== null) {
        normalized[key] = normalizeMongoObject(normalized[key]);
      }
    });

    return normalized;
  }

  return obj;
};

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

interface PaginationResponse<T> {
  items?: T[];
  users?: T[];
  advances?: T[];
  collections?: T[];
  helpers?: T[],
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

class ApiError extends Error {
  public status: number;
  public response?: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let responseData: any = {};

    try {
      responseData = await response.json();
    } catch (error) {
      throw new ApiError(
        'Invalid response format',
        response.status || 0,
        { originalError: error }
      );
    }

    if (!response.ok) {
      if (response.status === 403 && responseData.message === 'Access denied. Admin or user role required.') {
        const { authService } = await import('./auth');
        const { eventBus, EVENTS } = await import('./eventBus');

        eventBus.emit(EVENTS.USER_ACCESS_DENIED, {
          message: responseData.message,
          status: response.status,
          timestamp: new Date().toISOString()
        });

        authService.forceLogout();

        throw new ApiError(
          'Your access has been revoked. Please contact an administrator for reactivation.',
          response.status,
          { ...responseData, accessDenied: true }
        );
      }

      if (response.status === 400 && responseData.errors) {
        throw new ApiError(
          responseData.message || 'Validation failed',
          response.status,
          { ...responseData, validationErrors: responseData.errors }
        );
      }

      throw new ApiError(
        responseData.message || 'An error occurred',
        response.status,
        responseData
      );
    }

    const normalizedData = normalizeMongoObject(responseData);
    return normalizedData;
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log('API GET request to:', `${API_BASE_URL}${endpoint}`);
    console.log('Headers:', this.getAuthHeaders());
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    console.log('Response status:', response.status);
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    });
    return this.handleResponse<T>(response);
  }

  async login(username: string, password: string) {
    const response = await this.post<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      username,
      password
    });

    if (response.data?.token) {
      localStorage.setItem('auth-token', response.data.token);
    }

    return response;
  }

  async logout() {
    localStorage.removeItem('auth-token');
    return this.post<ApiResponse>('/auth/logout', {});
  }

  async getCurrentUser() {
    return this.get<ApiResponse<{ user: any }>>('/auth/me');
  }

  async getUsers(params?: { search?: string; page?: number; limit?: number }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<PaginationResponse<any>>>(`/users${queryString}`);
  }

  async getUserById(id: string) {
    return this.get<ApiResponse<{ user: any }>>(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.post<ApiResponse<{ user: any }>>('/users', userData);
  }

  async updateUser(id: string, userData: any) {
    return this.put<ApiResponse<{ user: any }>>(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete<ApiResponse>(`/users/${id}`);
  }

  async getUserStats(id: string) {
    return this.get<ApiResponse<any>>(`/users/${id}/stats`);
  }

  async deactivateUser(id: string, reason?: string) {
    return this.patch<ApiResponse<{ user: any }>>(`/users/${id}/deactivate`, { reason });
  }

  async reactivateUser(id: string) {
    return this.patch<ApiResponse<{ user: any }>>(`/users/${id}/reactivate`);
  }

  async getUserActivationStatus(id: string) {
    return this.get<ApiResponse<{ isActive: boolean; deactivatedAt?: string; deactivationReason?: string }>>(`/users/${id}/activation-status`);
  }

  async getCollections(params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<PaginationResponse<any>>>(`/collections${queryString}`);
  }

  async getCollectionById(id: string) {
    return this.get<ApiResponse<{ collection: any }>>(`/collections/${id}`);
  }

  async createCollection(collectionData: any) {
    return this.post<ApiResponse<{ collection: any }>>('/collections', collectionData);
  }

  async updateCollection(id: string, collectionData: any) {
    return this.put<ApiResponse<{ collection: any }>>(`/collections/${id}`, collectionData);
  }

  async deleteCollection(id: string) {
    return this.delete<ApiResponse>(`/collections/${id}`);
  }

  async getCollectionsSummary(params?: { startDate?: string; endDate?: string; userId?: string }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<{ summary: any }>>(`/collections/summary${queryString}`);
  }

  async getAdvances(params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<PaginationResponse<any>>>(`/advances${queryString}`);
  }

  async getAdvanceById(id: string) {
    return this.get<ApiResponse<{ advance: any }>>(`/advances/${id}`);
  }

  async createAdvance(advanceData: any) {
    return this.post<ApiResponse<{ advance: any }>>('/advances', advanceData);
  }

  async updateAdvance(id: string, advanceData: any) {
    return this.put<ApiResponse<{ advance: any }>>(`/advances/${id}`, advanceData);
  }

  async deleteAdvance(id: string) {
    return this.delete<ApiResponse>(`/advances/${id}`);
  }

  async getAdvancesSummary(params?: { startDate?: string; endDate?: string; userId?: string }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<{ summary: any }>>(`/advances/summary${queryString}`);
  }

  async getFatRates() {
    return this.get<ApiResponse<{ fatRates: any[] }>>('/fat-rates');
  }

  async getFatRateById(id: string) {
    return this.get<ApiResponse<{ fatRate: any }>>(`/fat-rates/${id}`);
  }

  async createFatRate(fatRateData: any) {
    return this.post<ApiResponse<{ fatRate: any }>>('/fat-rates', fatRateData);
  }

  async updateFatRate(id: string, fatRateData: any) {
    return this.put<ApiResponse<{ fatRate: any }>>(`/fat-rates/${id}`, fatRateData);
  }

  async deleteFatRate(id: string) {
    return this.delete<ApiResponse>(`/fat-rates/${id}`);
  }

  async bulkUpdateFatRates(fatRates: any[]) {
    return this.put<ApiResponse<{ fatRates: any[] }>>('/fat-rates/bulk', { fatRates });
  }

  async getHelpers(params?: { page?: number; limit?: number }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    return this.get<ApiResponse<PaginationResponse<any>>>(`/helpers${queryString}`);
  }

  async getHelperById(id: string) {
    return this.get<ApiResponse<{ helper: any }>>(`/helpers/${id}`);
  }

  async createHelper(helperData: any) {
    return this.post<ApiResponse<{ helper: any }>>('/helpers', helperData);
  }

  async updateHelper(id: string, helperData: any) {
    return this.put<ApiResponse<{ helper: any }>>(`/helpers/${id}`, helperData);
  }

  async deleteHelper(id: string) {
    return this.delete<ApiResponse>(`/helpers/${id}`);
  }

  async extendHelperPassword(id: string) {
    return this.patch<ApiResponse<{ helper: any; newExpiryDate: string }>>(`/helpers/${id}/extend-password`);
  }

  async toggleHelperStatus(id: string) {
    return this.patch<ApiResponse<{ helper: any }>>(`/helpers/${id}/toggle-status`);
  }

  // Health check
  async healthCheck() {
    return this.get<ApiResponse>('/health');
  }
}

export const apiService = new ApiService();
export { ApiError };
export type { ApiResponse, PaginationResponse };