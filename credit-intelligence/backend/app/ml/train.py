"""
Credit Intelligence - ML Training Pipeline
==========================================
Dataset: German Credit Dataset (UCI)
Models: Logistic Regression, Decision Tree, Random Forest, Gradient Boosting
"""

import os
import json
import time
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

import joblib
from sklearn.datasets import fetch_openml
from sklearn.model_selection import (
    train_test_split, StratifiedKFold, RandomizedSearchCV, cross_val_score
)
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    average_precision_score
)
import shap

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)
(DATA_DIR / "raw").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "processed").mkdir(parents=True, exist_ok=True)

print("=" * 70)
print("CREDIT INTELLIGENCE — ML TRAINING PIPELINE")
print("=" * 70)

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: LOAD DATASET
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 1] Loading German Credit Dataset...")

dataset = fetch_openml(name="credit-g", version=1, as_frame=True, parser="auto")
df_raw = dataset.frame.copy()

print(f"  Shape: {df_raw.shape}")
print(f"  Columns: {list(df_raw.columns)}")
print(f"  Target column: class")
print(f"  Target distribution:\n{df_raw['class'].value_counts()}")

# Save raw data
df_raw.to_csv(DATA_DIR / "raw" / "german_credit_raw.csv", index=False)
print(f"  Raw data saved to data/raw/german_credit_raw.csv")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: EXPLORATORY DATA ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 2] Exploratory Data Analysis...")

# Identify feature types
target_col = "class"
feature_cols = [c for c in df_raw.columns if c != target_col]

# Separate numerical and categorical
numerical_features = df_raw[feature_cols].select_dtypes(include=["number"]).columns.tolist()
categorical_features = df_raw[feature_cols].select_dtypes(exclude=["number"]).columns.tolist()

print(f"  Numerical features ({len(numerical_features)}): {numerical_features}")
print(f"  Categorical features ({len(categorical_features)}): {categorical_features}")

# Missing values
missing = df_raw[feature_cols].isnull().sum()
missing_pct = (missing / len(df_raw) * 100).round(2)
print(f"\n  Missing values:")
print(missing[missing > 0] if missing.sum() > 0 else "  No missing values detected.")

# Duplicates
dups = df_raw.duplicated().sum()
print(f"\n  Duplicate rows: {dups}")

# Class distribution
class_counts = df_raw[target_col].value_counts()
print(f"\n  Class distribution:\n{class_counts}")
imbalance_ratio = class_counts.max() / class_counts.min()
print(f"  Imbalance ratio: {imbalance_ratio:.2f}")

# Encode target: 'good' -> 0 (Low Risk), 'bad' -> 1 (High Risk)
df = df_raw.copy()
df["target"] = (df[target_col] == "bad").astype(int)
print(f"\n  Target encoding: 'good'->0 (Low Risk), 'bad'->1 (High Risk)")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 3] Feature Engineering...")

# German credit dataset feature names mapping (openml version)
# Key available numerical features: duration, credit_amount, installment_commitment,
# residence_since, age, existing_credits, num_dependents
# Key categorical features: checking_status, credit_history, purpose, savings_status,
# employment, personal_status, other_parties, property_magnitude, other_payment_plans,
# housing, job, own_telephone, foreign_worker

# Engineered features
# 1. Credit-to-Duration Ratio (monthly credit burden)
if "credit_amount" in df.columns and "duration" in df.columns:
    df["credit_per_month"] = df["credit_amount"] / df["duration"].clip(lower=1)
    print("  Created: credit_per_month = credit_amount / duration")

# 2. Age-to-Employment Ratio (financial maturity indicator)
if "age" in df.columns:
    df["age_group"] = pd.cut(df["age"], bins=[0, 25, 35, 50, 100],
                              labels=["young", "young_adult", "middle_aged", "senior"])
    print("  Created: age_group (binned age)")

