// Credit Intelligence — API Service Layer
import axios from 'axios';
import type {
  CreditApplicationInput,
  PredictionResponse,
  PredictionHistoryResponse,
  ModelMetricsResponse,
  FeatureImportanceResponse,
  AnalyticsResponse,
  HealthResponse,
  FairnessResponse,
  TrendResponse,
  ValidOptionsResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

export const api = {
  // ── Health ────────────────────────────────────────────────────────────
  getHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  },

  getModelInfo: async () => {
    const res = await apiClient.get('/model-info');
    return res.data;
  },

  // ── Predictions ───────────────────────────────────────────────────────
  predict: async (input: CreditApplicationInput): Promise<PredictionResponse> => {
    const res = await apiClient.post<PredictionResponse>('/predict', input);
    return res.data;
  },

  getValidOptions: async (): Promise<ValidOptionsResponse> => {
    const res = await apiClient.get<ValidOptionsResponse>('/valid-options');
    return res.data;
  },

  // ── History ────────────────────────────────────────────────────────────
  getPredictions: async (params?: {
    skip?: number;
    limit?: number;
    risk_level?: string;
  }): Promise<PredictionHistoryResponse> => {
    const res = await apiClient.get<PredictionHistoryResponse>('/predictions', { params });
    return res.data;
  },

  getPrediction: async (predictionId: string) => {
    const res = await apiClient.get(`/predictions/${predictionId}`);
    return res.data;
  },

  // ── Analytics ──────────────────────────────────────────────────────────
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const res = await apiClient.get<AnalyticsResponse>('/analytics');
    return res.data;
  },

  getModelMetrics: async (): Promise<ModelMetricsResponse> => {
    const res = await apiClient.get<ModelMetricsResponse>('/model-metrics');
    return res.data;
  },

  getFeatureImportance: async (): Promise<FeatureImportanceResponse> => {
    const res = await apiClient.get<FeatureImportanceResponse>('/feature-importance');
    return res.data;
  },

  getPredictionTrends: async (days = 30): Promise<TrendResponse> => {
    const res = await apiClient.get<TrendResponse>('/prediction-trends', { params: { days } });
    return res.data;
  },

  // ── Fairness ───────────────────────────────────────────────────────────
  getFairness: async (): Promise<FairnessResponse> => {
    const res = await apiClient.get<FairnessResponse>('/fairness');
    return res.data;
  },
};

export default api;
