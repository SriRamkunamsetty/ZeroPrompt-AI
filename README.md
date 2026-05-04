# ZeroPrompt AI

**AI for Everyone. No Prompt Engineering Required.**

---

## 🛑 The Problem

**Prompt engineering is a barrier to entry.**
Large Language Models have incredible capabilities, but accessing their true power currently requires users to learn "prompt engineering"—a highly technical, often frustrating process of trial and error. 

This creates a significant divide:
- **Exclusion of Non-Technical Users:** Professionals, educators, and everyday users are left behind because they don't know how to "talk" to the AI effectively.
- **Inconsistent Results:** Even for experienced users, slight variations in a prompt can lead to drastically different outputs, making AI tools unpredictable.
- **Cognitive Load:** Users just want to solve their problems (e.g., "summarize this contract" or "analyze this data"), but instead, they spend time figuring out *how* to instruct the machine.

## 🚀 The Solution

**ZeroPrompt AI removes the prompt box completely.**

ZeroPrompt AI is an intent-driven platform that infers what the user wants based on structured UI interactions rather than open-ended text input. 
- **Upload & Go:** Users simply upload a document, paste code, or select options from a guided wizard.
- **Automatic Intent Inference:** The system analyzes the input type and automatically orchestrates the optimal prompt behind the scenes.
- **Zero Typing of Instructions:** Users interact with clean, structured interfaces while the backend handles the complexity of LLM orchestration.

## 🏢 Chosen Vertical

**Productivity, Learning, and AI Accessibility**
ZeroPrompt AI is designed for knowledge workers, students, and educators who need immediate value from AI without the steep learning curve. By democratizing AI interaction, it empowers anyone to perform complex analyses on documents, data, and code.

## 🧠 Approach & Logic

1. **Structured UI Replaces Prompts:** Instead of an empty text box, users are presented with specific tools (Document Intelligence, CSV Analysis, Code Review).
2. **Context Extraction:** When a user uploads a file, the frontend extracts the text and metadata directly.
3. **Backend Orchestration:** The Node.js backend crafts highly optimized, rigid prompts containing the user's data and enforces structured JSON outputs.
4. **Actionable Outputs:** The AI doesn't just return a wall of text; it returns parsed data, summaries, key metrics, and intelligent "Next Steps" (Suggested Actions).
5. **Explainability:** The system clearly explains *why* it provided certain suggestions, ensuring transparency and building user trust.

## 🏗️ System Architecture

ZeroPrompt AI utilizes a robust, decoupled full-stack architecture designed for scalability and security.

- **Frontend:** React (Vite) hosted on **Firebase Hosting**. Provides a fast, responsive, mobile-first SPA.
- **Backend:** Node.js (Express) containerized and deployed on **Google Cloud Run**. Handles all heavy logic and external API communication.
- **AI Layer:** **Google Gemini API** (Gemini 2.5 Flash), orchestrating complex prompt execution and JSON schema enforcement.
- **Database:** **Firestore** (NoSQL), storing user interactions, analysis history, and usage metrics.
- **Storage:** **Firebase Storage**, securing uploaded files prior to processing.
- **Security & Identity:** **Firebase Authentication** enforces identity constraints, while Cloud Run keeps sensitive API keys hidden from the client.

## 🔄 System Workflow

1. **Authentication:** The user logs in securely using Firebase Auth (Google or Email).
2. **Interaction:** The user selects a tool and provides input (e.g., uploads a PDF).
3. **Payload Transmission:** The frontend sends the extracted content securely to the Cloud Run backend along with the user's JWT token.
4. **AI Processing:** The backend validates the token, checks the user's rate limits/quota, formats the internal prompt, and calls the Gemini API.
5. **Structured Delivery:** The AI responds with structured JSON containing the summary, insights, and dynamic suggestions.
6. **Persistence:** The result is saved securely to Firestore for the user's historical access.

## ✨ Features

- 🚫 **Zero-Prompt Interaction:** No text boxes for instructions.
- 📄 **Document Intelligence:** Automatic summarization and key-point extraction for PDFs/text.
- 📊 **CSV Data Analysis:** Detects trends and suggests chart configurations for tabular data.
- 💻 **Code Explanation & Review:** Finds bugs, suggests improvements, and explains logic.
- 🎯 **Intelligent Suggestions:** Context-aware actionable next steps generated dynamically.
- 🔍 **Explainable AI:** Transparent reasoning for why actions were suggested.
- 📈 **Metrics Dashboard:** Real-time visibility into AI confidence, token usage, and processing time.
- 🛡️ **Resilience & Caching:** Fail-safe demo modes ensure the app never crashes during API timeouts.
- 🚦 **Dual Rate Limiting:** Both IP-based (Express-Rate-Limit) and User-based (Firestore) quotas.
- 🔊 **Accessibility:** Integrated Text-to-Speech (TTS) for reading summaries aloud.

## 🛠️ Tech Stack

**Frontend:**
- React 18, Vite
- Tailwind CSS, Framer Motion (Animations)
- Lucide React (Icons)
- React Markdown

**Backend:**
- Node.js, Express
- Firebase Admin SDK

**AI & Cloud Infrastructure:**
- Google Gemini API
- Google Cloud Run
- Firebase (Auth, Firestore, Storage, Hosting)

**Testing:**
- Vitest

## 🔒 Security

ZeroPrompt AI implements a defense-in-depth strategy:

- **Server-Side AI Execution:** The `GEMINI_API_KEY` is absolutely never exposed to the frontend. All AI calls route through the secured Cloud Run backend.
- **Authentication Enforcement:** Backend middleware verifies Firebase JWT tokens on every request.
- **Strict Network Policies:** Express CORS middleware is strictly configured to only allow requests from the deployed Firebase Hosting domain.
- **User Data Isolation:** Firestore and Firebase Storage Security Rules strictly enforce that `request.auth.uid == userId`, preventing horizontal data access.
- **Atomic Rate Limiting:** Firestore transactions enforce a daily quota per user, preventing abuse and API cost overruns. IP-based limits prevent DDoS on the backend.

## 💡 Assumptions

- Users upload legible, valid files (text, markdown, CSV, or code).
- The Gemini API reliably outputs structured JSON when requested.
- Continuous internet connectivity is available.
- Files processed are within the token context limits of the Gemini model (handling built-in truncation).

## 🚀 Deployment

The system is deployed using an automated, decoupled pipeline:
- **Backend:** Containerized via Docker and deployed to Google Cloud Run (`gcloud run deploy`), managed by environment variables.
- **Frontend:** Built via Vite and deployed to Firebase Hosting (`firebase deploy --only hosting`), utilizing a `.env.production` file pointing to the Cloud Run endpoint.

## 🔮 Future Scope

- **User Personalization:** System learns user preferences over time to tailor the "Suggested Actions".
- **Multi-Language Support:** Intent inference and UI outputs automatically adapted to the user's locale.
- **Advanced Analytics:** Deeper dive into CSV data with auto-generated interactive dashboards (Recharts integrated directly).
- **Enterprise Features:** Team workspaces, shared document intelligence, and SSO integrations.

---
*Built to make the power of Gemini accessible to everyone.*
