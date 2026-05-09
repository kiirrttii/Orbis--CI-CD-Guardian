# Orbis - CI/CD Guardian

Orbis is an advanced, risk-aware CI/CD intelligence platform designed to proactively monitor, analyze, and mitigate deployment risks. By integrating machine learning with deployment telemetry, Orbis translates complex software metrics into human-readable, actionable engineering guidance.

## 🚀 Key Features

*   **Intelligent Pipeline Analysis**: Analyze codebases via GitHub repository links or raw telemetry data to assess risk before deployment.
*   **Plain-English Recommendations**: Orbis's hybrid intelligence engine converts raw ML features (like Cyclomatic Complexity and Code Volume) into clear "What this means," "Why it matters," and "Suggested Actions" for non-expert users.
*   **Historical Intelligence**: Review past deployment analyses and risk scores to identify trends over time.
*   **SHAP Explainability**: Understand *why* the AI assigned a specific risk score, with visual feature-impact breakdowns.
*   **Modern Workspace**: A polished, premium interface featuring monitoring dev tools, exportable reports, and dedicated settings management.

## 🛠️ Technology Stack

*   **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide Icons, Framer Motion
*   **Backend**: Python, FastAPI, SQLAlchemy (Async), Uvicorn
*   **Machine Learning**: Scikit-Learn, SHAP, Pandas

---

## 🏃‍♂️ How to Run Locally

Orbis is split into two distinct services: a FastAPI backend and a Next.js frontend. You will need to run both concurrently in separate terminal windows.

### 1. Start the Backend (FastAPI)

Ensure you have Python 3.10 or higher installed.

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install the dependencies
pip install -r requirements.txt

# Start the API server with live reloading
uvicorn app.main:app --reload
```
*The backend will be available at `http://localhost:8000`*

### 2. Start the Frontend (Next.js)

Ensure you have Node.js (v18+) and npm installed.

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install the dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will be available at `http://localhost:3000`*

## 📚 Getting Started

Once both servers are running:
1. Open your browser and navigate to `http://localhost:3000`.
2. You will be redirected to the **Login** screen.
3. You can create an account via the Sign Up page, or use existing mock credentials if seeded.
4. Upon successful login, you will land on the **How It Works** onboarding page, where you can explore the architecture before diving into the **Analyze Pipeline** tool!
