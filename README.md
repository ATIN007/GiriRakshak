# GiriRakshak (गिरिरक्षक)
### AI-Powered Landslide Early Warning & Decision Support System for North East India
**Corridors Covered:** NH-6 / Old NH-44 (Guwahati–Shillong–Silchar) & NH-37 (Brahmaputra Valley)  
**Live Application:** [https://giri-rakshak-rho.vercel.app](https://giri-rakshak-rho.vercel.app)

---

## 🏛️ Government Integration: NDMA SACHET Platform

> **Official Integration Architecture Note:**  
> *"In production, this CAP-formatted alert would be submitted to NDMA's SACHET platform, so GiriRakshak's warnings reach the public through India's existing official alert infrastructure rather than a separate, siloed app."*

Instead of creating a siloed, redundant warning channel, GiriRakshak serves as an **upstream high-resolution AI engine** that feeds directly into India's national disaster infrastructure:
- **Common Alerting Protocol (OASIS CAP v1.2 / ITU-T X.1303):** Every hazard alert is formatted into standard CAP XML featuring standard identifiers, incident severity, urgency, certainty, and geographic circle/polygon coordinates.
- **Upstream Feed to SACHET:** NDMA's SACHET platform already aggregates alerts from IMD, GSI, and CWC. GiriRakshak bridges the critical gap by supplying hyper-local (30m grid) slope failure alerts along transport lifelines.
- **Pan-India Dissemination:** Through SACHET, alerts reach citizens via Cell Broadcast (telecom tower level broadcast), regional SMS, emergency sirens, and SDMA operational control rooms.

---

## ⚡ Core USPs

1. **Explainable AI (XAI):** Uses `shap.TreeExplainer` on every prediction to produce feature attribution weights (`72h Accumulation`, `Soil Moisture`, `Slope Angle`, `24h Rain`, `Neighbor Risk`, `Instant Rain`, `Elevation`), enabling transparent and defensible administrative decisions.
2. **Scalable, Sensor-Free Coverage:** Combines open Google Earth Engine (Sentinel-2 + SRTM 30m DEM) with IMD's NE Warning Bulletins and GSI's NLSM records to monitor hundreds of kilometers without requiring physical ₹25 Lakh sensors on every slope.
3. **Offline-First Resilience:** PWA citizen and officer field reporting queues observations in browser `localStorage` during communication blackouts and auto-syncs upon reconnection. Critical alerts dispatch via carrier SMS without requiring mobile internet.

---

## 📊 3-Model Head-to-Head Benchmark

Evaluated on 2,500 geotechnical sample records using an identical 25% stratified test split (625 events):

| Model | Paradigm | Accuracy | Precision | Recall (Safety) | F1-Score | Verdict |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** | Linear Baseline (L2) | 83.36% | 81.35% | 78.24% | 0.7977 | Baseline |
| **Random Forest** | Ensemble Bagging (160 trees) | **84.16%** | **82.73%** | **78.63%** | **0.8063** | 🏆 **Champion Selected** |
| **XGBoost** | Gradient Boosting (130 trees) | 83.20% | 81.03% | 78.24% | 0.7961 | Baseline |

---

## 🛠️ Tech Stack & Endpoints

- **Frontend:** React 19, Vite, Tailwind CSS v4, Leaflet GIS, Recharts, `vite-plugin-pwa`.
- **Backend:** FastAPI, `scikit-learn`, `xgboost`, `shap`, `supabase-py`.
- **Database:** Supabase PostgreSQL (tables: `zones`, `risk_history`, `hazard_reports`, `alerts_log`).
- **Endpoints:**
  - `GET /zones` & `GET /zones/{id}`: Live telemetry and risk progression.
  - `POST /predict`: 7-feature geotechnical inference with SHAP attribution.
  - `POST /zones/{id}/simulate`: Acute rainfall surge simulation with SMS trigger.
  - `POST /alerts/{id}/export-cap`: OASIS CAP v1.2 XML export for NDMA SACHET.
  - `GET /model/benchmark`: 3-model performance metrics.
  - `GET/POST /hazard-reports`: Offline field reports sync.

---

## 🚀 Running Locally

### Backend (FastAPI):
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python ml/train_model.py
uvicorn main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```
Dashboard: `http://localhost:5173`

---

## 📚 References & Theoretical Foundations

> **Model Formulation Grounding:**  
> *"Our weighted risk score (rainfall + soil saturation + slope angle) follows the same empirical rainfall-threshold approach established by Guzzetti et al., adapted with machine-learned weights instead of fixed coefficients."*

1. **Guzzetti, F., Peruccacci, S., Rossi, M., & Stark, C. P. (2007).** *"Rainfall thresholds for the initiation of landslides in central and southern Europe."* Meteorology and Atmospheric Physics, 98(3-4), 239-267. — Foundational empirical rainfall-threshold modeling.
2. **USGS Infinite-Slope Stability Model.** *"Infinite-Slope Stability Model & Pore-Water Pressure Mechanics."* U.S. Geological Survey Open-File Reports — Physical mechanics basis for using slope angle (shear stress) and soil moisture saturation (pore-water pressure reduction of effective normal stress) as direct landslide hazard determinants.
3. **Kirschbaum, D., & Stanley, T. (2018).** *"Satellite-based landslide hazard modeling: An update to the Landslide Hazard Assessment for Situational Awareness (LHASA) model."* Frontiers in Earth Science, 6, 170. — Satellite-driven multi-factor heuristic and machine learning landslide risk modeling.
4. **Lundberg, S. M., & Lee, S. I. (2017).** *"A unified approach to interpreting model predictions."* Advances in Neural Information Processing Systems (NeurIPS), 30, 4765-4774. — Foundational TreeSHAP explainability algorithm.
5. **NDMA / OASIS Common Alerting Protocol (CAP v1.2) / ITU-T X.1303.** *"National Disaster Management Authority (SACHET) Implementation Guidelines."* — Standardized XML warning payload format for pan-India emergency dissemination.

