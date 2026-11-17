import re
from typing import Dict, Any, Tuple, Optional, List


INTENT_KEYWORDS = {
    "budgeting": [
        "budget", "budgeting", "50/30/20", "50-30-20", "spending", "expenses", "cut costs",
        "track money", "living costs", "salary allocation", "how should i divide my salary",
        "rule of thumb", "wants", "needs", "envelope system", "manage income",
        "car", "used car", "new car", "lease or buy", "car payment", "automobile", "insurance",
        "term insurance", "life insurance", "whole life", "net worth", "frugal", "save on groceries"
    ],
    "savings": [
        "saving", "savings", "emergency fund", "save up", "rainy day", "liquid cash",
        "hysa", "high yield savings", "savings account", "target amount", "save money",
        "deposit", "set aside", "down payment fund", "save", "cd", "certificate of deposit"
    ],
    "loans": [
        "loan", "loans", "emi", "mortgage", "car loan", "home loan", "personal loan",
        "interest rate", "borrow", "lender", "tenure", "principal", "repayment schedule",
        "amortization", "refinance", "down payment", "auto loan", "rent", "renting",
        "buy a house", "buy a home", "rent or buy", "real estate", "housing", "property",
        "pay off mortgage", "mortgage early"
    ],
    "investments": [
        "invest", "investment", "investing", "investments", "sip", "mutual fund", "index fund",
        "mutual funds", "index funds", "stock", "stocks", "share", "shares", "equity", "equities",
        "bond", "bonds", "etf", "etfs", "portfolio", "compound interest", "compounding", "returns",
        "wealth creation", "asset allocation", "dividend", "dividends", "risk tolerance",
        "s&p", "nasdaq", "dow jones", "nifty", "sensex", "market", "capital appreciation",
        "crypto", "bitcoin", "ethereum", "gold", "silver", "dca", "dollar cost averaging",
        "lump sum", "growth stock", "value stock", "recession", "bear market", "bull market",
        "passive investing", "active investing"
    ],
    "retirement": [
        "retire", "retirement", "401k", "ira", "roth", "roth ira", "pension", "superannuation",
        "fire", "financial independence", "annuity", "post-work", "golden years",
        "nest egg", "4% rule", "four percent rule", "retire early"
    ],
    "debt": [
        "debt", "debts", "credit card balance", "credit card debt", "avalanche", "snowball",
        "pay off", "pay down", "consolidation", "apr", "default", "overdue",
        "minimum payment", "clear debt", "credit card", "credit cards", "credit score", "fico",
        "debit card", "debit vs credit", "credit vs debit"
    ],
    "taxes_basic": [
        "tax", "taxes", "income tax", "capital gains", "deduction", "80c", "standard deduction",
        "w-2", "tax bracket", "tax saving", "tax filing", "tax liability", "capital gains tax"
    ],
    "out_of_scope": [
        "recipe", "bake", "weather", "python script", "code", "game",
        "president", "movie", "football", "world cup", "scores", "engine", "french",
        "symptoms", "lyrics", "poem", "cat", "dog", "song", "joke", "history of",
        "fifa", "basketball", "nba", "cricket match", "travel itinerary", "actor"
    ]
}


def parse_number_with_units(text: str) -> Optional[float]:
    """Parse strings like '10k', '2.5L', '1 crore', '50,000' into raw float."""
    clean = text.lower().replace(",", "").replace("$", "").replace("₹", "").replace("€", "").replace("£", "").strip()
    
    match_crore = re.search(r"([\d\.]+)\s*(?:cr|crore|crores)", clean)
    if match_crore:
        return float(match_crore.group(1)) * 10_000_000

    match_lakh = re.search(r"([\d\.]+)\s*(?:lakh|lakhs|lac|lacs|l)\b", clean)
    if match_lakh:
        return float(match_lakh.group(1)) * 100_000

    match_million = re.search(r"([\d\.]+)\s*(?:m|million|millions)\b", clean)
    if match_million:
        return float(match_million.group(1)) * 1_000_000

    match_k = re.search(r"([\d\.]+)\s*(?:k|thousand)\b", clean)
    if match_k:
        return float(match_k.group(1)) * 1_000

    match_plain = re.search(r"^[\d\.]+$", clean)
    if match_plain:
        try:
            return float(match_plain.group(0))
        except ValueError:
            return None

    return None


