# AI Video Summarizer & Highlight Generator

A production-ready full-stack AI web application designed to automatically transcribe long videos, generate executive summaries with action items, and extract short highlight clips utilizing Generative AI models.

## Technology Stack

- **Frontend**: React (Vite) + Tailwind CSS v3 + Recharts (Analytics) + Lucide Icons
- **Backend**: Python FastAPI + SQLAlchemy (Database pool) + JWT Authentication
- **Database**: PostgreSQL (with SQLite auto-fallback)
- **Speech-to-Text**: Whisper (support for OpenAI Whisper API, local Whisper execution, and mockups)
- **AI Models**: Google Gemini / OpenAI GPT / Hugging Face Free Inference API
- **Video Processing**: FFmpeg subprocess slicing and MoviePy

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **FFmpeg**: Must be installed and available on your system path.

---

### Installation & Run

#### 1. Backend Server Setup
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the dev server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Swagger documentation is accessible at `http://127.0.0.1:8000/docs`.

#### 2. Frontend React Setup
```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` to interact with the application.

---

## Application Setup

1. **Database Fallback**: By default, the backend attempts to connect to PostgreSQL at `postgresql://postgres:postgres@localhost:5432/ai_video_summarizer`. If PostgreSQL is not active, it will automatically fallback to creating a local SQLite file `video_summarizer.db` in the root folder so the system executes seamlessly.
2. **AI API Keys**: Set up your keys in the `backend/.env` file:
   - `GEMINI_API_KEY`: Google Gemini free key.
   - `HF_API_TOKEN`: Hugging Face token.
   - `OPENAI_API_KEY`: OpenAI secret key.
   *If no API keys are supplied, the backend uses a smart offline analyzer fallback.*
