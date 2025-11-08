# 🌍 CivicSphere‑AI
**Your Local Civic Companion — Multilingual · Location‑aware · AI‑Driven**

CivicSphere‑AI empowers citizens by bringing together *regional context*, *multilingual support*, and *real‑time local data* in one beautiful interface. From weather alerts to government notifications, from local news to advisory insights — all in the language of your region.  

---

## 🚀 Key Features
- **Auto‑Location & Language Detection** – App detects your region (or you can manually select), and suggests your local language.
- **Multilingual Support** – Powered by the Google Cloud Translation API, the UI and AI responses adapt to your chosen language.
- **AI‑based Local Advice** – Through the Hugging Face Inference API, CivicSphere‑AI analyses local data (news, weather, alerts) and generates actionable advice.
- **Live Local Data Feed** – GNews for local news, OpenWeatherMap for weather & environmental alerts, ReliefWeb for disaster & health reports.
- **Separated Frontend / Backend Architecture** – Clean structure where the UI and API layers live in distinct folders, yet connect smoothly.
- **Modern UI/UX** – Built with React.js + Tailwind CSS + Framer Motion for fluid animations, responsive layouts, and a professional feel.
- **Blood‑free Hosting** – Designed for deployment on free tiers (Vercel, Netlify, Render) with no cost barrier.

---

## 🧠 Tech Stack
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React.js + Tailwind CSS + Framer Motion | Responsive, animated interface |
| Backend / Data & Auth | Supabase (Auth, Database, Storage) | Handles user profiles, preferences, data caching |
| AI Layer | Hugging Face Inference API | Summarization, advice generation |
| Translation Layer | Google Cloud Translation API | Multilingual UI & responses |
| Geolocation | ipapi.co (or equivalent free API) | Detects user location |
| Local Data | GNews API, OpenWeatherMap API, ReliefWeb API | Aggregates news, weather, disaster & health alerts |

---

## 🗂️ Project Structure
```
CivicSphere‑AI/
│
├── frontend/                      # React.js application
│   ├── public/                    # Static files
│   ├── src/                       # React components & pages
│   ├── tailwind.config.ts
│   ├── package.json
│   └── .env.local                 # Frontend environment variables
│
├── backend/                       # API / server logic
│   ├── src/
│   ├── routes/
│   ├── controllers/
│   ├── package.json
│   └── .env                        # Backend environment variables
│
├── supabase/                      # Supabase setup (SQL, schema, seeds)
│
├── README.md                      # This file
└── .gitignore
```

---

## ⚙️ Environment Variables
### Frontend (`frontend/.env.local`)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_HUGGINGFACE_API_KEY=your_hf_api_key
VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
VITE_GNEWS_API_KEY=your_gnews_api_key
VITE_LOCATION_API_URL=https://ipapi.co/json/
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
HUGGINGFACE_API_KEY=your_hf_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key
GNEWS_API_KEY=your_gnews_api_key
OPENWEATHER_API_KEY=your_openweather_key
LOCATION_API_URL=https://ipapi.co/json/
```

---

## 🧱 Getting Started
1. **Clone the repository**
   ```bash
   git clone https://github.com/dhiroj-exe/CivicSphere-AI.git
   cd CivicSphere-AI
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```

4. Both applications will run locally. Set environment variables accordingly before deploying.

---

## 🎯 How It Works
- On first load, the user is prompted for location permission.
- The location API returns region data → UI suggests language.
- The user submits a query or views local alerts.
- The backend fetches live data (news, weather, alerts) and invokes the AI model with location + language context.
- The AI returns advice or summary → translation layer applies language switch if needed → frontend displays results in clean animated cards.
- User preference (language, region) and cached data stored in Supabase for faster reuse.

---

## 🏆 Innovation Highlight
**Smart Local Situation Lens** – an AI feature that doesn’t just show data; it *interprets* it. For example:
> “Your region’s AQI is at 190 (‘Very Poor’). Consider postponing outdoor activities and check nearest indoor community centers.”
> Or “Heavy rainfall expected tomorrow — local road flooding risk is high; here’s a safe alternate route and nearest shelter.”

This level of localized intelligence — merging real‑time civic data, regional context, and multilingual output — is rarely seen in civic tech prototypes.

---

## 👥 Contributing
We welcome contributions!  
Please fork the repository and submit a pull request.  
GitHub workflow: feature branches → PR → review → merge.

---

## 📜 License
This project is licensed under the **MIT License**.