# 3. Installment burden relative to credit amount
if "installment_commitment" in df.columns and "credit_amount" in df.columns:
    df["installment_to_credit"] = df["installment_commitment"] / df["credit_amount"].clip(lower=1) * 1000
    print("  Created: installment_to_credit = installment_commitment / credit_amount * 1000")

# Define final feature list
eng_numerical = []
eng_categorical = []

if "credit_per_month" in df.columns:
    eng_numerical.append("credit_per_month")
if "installment_to_credit" in df.columns:
    eng_numerical.append("installment_to_credit")
if "age_group" in df.columns:
    eng_categorical.append("age_group")

all_numerical = numerical_features + eng_numerical
all_categorical = categorical_features + eng_categorical

# Remove target column from feature lists
all_numerical = [c for c in all_numerical if c != target_col and c in df.columns]
all_categorical = [c for c in all_categorical if c != target_col and c in df.columns]

print(f"\n  Final numerical features ({len(all_numerical)}): {all_numerical}")
print(f"  Final categorical features ({len(all_categorical)}): {all_categorical}")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4: PREPROCESSING PIPELINE
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 4] Building Preprocessing Pipeline...")

# Convert age_group to string for proper OHE if it's categorical
if "age_group" in df.columns:
    df["age_group"] = df["age_group"].astype(str)

X = df[all_numerical + all_categorical].copy()
y = df["target"].copy()

print(f"  Feature matrix shape: {X.shape}")
print(f"  Class balance: {y.value_counts().to_dict()}")

# Train / Test split (stratified)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

# Numerical pipeline: impute then scale
numerical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

# Categorical pipeline: impute then OHE
categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
])

preprocessor = ColumnTransformer([
    ("num", numerical_pipeline, all_numerical),
    ("cat", categorical_pipeline, all_categorical),
])

# Fit preprocessor on training data
preprocessor.fit(X_train)

# Get feature names after transformation
ohe_cats = preprocessor.named_transformers_["cat"]["encoder"].get_feature_names_out(all_categorical)
transformed_feature_names = all_numerical + list(ohe_cats)
print(f"  Transformed feature count: {len(transformed_feature_names)}")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 5: MODEL TRAINING & EVALUATION
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 5] Training and Evaluating Models...")

def evaluate_model(name, model_pipeline, X_tr, y_tr, X_te, y_te):
    """Train and evaluate a model pipeline, return metrics dict."""
    start_time = time.time()
    model_pipeline.fit(X_tr, y_tr)
    train_time = time.time() - start_time

    y_pred = model_pipeline.predict(X_te)
    y_prob = model_pipeline.predict_proba(X_te)[:, 1]

    acc = accuracy_score(y_te, y_pred)
    prec = precision_score(y_te, y_pred, zero_division=0)
    rec = recall_score(y_te, y_pred, zero_division=0)
    f1 = f1_score(y_te, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_te, y_prob)
    pr_auc = average_precision_score(y_te, y_prob)
    cm = confusion_matrix(y_te, y_pred).tolist()

    # Cross-validation F1
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_f1 = cross_val_score(model_pipeline, X_tr, y_tr, cv=cv, scoring="f1", n_jobs=-1)

    metrics = {
        "name": name,
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "cv_f1_mean": round(float(cv_f1.mean()), 4),
        "cv_f1_std": round(float(cv_f1.std()), 4),
        "confusion_matrix": cm,
        "training_time_seconds": round(train_time, 3),
    }

    print(f"\n  [{name}]")
    print(f"    Accuracy:  {acc:.4f}")
    print(f"    Precision: {prec:.4f}")
    print(f"    Recall:    {rec:.4f}")
    print(f"    F1:        {f1:.4f}")
    print(f"    ROC-AUC:   {roc_auc:.4f}")
    print(f"    PR-AUC:    {pr_auc:.4f}")
    print(f"    CV-F1:     {cv_f1.mean():.4f} ± {cv_f1.std():.4f}")
    print(f"    Train time: {train_time:.2f}s")

    return metrics, model_pipeline

