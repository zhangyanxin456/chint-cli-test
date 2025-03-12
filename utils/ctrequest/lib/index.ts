
import axios, { AxiosRequestConfig } from 'axios';
import { createRequestInstance } from '../core/fetch';
import type { RequestConfig, CustomConfig } from '../types';

interface CreateAxiosConfig extends AxiosRequestConfig {
  customConfig?: CustomConfig;
}

const createRequest = (config: CreateAxiosConfig = {}) => {
  const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    },
    ...config
  });

  return createRequestInstance(axiosInstance);
};

export { createRequest };
export type { RequestConfig, CreateAxiosConfig, CustomConfig };
export * from '../constants';