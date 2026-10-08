<div align="center">
  <h1>🧠 AI-Powered Fuzzy TOPSIS Engine</h1>
  <p><strong>An Enterprise-Grade Multi-Criteria Decision Analysis (MCDA) Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Groq](https://img.shields.io/badge/Groq_LLM-F6511D?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

<br />

## 📖 Project Overview

Traditional decision-making algorithms require strict mathematical inputs and rigid criteria weights. This project modernizes the **TOPSIS** (Technique for Order Preference by Similarity to Ideal Solution) algorithm by wrapping it in an **LLM Agent Layer** and supporting **Fuzzy Logic**. 

Instead of forcing users to calculate mathematical weights, the user simply types what they are looking for in plain English. The AI deduces the weights, the system allows the human to override them, and the mathematical engine calculates the best decision while proving its stability.

---

## ⚙️ The Application Workflow (Step-by-Step)

This project follows a strict 6-step enterprise workflow. Here is exactly what happens from the moment a user uploads a file to the moment the final ranking is displayed:

### 1. Data Ingestion (Universal File Parser)
* **What happens:** The user drags and drops a dataset (`.csv`, `.xlsx`, or `.json` up to 5 MB).
* **The Tech:** The Express.js backend uses `multer` (with an enforced 5 MB size limit and friendly error handling) to securely ingest the file, and custom parsers (`csv-parse`, `xlsx`) automatically convert the raw data into a structured 2D array (Matrix) ready for mathematical evaluation.

### 2. AI Context Extraction (Groq LLM)
* **What happens:** The user types a natural language preference (e.g., *"I want the cheapest option, but durability is extremely important."*).
* **The Tech:** The backend sends the column names and the user's text to the **Groq LLM** (`openai/gpt-oss-120b` or `llama-3.3-70b-versatile`, configurable via environment variables with native JSON mode). The LLM is strictly prompted to return a JSON object containing mathematical **Weights** and **Impacts** (`+` for benefit, `-` for cost). Robust type coercion and validation ensure weights are positive finite numbers summing correctly.

### 3. Human-in-the-Loop (Manual Overrides)
* **What happens:** AI can hallucinate, so enterprise systems never blindly trust it. The frontend pauses and displays the AI's suggested weights on interactive sliders. 
* **The Tech:** The user can manually tweak the sliders. As they drag one slider, the React frontend *auto-normalizes* the remaining sliders in real-time to ensure the math always equals exactly 100%.

### 4. The Mathematical Engine (Crisp vs Fuzzy)
Once the user clicks "Confirm & Rank", the data is sent back to the Node.js mathematical engine. Depending on the user's toggle, one of two engines runs:
* **Standard TOPSIS:** Used when the dataset contains strict numbers (e.g., Price: $500). It normalizes the numbers, applies the weights, finds the absolute Best and Worst hypothetical scenarios, and calculates the Euclidean distance to find the winner.
* **Fuzzy TOPSIS:** Used when the dataset contains vague, human words (e.g., "Very Good", "Poor"). The engine uses a predefined dictionary to convert these words into **Triangular Fuzzy Numbers (TFNs)**. A TFN represents vagueness using three bounds: `(lower, middle, upper)`. It then calculates the distances between these triangles, with division-by-zero safeguards for zero-valued scenarios.

### 5. Sensitivity Analysis (Decision Robustness)
* **What happens:** How do we know the #1 rank wasn't just a lucky mathematical fluke? The backend secretly stress-tests the decision.
* **The Tech:** The `runSensitivityAnalysis()` function loops through every criteria, inflates its weight by 10%, lowers the others, and re-runs the entire TOPSIS algorithm. If the #1 winner stays the same in >80% of these variations, the frontend awards a **"Robust Decision"** badge. If it flips, it warns the user of a **"Sensitive Decision"**.

### 6. Visual Explainability (XAI)
* **What happens:** Executives need to understand *why* an AI made a decision, rather than just looking at a final score. 
* **The Tech:** The React frontend uses `recharts` to render a **Radar Chart (Spider-web chart)** comparing the #1 and #2 ranked choices. This visually proves exactly which criteria caused the winner to beat the runner-up.

---

## 🛠️ Tech Stack & Architecture

### Frontend (User Interface)
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS (v3) with strict Apple Human Interface Guidelines (Glassmorphism, `backdrop-blur-3xl`, San Francisco-style typography).
- **Animations:** Framer Motion (spring physics, layout transitions).
- **Charts:** Recharts (Radar/Polar graphs).

### Backend (The Neural Engine)
- **Runtime:** Node.js
- **Framework:** Express.js (with Global Error Handling middleware and 5 MB upload limits).
- **API Docs:** Swagger / OpenAPI 3.0 at `/api-docs`.
- **AI Integration:** Groq SDK (configurable models & temperatures, with automated retries and JSON cleansing).
- **Mathematics:** Pure JavaScript algorithmic implementation of Euclidean distance, matrix normalization, and TFN vector algebra.
- **Testing:** Jest unit test suite covering crisp, fuzzy, sensitivity analysis, and edge cases.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Groq API Key](https://console.groq.com/)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-topsis-engine.git
cd ai-topsis-engine

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the **backend** directory:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b          # Optional: defaults to openai/gpt-oss-120b (or llama-3.3-70b-versatile)
GROQ_TEMPERATURE=0                      # Optional: defaults to 0
```

### 3. Run the Development Servers
You will need two terminal windows to run both servers concurrently.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.  
The backend API and interactive Swagger documentation will be available at `http://localhost:5000/api-docs`.

---

### 4. Running Unit Tests
The backend includes a comprehensive Jest test suite verifying crisp TOPSIS, Fuzzy TOPSIS, sensitivity analysis, and input validation across standard cases and critical edge cases (zero denominators, zero weights, all-cost impacts, and LLM type coercion):

```bash
cd backend
npm test
```

---
## 📄 License
This project is licensed under the MIT License.