all_metrics = {}
trained_models = {}

# ── Model 1: Logistic Regression ──────────────────────────────────────────
lr_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
        C=1.0,
        solver="lbfgs"
    ))
])
metrics_lr, trained_lr = evaluate_model(
    "Logistic Regression", lr_pipeline, X_train, y_train, X_test, y_test
)
all_metrics["logistic_regression"] = metrics_lr
trained_models["logistic_regression"] = trained_lr

# ── Model 2: Decision Tree ────────────────────────────────────────────────
dt_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", DecisionTreeClassifier(
        class_weight="balanced",
        random_state=42,
        max_depth=6,
        min_samples_split=10,
        min_samples_leaf=5,
    ))
])
metrics_dt, trained_dt = evaluate_model(
    "Decision Tree", dt_pipeline, X_train, y_train, X_test, y_test
)
all_metrics["decision_tree"] = metrics_dt
trained_models["decision_tree"] = trained_dt

# ── Model 3: Random Forest ────────────────────────────────────────────────
rf_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=42,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        n_jobs=-1,
    ))
])
metrics_rf, trained_rf = evaluate_model(
    "Random Forest", rf_pipeline, X_train, y_train, X_test, y_test
)
all_metrics["random_forest"] = metrics_rf
trained_models["random_forest"] = trained_rf

# ── Model 4: Gradient Boosting ────────────────────────────────────────────
gb_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=4,
        subsample=0.8,
        random_state=42,
    ))
])
metrics_gb, trained_gb = evaluate_model(
    "Gradient Boosting", gb_pipeline, X_train, y_train, X_test, y_test
)
all_metrics["gradient_boosting"] = metrics_gb
trained_models["gradient_boosting"] = trained_gb

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 6: MODEL SELECTION
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 6] Model Selection...")

# Defensible selection: weighted composite score
# Priority: ROC-AUC (40%) + F1 (35%) + Recall (25%)
# Reason: credit risk → false negatives (missing bad creditors) are costly
def composite_score(m):
    return 0.40 * m["roc_auc"] + 0.35 * m["f1_score"] + 0.25 * m["recall"]

scores = {k: composite_score(v) for k, v in all_metrics.items()}
best_model_key = max(scores, key=scores.get)
print(f"\n  Composite scores: {scores}")
print(f"  Best model: {best_model_key} (score: {scores[best_model_key]:.4f})")
print(f"  Selection rationale: Weighted composite (ROC-AUC 40% + F1 35% + Recall 25%)")
print(f"  Credit-risk context: Recall is prioritized to minimize missed high-risk applicants.")

best_pipeline = trained_models[best_model_key]
best_metrics = all_metrics[best_model_key]

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 7: HYPERPARAMETER OPTIMIZATION FOR BEST MODEL
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n[PHASE 7] Hyperparameter Optimization for {best_model_key}...")

if best_model_key == "random_forest":
    param_dist = {
        "classifier__n_estimators": [100, 200, 300],
        "classifier__max_depth": [6, 8, 10, 12, None],
        "classifier__min_samples_split": [2, 5, 10],
        "classifier__min_samples_leaf": [1, 2, 4],
    }
    search_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            class_weight="balanced", random_state=42, n_jobs=-1
        ))
    ])
elif best_model_key == "gradient_boosting":
    param_dist = {
        "classifier__n_estimators": [100, 150, 200],
        "classifier__learning_rate": [0.05, 0.1, 0.15],
        "classifier__max_depth": [3, 4, 5],
        "classifier__subsample": [0.7, 0.8, 0.9],
    }
    search_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", GradientBoostingClassifier(random_state=42))
    ])
