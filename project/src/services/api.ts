const API_BASE_URL = 'http://localhost:8000/api';

export class ApiClient {
  async getTransactions(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.is_mev !== undefined) params.append('is_mev', filters.is_mev);
    if (filters?.pattern) params.append('pattern', filters.pattern);
    if (filters?.min_profit !== undefined) params.append('min_profit', filters.min_profit);
    
    const response = await fetch(`${API_BASE_URL}/transactions?${params}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  }

  async getTransactionDetail(signature: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/transactions/${signature}`);
    if (!response.ok) throw new Error('Failed to fetch transaction detail');
    return response.json();
  }

  async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  }

  async startMonitoring(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/monitor/start`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to start monitoring');
  }

  async stopMonitoring(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/monitor/stop`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to stop monitoring');
  }
}

export const apiClient = new ApiClient();