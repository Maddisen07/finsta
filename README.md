# 🌟 FinSta — Your Smart Money Sidekick

> **AI-Powered Financial Chatbot** providing clear, personalized, educational financial guidance in plain language.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Table of Contents
1. [Overview & Persona](#-overview--persona)
2. [Architecture & System Design](#-architecture--system-design)
3. [Key Features](#-key-features)
4. [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
5. [10 Example Test Conversations](#-10-example-test-conversations)
6. [Safety & Privacy Protections](#-safety--privacy-protections)
7. [Limitations & Future Roadmap](#-limitations--future-roadmap)
8. [3-Minute Demo Presentation Script](#-3-minute-demo-presentation-script)

---

## 🤖 Overview & Persona

**FinSta** (*"Your smart money sidekick"*) is an educational financial coach designed to demystify personal finance. Unlike generic FAQ chatbots, FinSta:
- Speaks in **plain, jargon-free English** and defines terms when introduced.
- **Never guesses numbers**: Executes built-in, mathematically exact financial calculator tools.
- Visualizes scenarios with **interactive inline Recharts** (loan amortization, SIP compounding, 50/30/20 budgets, debt payoff comparison).
- Detects and masks **PII (Credit cards, SSN, PAN, passwords)** client-side and server-side.
- Protects users by warning against **get-rich-quick scams** and providing compassionate resources during **financial distress**.

> **Mandatory Disclaimer:** FinSta provides educational information, not professional financial advice.

---

## 🏛️ Architecture & System Design

```
                                  ┌────────────────────────┐
                                  │   React 18 Frontend    │
                                  │   (Vite + Tailwind)    │
                                  └───────────┬────────────┘
                                              │
                      Server-Sent Events (SSE)│ REST Requests
                                              ▼
                                  ┌────────────────────────┐
                                  │  FastAPI Backend (Py)  │
                                  └───────────┬────────────┘
                                              │
                   ┌──────────────────────────┼──────────────────────────┐
                   ▼                          ▼                          ▼
        ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
        │  Safety & Privacy  │     │    NLP Routing     │     │ Built-in Financial │
        │  - PII Masking     │     │ - 9 Intent Classes │     │    Calculators     │
        │  - Scam Detection  │     │ - Entity Extractor │     │ - Exact Math/Tools │
        │  - Distress Guard  │     │   (Rates, Tenures) │     │ - Recharts Payload │
        └────────────────────┘     └────────────────────┘     └────────────────────┘
                   │                          │                          │
                   └──────────────────────────┼──────────────────────────┘
                                              ▼
                                 ┌────────────────────────┐
                                 │     AI Engine Layer    │
                                 │ - Anthropic Claude API │
                                 │ - Fallback Local Coach │
                                 └────────────┬───────────┘
                                              │
                                              ▼
                                 ┌────────────────────────┐
                                 │ SQLite (SQLAlchemy ORM)│
                                 │ - Profile & History    │
                                 └────────────────────────┘
```

---

## 🚀 Key Features

### 1. Conversational Chat & Streaming
- Real-time Server-Sent Events (SSE) response streaming with typing indicator.
- Persistent session storage in SQLite (`finsta.db`).
- "New chat" button, session deletion, and session switching drawer.
- Conversation summarization into executive takeaways and action plans.
- Export chat conversations to **Markdown (`.md`)** or **PDF/Print view**.

### 2. Multi-Class Intent & Entity Routing
Classifies each incoming user prompt into one of 9 distinct intents:
- `budgeting`
- `savings`
- `loans`
- `investments`
- `retirement`
- `debt`
- `taxes_basic`
- `general`
- `out_of_scope`

Extracts financial entities: currency symbol, income, expenses, principal loan amount, annual interest rate, tenure (months/years), and goal target.

### 3. Built-In Exact Financial Calculators
Exact formulas without LLM hallucination:
1. **EMI / Loan Repayment Calculator**: Monthly payments, total interest, and full amortization schedule. Handles 0% interest loans.
2. **Compound Interest / SIP Growth Calculator**: Monthly compounding formula with yearly breakdown.
3. **Savings Goal Planner**: Solves for monthly required contribution toward a target amount by a specific date.
4. **50/30/20 Budget Splitter**: Needs (50%), Wants (30%), Savings (20%) with customizable percentage sliders.
5. **Debt Payoff Simulator (Avalanche vs. Snowball)**: Month-by-month simulation comparing interest saved and payoff timeline.
6. **Emergency Fund Estimator**: Calculates 3 to 12-month safety buffers based on essential monthly expenses.

### 4. Interactive Inline Visual Charts (Recharts)
- **Amortization Area Chart**: Visualizes remaining balance vs. principal paid over time.
- **Investment Growth Area Chart**: Compares cumulative invested capital vs. compound returns.
- **Budget Donut Chart**: Shows 50/30/20 distribution with interactive tooltips.
- **Debt Comparison Bar Chart**: Highlights interest and duration saved by Avalanche vs. Snowball.
- **Emergency Preparedness Gauge**: Visual progress bar toward safety fund target.

### 5. Profile Memory & Multi-Currency Support
- Supports **USD ($), INR (₹), EUR (€), GBP (£)** with auto-detection from user locale.
- Stores user monthly income, essential expenses, risk tolerance, and goals.
- Includes a one-click **"Clear my data"** button for complete privacy.

---

## 🛠️ Step-by-Step Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env
copy .env.example .env

# (Optional) Edit .env to add your Anthropic Claude API Key:
# ANTHROPIC_API_KEY=sk-ant-api03-...
# If left as "mock", FinSta runs locally with its built-in coach engine!

# Run backend tests
python -m pytest tests -v

# Start the FastAPI server
python -m uvicorn main:app --reload --port 8000
```
Backend API will be live at: **`http://localhost:8000`**  
Interactive API Docs (Swagger): **`http://localhost:8000/docs`**

---

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend will be live at: **`http://localhost:5173`**

---

## 💬 10 Example Test Conversations

| # | User Prompt | Classified Intent | Expected FinSta Behavior |
|---|---|---|---|
| 1 | *"How should I budget my $5,000 monthly take-home pay?"* | `budgeting` | Breaks down $2,500 Needs (50%), $1,500 Wants (30%), $1,000 Savings (20%) and renders inline 50/30/20 Donut Chart. |
| 2 | *"Calculate my monthly EMI on a $300,000 home loan at 6.5% for 30 years."* | `loans` | Executes `calculate_emi`, returns exact $1,896.20/mo EMI, total interest $382,633, and renders Amortization Schedule Area Chart. |
| 3 | *"If I invest $600/month for 15 years with an expected 10% annual return, how much will I have?"* | `investments` | Executes `calculate_sip`, returns $108,000 invested, $142,767 compound returns, total $250,767, and renders Compound Growth Area Chart. |
| 4 | *"I have $5,000 on a 23% APR credit card and $10,000 on an 8% car loan. How should I pay them off?"* | `debt` | Simulates Avalanche vs Snowball, compares total interest and months, renders Comparison Bar Chart, and suggests Avalanche for maximum money saved. |
| 5 | *"How big should my emergency fund be if my essential expenses are $2,800/month?"* | `savings` | Calculates $8,400 (3-month) and $16,800 (6-month) targets, renders Emergency Buffer Gauge, and recommends HYSA accounts. |
| 6 | *"How much do I need to save monthly to accumulate a $40,000 down payment in 3 years?"* | `savings` | Executes `calculate_savings_goal`, calculates required monthly savings of ~$1,111 (or less with HYSA interest) with progress milestones. |
| 7 | *"What is the difference between a Roth IRA and a 401(k) for retirement?"* | `retirement` | Explains pre-tax vs post-tax growth in plain English, mentions employer match, and clarifies tax implications. |
| 8 | *"Can you bake me a chocolate cake recipe?"* | `out_of_scope` | Politely declines: explains FinSta is specialized strictly in personal finance, and suggests 3 financial topics to explore. |
| 9 | *"Is this crypto bot promising guaranteed 100% monthly returns safe?"* | `investments` | **Safety Alert Triggered**: Warns user about red flags of guaranteed high return schemes, explaining that legitimate finance never guarantees astronomical gains. |
| 10 | *"Here is my credit card 4111 2222 3333 4444 to pay off my balance."* | `debt` | **PII Masking Triggered**: Replaces card with `[MASKED_CARD_NUMBER]`, alerts user with a privacy shield banner, and advises never sharing payment credentials. |

---

## 🔒 Safety & Privacy Protections

1. **PII Masking**: Regular expressions and checksum heuristics automatically detect and mask:
   - Credit & Debit Cards (13-19 digits)
   - US Social Security Numbers (SSNs)
   - Indian Permanent Account Numbers (PANs)
   - Bank Account Numbers (9-18 digits)
   - Passwords & PIN codes
2. **Scam & Risk Guardrails**: Scans for "guaranteed returns", "double your money in 24 hours", and high-risk speculative schemes.
3. **Compassionate Distress Handling**: Detects acute financial crises ("can't afford food", "eviction", "going bankrupt") and provides compassionate support and verified resources (US/Canada 988 Lifeline, NFCC Credit Counseling, 211 Emergency Aid).
4. **Prompt Injection Resistance**: Neutralizes delimiter injection attempts and enforces maximum token bounds.
5. **Rate Limiting**: Sliding 60-second window limiter per client IP.

---

## 🔭 Limitations & Future Roadmap

### Current Limitations
- **Educational Scope**: FinSta does not execute live stock trades or wire real money between bank accounts.
- **Local Database**: Chat histories and profiles are persisted locally in SQLite on the user's system.
- **Tax Jurisdiction**: Focuses on core principles (deductions, capital gains, tax-advantaged accounts) rather than localized tax filing algorithms across every regional municipal jurisdiction.

### Future Roadmap
1. **Open Banking & Plaid / Account Aggregator Integration**: Securely connect read-only bank feeds to auto-categorize real transactions into the 50/30/20 budget.
2. **Voice Interface & Multilingual Support**: Integrate Web Speech API and multilingual LLM prompts for seamless voice coaching in Spanish, Hindi, French, and German.
3. **RAG Knowledge Base over Verified Finance Publications**: Vector database (Chroma/FAISS) loaded with authoritative educational materials (e.g., Investopedia, CFP board guidelines).
4. **Push Notification Habit Reminders**: Optional Web Push alerts for payday budget reviews and goal progress check-ins.

---

## 🎙️ 3-Minute Demo Presentation Script

**[0:00 - 0:30] Hook & Introduction**
> *"Hi everyone! We all know that managing money can feel overwhelming. Many people struggle with budgeting, understanding loan interest, or figuring out how to invest without drowning in financial jargon. Generic FAQ bots either hallucinate numbers or sound like robotic textbooks. That's why we built **FinSta — Your Smart Money Sidekick**."*

**[0:30 - 1:15] Architecture & Mathematical Calculators**
> *"FinSta is a full-stack financial coach built with React, Tailwind, and FastAPI. The biggest innovation in FinSta is that it **never guesses the math**. When I type: 'Calculate my EMI on a $250,000 mortgage at 6.5% for 20 years', FinSta's NLP layer classifies the intent, extracts the loan parameters, and executes our exact built-in financial calculator as a tool. Look at the screen: it returns the exact monthly payment of $1,863.93, total interest, and immediately renders an interactive Amortization Schedule Chart right inside the chat bubble!"*

**[1:15 - 2:00] Visual Financial Scenarios & Compounding**
> *"Let's test compound interest: 'If I invest $500 a month for 15 years at 10% return, how much will I have?' FinSta instantly calculates that my $90,000 in contributions grows into over $209,000 thanks to compound gains — visualised clearly with our compound growth chart. FinSta also features full multi-currency support, allowing users to toggle between Dollars, Rupees, Euros, and Pounds seamlessly."*

**[2:00 - 2:40] Safety, PII Protection & Personalization**
> *"Now let's test safety. What if a user accidentally types their credit card number? Watch this: FinSta immediately masks the card number, displays a privacy shield banner, and ensures sensitive data is never leaked. If someone mentions a get-rich-quick crypto scam, FinSta flags the risk. In the Profile Memory tab, users can store their income, expenses, and risk tolerance, or hit 'Clear My Data' for total privacy."*

**[2:40 - 3:00] Conclusion & Vision**
> *"Users can summarize their chats with one click, or export the full conversation to Markdown and PDF. FinSta bridges the gap between educational empathy and mathematical precision. Thank you!"*

---

*Made with 💚 by the FinSta Engineering Team.*
