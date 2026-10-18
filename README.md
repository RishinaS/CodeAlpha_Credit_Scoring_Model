# 🚀 Credit Intelligence

**Explainable AI for Smarter Credit Risk Decisions**

Credit Intelligence is a professional, end-to-end Machine Learning web application designed to predict applicant credit risk, provide detailed explainability (XAI) for every decision, and offer a suite of analytical tools for model monitoring and fairness auditing.

---

## 🌟 Key Features

1. **Credit Risk Prediction**: Classifies applicants as Low, Medium, or High Risk with granular probability scores.
2. **Explainable AI (XAI)**: Breaks down every prediction, showing exactly which financial factors increased or decreased the estimated risk.
3. **Model Comparison**: Automatically evaluates Logistic Regression, Decision Trees, Random Forests, and Gradient Boosting, selecting the best model based on a weighted composite metric (ROC-AUC, F1, Recall).
4. **Responsible AI & Fairness**: Analyzes statistical disparities across demographic groups to promote ethical AI practices.
5. **Interactive Dashboard**: Real-time analytics, prediction trends, and global feature importance visualizations.
6. **Robust Backend**: FastAPI application with comprehensive data validation and SQLite integration for prediction history.
7. **Premium Frontend**: Responsive React + TypeScript dashboard with a modern dark-mode fintech aesthetic.

---

## 🏗 Architecture

The platform follows a decoupled, service-oriented architecture:

- **Frontend**: React 18, TypeScript, Vite, Recharts, custom CSS variables.
- **Backend**: FastAPI, Pydantic, SQLAlchemy, Uvicorn.
- **ML Pipeline**: Scikit-Learn, Pandas, NumPy, SHAP / Permutation Importance.
- **Database**: SQLite (Production-ready via SQLAlchemy abstraction).

*See `docs/architecture.md` for detailed system diagrams.*

---

## 📊 Dataset

This project utilizes the **German Credit Dataset** (sourced via OpenML / UCI Machine Learning Repository).
- **Records**: 1000
- **Features**: 20 (Numerical and Categorical)
- **Target**: Good / Bad Credit

*See `docs/model_card.md` for detailed dataset analysis and model limitations.*

---

## 🚀 Installation & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Setup Backend

```bash
cd credit-intelligence/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the ML Model (Required before starting the server)
python -m app.ml.train

# Run the API Server
uvicorn app.main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000` (Swagger UI at `/docs`).*

### 2. Setup Frontend

Open a new terminal window:

```bash
cd credit-intelligence/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

---

## 🧪 Testing

```bash
cd credit-intelligence

# Run backend and ML pipeline tests
cd backend
python -m pytest ../tests/
```

---

## ⚠️ Disclaimer

This application provides an experimental AI-based risk estimate for educational and analytical purposes. It is **not** a substitute for professional financial assessment, regulatory compliance, or official credit-bureau scoring (e.g., CIBIL/FICO).
