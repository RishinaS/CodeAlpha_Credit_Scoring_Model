# Model Card: Credit Intelligence Risk Predictor

## 1. Model Details
- **Developer**: Credit Intelligence Engineering Team
- **Model Date**: September 2026 (Demo Implementation)
- **Model Type**: Configurable Ensembles / Trees / Linear Models (Selected dynamically based on highest composite metric).
- **License**: MIT (Application code), UCI (Dataset)

## 2. Intended Use
- **Primary Use Case**: Educational demonstration of end-to-end ML deployment, Explainable AI (XAI), and frontend integration.
- **Intended Users**: Data scientists, software engineers, and hiring managers reviewing portfolio projects.
- **Out-of-Scope Use Cases**: **DO NOT** use this model for actual financial decision-making, loan approvals, or real-world credit scoring.

## 3. Training Data
- **Dataset**: German Credit Dataset (Available via UCI Machine Learning Repository / OpenML).
- **Size**: 1000 instances.
- **Features**: 20 attributes (7 numerical, 13 categorical) including age, credit amount, duration, checking status, and employment history.
- **Preprocessing**: 
  - Missing values imputed (median for numerical, mode for categorical).
  - Numerical features scaled (StandardScaler).
  - Categorical features One-Hot Encoded.

## 4. Evaluation Data
- **Split**: 80% Training (800 instances), 20% Testing (200 instances).
- **Strategy**: Stratified split to maintain the original target class distribution.

## 5. Metrics
The final model is selected based on a weighted composite score designed for credit risk contexts:
- **ROC-AUC (40%)**: Measures overall ability to distinguish classes.
- **F1 Score (35%)**: Balances precision and recall.
- **Recall (25%)**: Prioritized to minimize false negatives (failing to identify a bad credit risk).

## 6. Ethical Considerations & Limitations
- **Historical Bias**: The dataset originates from the 1970s/1990s in Germany. The patterns learned reflect historical socio-economic conditions and potential biases of that era.
- **Demographic Proxies**: Features like `personal_status` and `age` may act as proxies for protected classes. In a production environment, models must undergo strict regulatory auditing (e.g., Fair Lending laws, ECOA in the US).
- **Dataset Size**: 1000 records is sufficient for prototyping but severely inadequate for training robust, generalizable financial models.

## 7. Explainability
The model utilizes Feature Importance and SHAP (where compatible) to provide local explanations for individual predictions, highlighting the top factors pushing the risk score higher or lower.