elif best_model_key == "logistic_regression":
    param_dist = {
        "classifier__C": [0.01, 0.1, 0.5, 1.0, 5.0, 10.0],
        "classifier__solver": ["lbfgs", "liblinear"],
    }
    search_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            class_weight="balanced", max_iter=1000, random_state=42
        ))
    ])
else:
    param_dist = {
        "classifier__max_depth": [3, 5, 6, 8, 10, None],
        "classifier__min_samples_split": [2, 5, 10, 20],
        "classifier__min_samples_leaf": [1, 2, 4, 8],
    }
    search_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", DecisionTreeClassifier(
            class_weight="balanced", random_state=42
        ))
    ])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
search = RandomizedSearchCV(
    search_pipeline,
    param_distributions=param_dist,
    n_iter=20,
    cv=cv,
    scoring="roc_auc",
    random_state=42,
    n_jobs=-1,
    verbose=0,
)
search.fit(X_train, y_train)
print(f"  Best hyperparameters: {search.best_params_}")
print(f"  Best CV ROC-AUC: {search.best_score_:.4f}")

# Evaluate tuned model on test set
tuned_pipeline = search.best_estimator_
y_pred_tuned = tuned_pipeline.predict(X_test)
y_prob_tuned = tuned_pipeline.predict_proba(X_test)[:, 1]

tuned_metrics = {
    "accuracy": round(float(accuracy_score(y_test, y_pred_tuned)), 4),
    "precision": round(float(precision_score(y_test, y_pred_tuned, zero_division=0)), 4),
    "recall": round(float(recall_score(y_test, y_pred_tuned, zero_division=0)), 4),
    "f1_score": round(float(f1_score(y_test, y_pred_tuned, zero_division=0)), 4),
    "roc_auc": round(float(roc_auc_score(y_test, y_prob_tuned)), 4),
    "pr_auc": round(float(average_precision_score(y_test, y_prob_tuned)), 4),
    "confusion_matrix": confusion_matrix(y_test, y_pred_tuned).tolist(),
}

if composite_score(tuned_metrics) > composite_score(best_metrics):
    print(f"  Tuned model is BETTER. Using tuned version.")
    best_pipeline = tuned_pipeline
    all_metrics[best_model_key + "_tuned"] = {**tuned_metrics, "name": f"{best_model_key} (Tuned)"}
    best_metrics = tuned_metrics
else:
    print(f"  Original model is better or equal. Keeping original.")

print(f"  Final best model — Accuracy: {best_metrics['accuracy']:.4f}, ROC-AUC: {best_metrics['roc_auc']:.4f}, F1: {best_metrics['f1_score']:.4f}")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 8: EXPLAINABLE AI — SHAP
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 8] Computing SHAP Explainability...")

# Transform test data for SHAP
X_test_transformed = best_pipeline.named_steps["preprocessor"].transform(X_test)

try:
    classifier_step = best_pipeline.named_steps["classifier"]
    explainer = shap.TreeExplainer(classifier_step)
    shap_values = explainer.shap_values(X_test_transformed)

    # For binary, shap_values may be [class0, class1] or just class1
    if isinstance(shap_values, list):
        sv = shap_values[1]  # positive class (high risk)
    else:
        sv = shap_values

    # Mean absolute SHAP values per feature
    mean_shap = np.abs(sv).mean(axis=0)
    feature_importance = dict(zip(transformed_feature_names[:len(mean_shap)], mean_shap.tolist()))
    feature_importance_sorted = dict(
        sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    )
    print(f"  SHAP computed. Top features: {list(feature_importance_sorted.keys())[:10]}")
    shap_available = True
