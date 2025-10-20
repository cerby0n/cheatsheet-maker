/**
 * API client for communicating with the backend
 */
import axios from 'axios';
import { Cheatsheet, CheatsheetCreate, CheatsheetUpdate } from './types';

// Use relative URL for production (Docker/Nginx proxy) or absolute for development
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000/api'  // Development: direct connection
  : '/api';                       // Production: Nginx proxy

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cheatsheetApi = {
  // Get all cheatsheets
  getAll: async (): Promise<Cheatsheet[]> => {
    const response = await api.get<Cheatsheet[]>('/cheatsheets');
    return response.data;
  },

  // Get a single cheatsheet by ID
  getById: async (id: string): Promise<Cheatsheet> => {
    const response = await api.get<Cheatsheet>(`/cheatsheets/${id}`);
    return response.data;
  },

  // Create a new cheatsheet
  create: async (data: CheatsheetCreate): Promise<Cheatsheet> => {
    const response = await api.post<Cheatsheet>('/cheatsheets', data);
    return response.data;
  },

  // Update a cheatsheet
  update: async (id: string, data: CheatsheetUpdate): Promise<Cheatsheet> => {
    const response = await api.put<Cheatsheet>(`/cheatsheets/${id}`, data);
    return response.data;
  },

  // Delete a cheatsheet
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cheatsheets/${id}`);
  },

  // Export cheatsheet as markdown
  exportMarkdown: async (id: string): Promise<void> => {
    const url = `${API_BASE_URL}/cheatsheets/${id}/export`;
    window.open(url, '_blank');
  },

  // Export cheatsheet as JSON
  exportJson: async (id: string): Promise<void> => {
    const url = `${API_BASE_URL}/cheatsheets/${id}/export/json`;
    window.open(url, '_blank');
  },

  // Export all cheatsheets as JSON
  exportAllJson: async (): Promise<void> => {
    const url = `${API_BASE_URL}/cheatsheets/export/bulk`;
    window.open(url, '_blank');
  },

  // Search across all cheatsheets
  search: async (query: string): Promise<any[]> => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  },

  // Import cheatsheet from JSON
  importJson: async (jsonData: any): Promise<Cheatsheet> => {
    const response = await api.post<Cheatsheet>('/import/json', jsonData);
    return response.data;
  },

  // Import cheatsheet from Markdown
  importMarkdown: async (content: string, name: string): Promise<Cheatsheet> => {
    const response = await api.post<Cheatsheet>('/import/markdown', { content, name });
    return response.data;
  },

  // Bulk import cheatsheets
  importBulk: async (files: any[]): Promise<{ success: any[], failed: any[] }> => {
    const response = await api.post('/import/bulk', files);
    return response.data;
  },
};
