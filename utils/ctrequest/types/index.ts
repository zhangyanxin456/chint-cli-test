import type { AxiosRequestConfig } from 'axios';

export interface CustomConfig {
  useToken?: boolean;
  tokenKey?: string;
  tokenPrefix?: string;
  getToken?: () => Promise<string> | string;
  errorHandler?: (error: string) => void;
}

export interface RequestConfig extends AxiosRequestConfig {
  url: string;
  type?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, unknown>;
  data?: Record<string, unknown>;
  errorToast?: boolean;
  customConfig?: CustomConfig
}

export interface ResponseData<T = any> {
  code: number | string;
  message: string;
  data: T;
  [key: string]: any;
}

export interface RequestError {
  code: number | string;
  msg: string;
  errorInfo?: any;
}

export interface RequestInstance {
  request: <T = any>(config: RequestConfig) => Promise<T>;
  get: <T = any>(url: string, config?: RequestConfig) => Promise<T>;
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>;
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<T>;
}