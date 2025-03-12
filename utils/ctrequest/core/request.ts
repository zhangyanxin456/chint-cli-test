import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { RequestConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

export function createAxiosInstance(config: RequestConfig = {}): AxiosInstance {
  const instance = axios.create({
    ...DEFAULT_CONFIG,
    ...config
  });

  instance.interceptors.request.use(
    (config) => {
      const { customConfig } = config as RequestConfig;
      if (customConfig?.useToken) {
        const token = localStorage.getItem(customConfig.tokenKey || 'token');
        if (token) {
          config.headers.Authorization = `${customConfig.tokenPrefix || 'Bearer'} ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
}