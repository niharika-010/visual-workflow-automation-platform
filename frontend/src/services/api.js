import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Axios request interceptor automatically attaches Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('workflow_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('workflow_auth_token')) {
        localStorage.removeItem('workflow_auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// Health Check API
export const fetchHealthStatus = async (includeDetails = true) => {
  try {
    const response = await apiClient.get('/health', {
      params: { details: includeDetails },
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Backend API is unreachable',
    };
  }
};

// Auth API Endpoints
export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const fetchMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// Workflow CRUD API Endpoints (Phase 3 & 4)
export const fetchWorkflowsApi = async () => {
  const response = await apiClient.get('/workflows');
  return response.data;
};

export const fetchWorkflowByIdApi = async (id) => {
  const response = await apiClient.get(`/workflows/${id}`);
  return response.data;
};

export const createWorkflowApi = async (workflowData) => {
  const response = await apiClient.post('/workflows', workflowData);
  return response.data;
};

export const updateWorkflowApi = async (id, workflowData) => {
  const response = await apiClient.put(`/workflows/${id}`, workflowData);
  return response.data;
};

export const deleteWorkflowApi = async (id) => {
  const response = await apiClient.delete(`/workflows/${id}`);
  return response.data;
};

export const activateWorkflowApi = async (id) => {
  const response = await apiClient.post(`/workflows/${id}/activate`);
  return response.data;
};

export const deactivateWorkflowApi = async (id) => {
  const response = await apiClient.post(`/workflows/${id}/deactivate`);
  return response.data;
};

// Versioning API Endpoints (Phase 6)
export const fetchWorkflowVersionsApi = async (id) => {
  const response = await apiClient.get(`/workflows/${id}/versions`);
  return response.data;
};

export const restoreWorkflowVersionApi = async (id, versionId) => {
  const response = await apiClient.post(`/workflows/${id}/versions/${versionId}/restore`);
  return response.data;
};
