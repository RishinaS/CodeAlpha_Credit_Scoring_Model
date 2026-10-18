# Machine Learning Methodology

This document outlines the data science workflow used to develop the predictive models for the Credit Intelligence platform.

## 1. Exploratory Data Analysis (EDA)
- **Distribution Analysis**: Assessed the skewness of numerical features like `credit_amount` and `age`.
- **Imbalance Detection**: Identified a ~70/30 class imbalance (Good vs. Bad credit).
- **Correlation**: Evaluated multi-collinearity among numerical features.

## 2. Feature Engineering
Derived new features to capture financial behavior more effectively:
- `credit_per_month`: `credit_amount / duration`. Captures the monthly burden.
- `installment_to_credit`: Ratio of installment commitment relative to the total loan size.
- `age_group`: Binned age into categorical life stages.

## 3. Preprocessing
Constructed a Scikit-Learn `ColumnTransformer` to ensure no data leakage between train and test sets:
- **Numerical Pipeline**: `SimpleImputer(median)` -> `StandardScaler()`
- **Categorical Pipeline**: `SimpleImputer(most_frequent)` -> `OneHotEncoder(handle_unknown='ignore')`

## 4. Model Training & Tuning
Trained multiple baseline models using `class_weight='balanced'` to counter the target imbalance:
1. Logistic Regression
2. Decision Tree Classifier
3. Random Forest Classifier
4. Gradient Boosting Classifier

Applied `RandomizedSearchCV` with 5-fold Stratified Cross Validation on the training set to find optimal hyperparameters for the best performing algorithm.

## 5. Selection Strategy
Selected the final model using a custom composite score:
`Score = 0.40 * ROC-AUC + 0.35 * F1 + 0.25 * Recall`

This strategy explicitly penalizes models that achieve high accuracy by simply predicting the majority class (Low Risk), which is a common pitfall in imbalanced credit datasets.
