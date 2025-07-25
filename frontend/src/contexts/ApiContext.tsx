import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthenticationProvider';
import {FirebaseAuthService} from 'shared';
import { initializeImageGenerationService } from '../lib/imageGeneration';

interface ApiContextType {
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>;
  apiUrl: string;
  setApiUrl: (url: string) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'http://localhost:3001');

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (authState.user) {
      const token = await FirebaseAuthService.getToken();
      console.log('API Context: Token obtained, length:', token?.length || 0);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.error('API Context: No token available');
      }
    } else {
      console.log('API Context: No authenticated user');
    }

    const response = await fetch(`${apiUrl}/${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('API Context: Request failed:', response.status, response.statusText);
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response;
  }, [authState.user, apiUrl]);

  // Initialize image generation service when fetchWithAuth is available
  useEffect(() => {
    initializeImageGenerationService(fetchWithAuth);
  }, [fetchWithAuth]);

  return (
    <ApiContext.Provider value={{ fetchWithAuth, apiUrl, setApiUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};