def extract_entities(text: str) -> Dict[str, Any]:
    entities: Dict[str, Any] = {
        "amounts": [],
        "interest_rate": None,
        "tenure_months": None,
        "tenure_years": None,
        "income": None,
        "expenses": None,
        "loan_amount": None,
        "goal_amount": None,
        "currency_detected": None
    }

    # Currency detection
    if "₹" in text or re.search(r"\b(inr|rupees?|lakh|crore)\b", text, re.I):
        entities["currency_detected"] = "INR"
    elif "€" in text or re.search(r"\b(eur|euros?)\b", text, re.I):
        entities["currency_detected"] = "EUR"
    elif "£" in text or re.search(r"\b(gbp|pounds?)\b", text, re.I):
        entities["currency_detected"] = "GBP"
    elif "$" in text or re.search(r"\b(usd|dollars?)\b", text, re.I):
        entities["currency_detected"] = "USD"

    # Interest rate extraction
    rate_match = re.search(r"([\d\.]+)\s*(?:%|percent(?:age)?|apr|p\.a\.)", text, re.I)
    if rate_match:
        try:
            entities["interest_rate"] = float(rate_match.group(1))
        except ValueError:
            pass

    # Tenure extraction (years or months)
    year_match = re.search(r"(\d+)\s*(?:years?|yrs?)\b", text, re.I)
    if year_match:
        try:
            years = int(year_match.group(1))
            entities["tenure_years"] = years
            entities["tenure_months"] = years * 12
        except ValueError:
            pass

    month_match = re.search(r"(\d+)\s*(?:months?|mos?)\b", text, re.I)
    if month_match:
        try:
            months = int(month_match.group(1))
            entities["tenure_months"] = months
            if not entities["tenure_years"]:
                entities["tenure_years"] = round(months / 12, 1)
        except ValueError:
            pass

    # Extract all monetary numbers
    money_pattern = r"(?:[\$₹€£]\s*[\d,]+(?:\.\d+)?(?:\s*(?:k|m|million|lakh|crore|cr))?|(?:\b[\d,]+(?:\.\d+)?\s*(?:k|m|million|lakh|crore|cr)\b)|(?:\b[\d,]{3,}(?:\.\d+)?\b))"
    raw_matches = re.findall(money_pattern, text, re.I)

    for rm in raw_matches:
        num = parse_number_with_units(rm)
        if num is not None and num > 0:
            entities["amounts"].append(num)

    # Contextual assignment of amounts
    lower = text.lower()
    if entities["amounts"]:
        main_amt = entities["amounts"][0]
        if any(w in lower for w in ["salary", "income", "earn", "make a month"]):
            entities["income"] = main_amt
        elif any(w in lower for w in ["spend", "expenses", "cost of living", "rent"]):
            entities["expenses"] = main_amt
        elif any(w in lower for w in ["borrow", "loan", "mortgage", "car loan", "principal"]):
            entities["loan_amount"] = main_amt
        elif any(w in lower for w in ["save for", "goal", "target", "retire with"]):
            entities["goal_amount"] = main_amt

    return entities


def classify_intent(text: str) -> Tuple[str, float]:
    """
    Classifies user message into:
    budgeting | savings | loans | investments | retirement | debt | taxes_basic | general | out_of_scope
    Returns (intent, confidence).
    """
    cleaned = text.lower().strip()

    # Greetings / identity questions
    if re.search(r"^(hi|hello|hey|greetings|who are you|what can you do|help)\b", cleaned):
        return "general", 0.95

    scores: Dict[str, float] = {intent: 0.0 for intent in INTENT_KEYWORDS}

    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", cleaned):
                weight = 1.0 + (len(kw.split()) * 0.5)
                scores[intent] += weight

    # Check for strong explicit tokens with regex boundaries
    if re.search(r"\b(tax|taxes|income tax|capital gains|tax bracket|deductions?)\b", cleaned):
        scores["taxes_basic"] += 4.0
    if re.search(r"\b(emi|mortgage|tenure|principal|home loan|car loan|rent or buy|renting vs buying|buy a house|buy a home)\b", cleaned):
        scores["loans"] += 3.5
    if re.search(r"\b(stock|stocks|shares?|equit(?:y|ies)|sip|compound interest|etfs?|mutual funds?|index funds?|bonds?)\b", cleaned):
        scores["investments"] += 3.0
    if re.search(r"\b(emergency fund|rainy day|hysa|savings account)\b", cleaned):
        scores["savings"] += 3.0
    if re.search(r"\b(avalanche|snowball|credit card balance|credit score|fico)\b", cleaned):
        scores["debt"] += 3.0
    if re.search(r"\b(50/30/20|50-30-20|needs and wants|budgeting|essential expenses|percentage of .*income|allocate my salary)\b", cleaned):
        scores["budgeting"] += 4.0
    if re.search(r"\b(401k|roth ira|traditional ira|pension|fire movement)\b", cleaned):
        scores["retirement"] += 3.0

    best_intent = max(scores, key=lambda k: scores[k])
    best_score = scores[best_intent]

    # Explicit out_of_scope keywords match
    if scores["out_of_scope"] > 0 and best_intent == "out_of_scope":
        return "out_of_scope", min(0.95, 0.6 + (scores["out_of_scope"] * 0.15))

    # If completely 0 across all categories
    if best_score == 0:
        financial_roots = [
            "money", "cash", "bank", "financial", "finance", "dollar", "rupee", "euro", "pound", "cost", "pay",
            "stock", "share", "equity", "fund", "invest", "bond", "save", "savings", "debt", "loan",
            "budget", "wealth", "asset", "crypto", "retire", "income", "tax", "inflation", "interest",
            "rent", "buy", "house", "home", "housing", "property", "estate", "spend", "car", "lease",
            "insurance", "salary", "earn", "bills", "net worth", "worth it", "opinion", "advise", "advice"
        ]
        if not any(fr in cleaned for fr in financial_roots):
            return "out_of_scope", 0.60
        return "general", 0.50

    confidence = min(0.98, round(0.45 + (best_score / 6.0), 2))
    return best_intent, confidence
