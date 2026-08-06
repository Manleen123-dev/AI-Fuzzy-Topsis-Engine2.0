<div align="center">
  <h1>🧠 AI-Powered Fuzzy TOPSIS Engine</h1>
  <p><strong>A Next-Generation Multi-Criteria Decision Analysis Platform</strong></p>
  
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Groq](https://img.shields.io/badge/Groq_LLM-F6511D?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
</div>

<br />

Traditional decision-making algorithms require strict mathematical inputs and rigid criteria weights. This project modernizes the **TOPSIS** (Technique for Order Preference by Similarity to Ideal Solution) algorithm by wrapping it in an **LLM Agent Layer** and supporting **Fuzzy Logic**. 

Users can upload raw datasets and simply type what they are looking for in plain English. The AI automatically deduces the mathematical weights and impacts, while the Fuzzy Engine handles vague linguistic variables (e.g., "Good", "Poor") found in real-world data.

## ✨ Key Features

- 🗣️ **Natural Language Processing:** Uses Groq's blazing-fast LLM (`llama-3.3-70b-versatile`) to translate human preferences ("I want a cheap phone with the best camera") into precise mathematical criteria weights and cost/benefit impacts.
- 📐 **Dual Math Engines:** 
  - **Standard TOPSIS:** For crisp, numeric datasets.
  - **Fuzzy TOPSIS:** Uses Triangular Fuzzy Numbers (TFNs) to calculate Euclidean distances for datasets containing vague linguistic variables ("Very Good", "Fair", "Poor").
- 🍎 **Premium Apple-Inspired UI:** A stunning, frosted-glass (glassmorphism) React frontend with fluid Framer Motion animations and responsive layouts.
- 📁 **Universal File Parser:** Seamlessly drag-and-drop `.csv`, `.xlsx`, or `.json` files.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS (v3), Lucide React (Icons)
- **Animations:** Framer Motion
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **AI Integration:** Groq API
- **File Handling:** `multer`, `csv-parse`, `xlsx`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Groq API Key](https://console.groq.com/)

### 1. Clone & Install
Install the dependencies for both the backend and frontend.

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

---

## 📖 How to Use

1. **Upload a Dataset:** Drag and drop a CSV/Excel file containing your alternatives and criteria.
   - *Note: The first column should contain the names of the alternatives (e.g., iPhone 15, Samsung S24). The top row should contain the criteria names (e.g., Price, Camera Quality).*
2. **Describe your Preferences:** Type your ideal outcome in plain English (e.g., *"I want the cheapest option, but durability is extremely important to me."*)
3. **Select Mode:**
   - Leave the toggle **OFF** for standard numerical datasets.
   - Turn the toggle **ON** (Fuzzy Mode) if your dataset uses words like "Good", "Fair", or "Poor" instead of numbers.
4. **Rank Alternatives:** The AI will extract the weights, and the math engine will rank your dataset in milliseconds!

---

## 📄 License
This project is licensed under the MIT License. 