except Exception as e:
    print(f"  TreeExplainer failed ({e}). Falling back to linear explainer...")
    try:
        classifier_step = best_pipeline.named_steps["classifier"]
        explainer = shap.LinearExplainer(classifier_step, X_test_transformed)
        shap_values = explainer.shap_values(X_test_transformed)
        if isinstance(shap_values, list):
            sv = shap_values[1]
        else:
            sv = shap_values
        mean_shap = np.abs(sv).mean(axis=0)
        feature_importance = dict(zip(transformed_feature_names[:len(mean_shap)], mean_shap.tolist()))
        feature_importance_sorted = dict(
            sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        )
        print(f"  Linear SHAP computed.")
        shap_available = True
    except Exception as e2:
        print(f"  SHAP failed ({e2}). Using permutation importance instead.")
        from sklearn.inspection import permutation_importance
        result = permutation_importance(
            best_pipeline, X_test, y_test, n_repeats=10, random_state=42, scoring="roc_auc"
        )
        feature_importance = dict(zip(
            all_numerical + all_categorical,
            result.importances_mean.tolist()
        ))
        feature_importance_sorted = dict(
            sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)
        )
        shap_available = False

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 9: FAIRNESS ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 9] Fairness Analysis...")

fairness_results = {}

# Age group fairness
if "age" in X_test.columns:
    X_test_copy = X_test.copy()
    X_test_copy["y_true"] = y_test.values
    X_test_copy["y_pred"] = best_pipeline.predict(X_test)
    X_test_copy["y_prob"] = best_pipeline.predict_proba(X_test)[:, 1]

    X_test_copy["age_group_fair"] = pd.cut(
        X_test_copy["age"], bins=[0, 30, 50, 100],
        labels=["young (<30)", "middle (30-50)", "senior (50+)"]
    )

    for group in X_test_copy["age_group_fair"].unique():
        grp_data = X_test_copy[X_test_copy["age_group_fair"] == group]
        if len(grp_data) < 5:
            continue
        grp_acc = accuracy_score(grp_data["y_true"], grp_data["y_pred"])
        grp_pos_rate = grp_data["y_pred"].mean()
        fairness_results[f"age_{str(group)}"] = {
            "group": str(group),
            "n_samples": int(len(grp_data)),
            "accuracy": round(float(grp_acc), 4),
            "predicted_high_risk_rate": round(float(grp_pos_rate), 4),
        }
    print(f"  Age group fairness: {fairness_results}")

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 10: SAVE ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[PHASE 10] Saving Model Artifacts...")

# Save best pipeline (preprocessor + classifier)
model_path = MODELS_DIR / "credit_model.joblib"
joblib.dump(best_pipeline, model_path)
print(f"  Saved: {model_path}")

# Save preprocessor separately for inference
preprocessor_path = MODELS_DIR / "preprocessing_pipeline.joblib"
joblib.dump(best_pipeline.named_steps["preprocessor"], preprocessor_path)
print(f"  Saved: {preprocessor_path}")

# Model version
model_version = {
    "version": "credit-risk-v1.0",
    "algorithm": best_model_key,
    "dataset": "German Credit Dataset (UCI / OpenML credit-g v1)",
    "dataset_size": len(df),
    "training_size": len(X_train),
    "test_size": len(X_test),
    "training_timestamp": datetime.now().isoformat(),
    "features_numerical": all_numerical,
    "features_categorical": all_categorical,
    "engineered_features": ["credit_per_month", "age_group", "installment_to_credit"],
    "target_encoding": {"0": "Low Risk (good credit)", "1": "High Risk (bad credit)"},
    "risk_score_formula": "risk_score = round(predicted_probability_of_high_risk * 100)",
    "class_imbalance_handling": "class_weight=balanced, stratified_split",
    "selection_rationale": "Weighted composite: ROC-AUC(40%) + F1(35%) + Recall(25%)",
    "shap_available": shap_available,
}
with open(MODELS_DIR / "model_version.json", "w") as f:
    json.dump(model_version, f, indent=2)
print(f"  Saved: models/model_version.json")

# All model metrics
all_metrics_combined = {k: v for k, v in all_metrics.items()}
all_metrics_combined["best_model"] = best_model_key
all_metrics_combined["selection_composite_scores"] = scores

