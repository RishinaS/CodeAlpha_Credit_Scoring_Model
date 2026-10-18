"""Responsible AI / Fairness analysis endpoint."""
from fastapi import APIRouter
from app.ml.predictor import model_service

router = APIRouter()


@router.get(
    "/fairness",
    summary="Fairness Analysis",
    description="""
Get statistical disparity analysis across demographic groups.

**Important Disclaimer:**
This analysis identifies potential statistical disparities in the dataset/model.
It does NOT establish discrimination or legal compliance.
The German Credit dataset may reflect historical biases; results should be interpreted with caution.
    """
)
async def get_fairness_analysis():
    fairness_data = model_service.get_fairness_data()
    model_info = model_service.get_model_info()

    groups_list = []
    if fairness_data:
        for key, val in fairness_data.items():
            groups_list.append(val)

    # Calculate overall accuracy from model metrics
    model_metrics = model_service.get_model_metrics()
    best_model_key = model_metrics.get("best_model", "")
    overall_accuracy = None
    if best_model_key and best_model_key in model_metrics:
        overall_accuracy = model_metrics[best_model_key].get("accuracy")

    return {
        "disclaimer": (
            "This analysis identifies potential statistical disparities in the dataset/model. "
            "It does not establish discrimination or legal compliance. "
            "The German Credit Dataset is a historical dataset that may contain socio-economic biases. "
            "Results should be interpreted by qualified professionals in appropriate context."
        ),
        "responsible_ai_notice": (
            "Credit Intelligence is a decision-support system, not an autonomous financial approval system. "
            "Predictions are risk estimates only and must be reviewed by qualified human decision-makers."
        ),
        "dataset": "German Credit Dataset (UCI / OpenML)",
        "dataset_note": (
            "The German Credit Dataset uses socio-economic variables as proxies for creditworthiness. "
            "Some variables (e.g., personal_status) may reflect historical gender or marital status patterns."
        ),
        "protected_attributes_note": (
            "Age is analyzed as a proxy for financial life-stage patterns, not as a protected class. "
            "No protected attributes are used for prediction decisions."
        ),
        "overall_model_accuracy": overall_accuracy,
        "analysis_variable": "Age group",
        "groups": groups_list,
        "data_quality_notes": [
            "Missing value rate: 0% (German Credit dataset has no missing values)",
            "Class imbalance: ~70% good credit / 30% bad credit (addressed via class_weight='balanced')",
            "Dataset size: 1000 records — sufficient for demonstration, limited for production fairness auditing",
        ],
        "limitations": [
            "1000 sample dataset limits statistical power for fine-grained fairness analysis",
            "German Credit Dataset is from the 1970s–1990s and may not reflect current patterns",
            "Fairness metrics are computed on test set only (200 records)",
            "Full intersectional fairness analysis requires larger datasets",
        ],
        "ethical_considerations": [
            "This system is intended for educational/portfolio demonstration only",
            "Any production credit-risk system must undergo legal and regulatory review",
            "Human oversight is required for all credit decisions",
            "Users should not rely on this system for actual financial decisions",
        ]
    }
