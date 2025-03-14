import type { AxiosInstance } from 'axios';
import type { RequestConfig, ResponseData, RequestError } from '../types';
import { ERROR_MESSAGES } from '../constants';

export function createRequestInstance(axiosInstance: AxiosInstance) {
  // 添加请求拦截器
  axiosInstance.interceptors.request.use(
    (config) => {
      const customConfig = config.customConfig;
      if (customConfig?.useToken && customConfig?.getToken) {
        const token = customConfig.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const handleResponse = async <T>(promise: Promise<ResponseData<T>>, errorToast = true): Promise<T> => {
    try {
      const response = await promise;
      if (response?.data?.code === 0 || response?.data?.code === 800) {
        return response.data?.data;
      }
      
      const error: RequestError = {
        code: response.code,
        msg: response.message || ERROR_MESSAGES.SERVER_ERROR,
        errorInfo: response
      };

      if (errorToast) {
        const customConfig = axiosInstance.defaults.customConfig;
        if (customConfig?.errorHandler) {
          customConfig.errorHandler(error.msg);
        } else {
          console.error(error.msg);
        }
      }

      return Promise.reject(error);
    } catch (err: any) {
      const error: RequestError = {
        code: err.code || -1,
        msg: err.message || ERROR_MESSAGES.SERVER_ERROR,
        errorInfo: err
      };

      if (errorToast) {
        console.error(error.msg);
      }

      return Promise.reject(error);
    }
  };

  return {
    request: <T>(config: RequestConfig) => {
      const { url, type = 'GET', params, data, ...restConfig } = config;
      
      switch (type.toUpperCase()) {
        case 'GET':
          return handleResponse<T>(axiosInstance.get(url, { ...restConfig, params }), config.errorToast);
        case 'POST':
          return handleResponse<T>(axiosInstance.post(url, data || params, restConfig), config.errorToast);
        case 'PUT':
          return handleResponse<T>(axiosInstance.put(url, data || params, restConfig), config.errorToast);
        case 'DELETE':
          return handleResponse<T>(axiosInstance.delete(url, { ...restConfig, params }), config.errorToast);
        default:
          return handleResponse<T>(axiosInstance.get(url, { ...restConfig, params }), config.errorToast);
      }
    },
    get: <T>(url: string, config?: RequestConfig) => {
      return handleResponse<T>(axiosInstance.get(url, config), config?.errorToast);
    },
    post: <T>(url: string, data?: any, config?: RequestConfig) => {
      return handleResponse<T>(axiosInstance.post(url, data, config), config?.errorToast);
    },
    put: <T>(url: string, data?: any, config?: RequestConfig) => {
      return handleResponse<T>(axiosInstance.put(url, data, config), config?.errorToast);
    },
    delete: <T>(url: string, config?: RequestConfig) => {
      return handleResponse<T>(axiosInstance.delete(url, config), config?.errorToast);
    }
  };
}