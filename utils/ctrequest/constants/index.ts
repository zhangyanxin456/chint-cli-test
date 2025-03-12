export const DEFAULT_CONFIG = {
  timeout: 5 * 60 * 1000,
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  },
  errorToast: true,
  customConfig: {
    useToken: true,
    tokenKey: 'token',
    tokenPrefix: 'Bearer'
  }
};

export const ERROR_MESSAGES = {
  SERVER_ERROR: '服务器异常，请稍后重试',
  NETWORK_ERROR: '网络异常，请检查网络连接',
  TIMEOUT_ERROR: '请求超时，请稍后重试'
};