with open(MODELS_DIR / "model_metrics.json", "w") as f:
    json.dump(all_metrics_combined, f, indent=2)
print(f"  Saved: models/model_metrics.json")

# Feature metadata
top_features = list(feature_importance_sorted.items())[:20]
feature_metadata = {
    "all_numerical": all_numerical,
    "all_categorical": all_categorical,
    "transformed_features": transformed_feature_names[:50],
    "feature_importance": {k: round(float(v), 6) for k, v in feature_importance_sorted.items()},
    "top_10_features": [{"feature": k, "importance": round(float(v), 6)} for k, v in top_features[:10]],
    "engineered_feature_descriptions": {
        "credit_per_month": {
            "formula": "credit_amount / duration",
            "interpretation": "Monthly credit burden in currency units",
            "reason": "Higher monthly burden relative to income increases default risk"
        },
        "age_group": {
            "formula": "pd.cut(age, bins=[0,25,35,50,100])",
            "interpretation": "Life stage group of applicant",
            "reason": "Age-based financial stability patterns"
        },
        "installment_to_credit": {
            "formula": "installment_commitment / credit_amount * 1000",
            "interpretation": "Installment commitment relative to credit amount",
            "reason": "Higher ratio indicates proportionally heavy payment obligation"
        }
    },
    "shap_method": "TreeExplainer" if shap_available else "PermutationImportance",
}
with open(MODELS_DIR / "feature_metadata.json", "w") as f:
    json.dump(feature_metadata, f, indent=2)
print(f"  Saved: models/feature_metadata.json")

# Fairness results
with open(MODELS_DIR / "fairness_analysis.json", "w") as f:
    json.dump(fairness_results, f, indent=2)
print(f"  Saved: models/fairness_analysis.json")

# Save test data sample for demo
demo_samples = []
for label, target_label, idx_list in [("low_risk", 0, y_test[y_test == 0].index[:2]),
                                        ("high_risk", 1, y_test[y_test == 1].index[:2])]:
    for idx in idx_list:
        sample = X_test.loc[idx].to_dict()
        demo_samples.append({
            "label": label,
            "target": int(target_label),
            "features": {k: (int(v) if isinstance(v, (np.integer,)) else
                           float(v) if isinstance(v, (np.floating,)) else str(v))
                        for k, v in sample.items()}
        })

with open(DATA_DIR / "processed" / "demo_samples.json", "w") as f:
    json.dump(demo_samples, f, indent=2)
print(f"  Saved: data/processed/demo_samples.json")

# ─────────────────────────────────────────────────────────────────────────────
# FINAL SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("TRAINING COMPLETE — MODEL COMPARISON")
print("=" * 70)
print(f"{'Model':<30} {'Accuracy':>9} {'Precision':>10} {'Recall':>8} {'F1':>8} {'ROC-AUC':>9} {'PR-AUC':>8}")
print("-" * 90)
for k, m in all_metrics.items():
    if k not in ["best_model", "selection_composite_scores"]:
        name = m.get("name", k)[:28]
        print(f"{name:<30} {m['accuracy']:>9.4f} {m['precision']:>10.4f} {m['recall']:>8.4f} {m['f1_score']:>8.4f} {m['roc_auc']:>9.4f} {m['pr_auc']:>8.4f}")

print(f"\n[OK] Best Model: {best_model_key}")
print(f"  Accuracy:  {best_metrics['accuracy']:.4f}")
print(f"  Precision: {best_metrics['precision']:.4f}")
print(f"  Recall:    {best_metrics['recall']:.4f}")
print(f"  F1:        {best_metrics['f1_score']:.4f}")
print(f"  ROC-AUC:   {best_metrics['roc_auc']:.4f}")
print(f"  PR-AUC:    {best_metrics['pr_auc']:.4f}")
print("\n[OK] All artifacts saved to models/")
print("=" * 70)
