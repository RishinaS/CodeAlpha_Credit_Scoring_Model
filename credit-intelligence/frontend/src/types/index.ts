// Credit Intelligence — TypeScript Type Definitions

export interface CreditApplicationInput {
  duration: number;
  credit_amount: number;
  installment_commitment: number;
  residence_since: number;
  age: number;
  existing_credits: number;
  num_dependents: number;
  checking_status: string;
  credit_history: string;
  purpose: string;
  savings_status: string;
  employment: string;
  personal_status: string;
  other_parties: string;
  property_magnitude: string;
  other_payment_plans: string;
  housing: string;
  job: string;
  own_telephone: string;
  foreign_worker: string;
}

export interface RiskFactor {
  feature: string;
  shap_value?: number;
  importance?: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface Explanation {
  method: string;
  increasing_risk_factors: RiskFactor[];
  decreasing_risk_factors: RiskFactor[];
  top_factors: Array<[string, number] | { feature: string; importance: number }>;
  note?: string;
  error?: string;
}

export interface PredictionResponse {
  prediction_id: string;
  timestamp: string;
  risk_level: 'Low Risk' | 'Medium Risk' | 'High Risk';
  risk_band: 'Low' | 'Medium' | 'High';
  risk_score: number;
  probability_low_risk: number;
  probability_high_risk: number;
  confidence: number;
  model_version: string;
  algorithm: string;
  explanation: Explanation;
  disclaimer: string;
}

export interface PredictionHistoryItem {
  id: number;
  prediction_id: string;
  risk_level: string;
  risk_score: number;
  probability_low_risk: number;
  probability_high_risk: number;
  confidence: number;
  model_version: string;
  algorithm: string;
  timestamp: string;
  age?: number;
  credit_amount?: number;
  duration?: number;
  purpose?: string;
}

export interface PredictionHistoryResponse {
  total: number;
  skip: number;
  limit: number;
  predictions: PredictionHistoryItem[];
}

export interface ModelMetrics {
  key: string;
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  cv_f1_mean?: number;
  cv_f1_std?: number;
  training_time_seconds?: number;
  confusion_matrix?: number[][];
  is_best: boolean;
}

export interface ModelMetricsResponse {
  models: ModelMetrics[];
  best_model: string;
  selection_rationale: string;
  composite_scores: Record<string, number>;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  method: string;
  top_features: FeatureImportanceItem[];
  all_importance: Record<string, number>;
  engineered_features: Record<string, {
    formula: string;
    interpretation: string;
    reason: string;
  }>;
  note: string;
}

export interface AnalyticsResponse {
  total_predictions: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  low_risk_percentage: number;
  medium_risk_percentage: number;
  high_risk_percentage: number;
  average_risk_score: number;
  model_version: string;
  algorithm: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  model_loaded: boolean;
  model_version: string;
  service: string;
  api_version: string;
}

export interface FairnessGroup {
  group: string;
  n_samples: number;
  accuracy: number;
  predicted_high_risk_rate: number;
}

export interface FairnessResponse {
  disclaimer: string;
  responsible_ai_notice: string;
  dataset: string;
  dataset_note: string;
  groups: FairnessGroup[];
  data_quality_notes: string[];
  limitations: string[];
  ethical_considerations: string[];
  overall_model_accuracy?: number;
}

export interface TrendDataPoint {
  date: string;
  low_risk: number;
  medium_risk: number;
  high_risk: number;
  total: number;
}

export interface TrendResponse {
  days: number;
  data: TrendDataPoint[];
  total_in_period: number;
}

export interface ValidOptionsResponse {
  checking_status: string[];
  credit_history: string[];
  purpose: string[];
  savings_status: string[];
  employment: string[];
  personal_status: string[];
  other_parties: string[];
  property_magnitude: string[];
  other_payment_plans: string[];
  housing: string[];
  job: string[];
  own_telephone: string[];
  foreign_worker: string[];
}

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';
