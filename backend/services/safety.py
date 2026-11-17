import os
import re
import time
from typing import Tuple, Dict, Any, List, Optional

# In-memory sliding rate limiter per client IP / session
RATE_LIMIT_STORE: Dict[str, List[float]] = {}
MAX_REQUESTS_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", 20))


def check_rate_limit(client_id: str, max_requests: int = MAX_REQUESTS_PER_MINUTE) -> bool:
    """Returns True if within rate limit (20 req/min default), False if exceeded."""
    now = time.time()
    if client_id not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[client_id] = [now]
        return True

    # Keep timestamps within last 60 seconds
    valid_window = [ts for ts in RATE_LIMIT_STORE[client_id] if now - ts < 60]
    if len(valid_window) >= max_requests:
        RATE_LIMIT_STORE[client_id] = valid_window
        return False

    valid_window.append(now)
    RATE_LIMIT_STORE[client_id] = valid_window
    return True


def mask_sensitive_data(text: str) -> Tuple[str, List[str]]:
    """
    Scans for and masks:
    - Credit / debit cards (13-19 digits)
    - Indian PAN cards ([A-Z]{5}[0-9]{4}[A-Z])
    - US Social Security Numbers (XXX-XX-XXXX)
    - Indian Aadhaar numbers (12 digits, XXXX XXXX XXXX or raw 12 digits)
    - Bank account numbers
    - Passwords / PINs
    - One-Time Passwords (OTPs)
    Returns (masked_text, list_of_warnings).
    """
    warnings = []
    masked = text

    # Credit card pattern: 16 digits, with optional spaces or dashes
    cc_pattern = r"\b(?:\d{4}[-\s]?){3}\d{4}\b"
    if re.search(cc_pattern, masked):
        masked = re.sub(cc_pattern, "[MASKED_CARD_NUMBER]", masked)
        warnings.append("FinSta detected a potential credit/debit card number. We masked it for your privacy.")

    # US SSN pattern: 000-00-0000
    ssn_pattern = r"\b\d{3}[-\s]\d{2}[-\s]\d{4}\b"
    if re.search(ssn_pattern, masked):
        masked = re.sub(ssn_pattern, "[MASKED_SSN]", masked)
        warnings.append("FinSta detected and masked a Social Security Number (SSN). Never share personal government IDs in chat.")

    # Indian Aadhaar pattern: 12 digits, often 4-4-4 or labelled aadhaar
    aadhaar_spaced = r"\b\d{4}\s\d{4}\s\d{4}\b"
    aadhaar_labeled = r"(?i)\b(?:aadhaar|uidai|aadhar)\s*[:=]?\s*(\d{12})\b"
    if re.search(aadhaar_spaced, masked) or re.search(aadhaar_labeled, masked):
        masked = re.sub(aadhaar_spaced, "[MASKED_AADHAAR]", masked)
        masked = re.sub(aadhaar_labeled, "Aadhaar: [MASKED_AADHAAR]", masked)
        warnings.append("FinSta detected and masked an Indian Aadhaar number for your privacy.")

    # Indian PAN pattern: 5 uppercase letters, 4 digits, 1 uppercase letter
    pan_pattern = r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
    if re.search(pan_pattern, masked, re.I):
        masked = re.sub(pan_pattern, "[MASKED_PAN]", masked)
        warnings.append("FinSta detected and masked an Indian PAN number for your privacy.")

    # Generic bank account / long numeric identifiers (9 to 18 digits)
    acct_pattern = r"\b(?:account|acct|acc#?)\s*[:=]?\s*(\d{9,18})\b"
    if re.search(acct_pattern, masked, re.I):
        masked = re.sub(acct_pattern, "account: [MASKED_ACCOUNT_NUMBER]", masked, flags=re.I)
        warnings.append("FinSta detected and masked a bank account number.")

    # OTP / One-Time Password
    otp_pattern = r"(?i)\b(?:otp|one[- ]time[- ]password|verification[- ]code)\s*(?:is\s*|[:=]\s*)?(\d{4,8})\b"
    if re.search(otp_pattern, masked):
        masked = re.sub(otp_pattern, "OTP: [MASKED_OTP]", masked)
        warnings.append("FinSta detected and masked a one-time password (OTP). Never share OTPs.")

    # Password / PIN keywords
    pwd_pattern = r"\b(?:password|pwd|pin|cvv|cvc)\s*[:=]?\s*([^\s]{3,20})\b"
    if re.search(pwd_pattern, masked, re.I):
        masked = re.sub(pwd_pattern, r"\g<0>".split("=")[0] + ": [MASKED_SECRET]", masked, flags=re.I)
        warnings.append("FinSta detected and masked a sensitive secret or PIN.")

    return masked, warnings


def detect_scams_and_risks(text: str) -> Optional[str]:
    """Detect high-risk financial schemes, get-rich-quick scams, or crypto pumps."""
    lower = text.lower()
    scam_signals = [
        "guaranteed return", "guaranteed 100%", "double my money in", "double your money in",
        "risk-free 50%", "risk free 100%", "send crypto to get", "crypto pump",
        "pump and dump", "secret loophole to get rich", "make 1000 a day guaranteed",
        "binary options signal", "telegram investment group"
    ]
    for signal in scam_signals:
        if signal in lower:
            return (
                "⚠️ **Safety Alert from FinSta**: That request appears to mention high-risk or potentially fraudulent investment schemes (like guaranteed returns or quick doubling of money). In finance, higher returns always involve higher risk, and legitimate financial institutions NEVER guarantee astronomical short-term profits. Please protect your hard-earned money and be cautious of unsolicited investment tips!"
            )
    return None


def detect_distress(text: str) -> Optional[str]:
    """Detect emotional or acute financial distress and offer compassionate assistance & helplines."""
    lower = text.lower()
    distress_triggers = [
        "can't afford food", "cannot afford food", "losing my home", "eviction notice",
        "going bankrupt", "drowning in debt", "suicidal over money", "want to end my life",
        "hopeless with debt", "can't pay rent and feed"
    ]
    for trigger in distress_triggers:
        if trigger in lower:
            return (
                "💙 **FinSta is here with you, and you are not alone.** Financial stress can feel overwhelming, but there is always a path forward step-by-step.\n\n"
                "Here are immediate free and confidential resources:\n"
                "- **If you are experiencing a mental health emergency:** Call or text **988** (US/Canada Suicide & Crisis Lifeline) or contact local emergency services immediately.\n"
                "- **Debt & Credit Relief:** Reach out to the **National Foundation for Credit Counseling (NFCC)** at [nfcc.org](https://www.nfcc.org) for certified, non-profit credit and budgeting guidance.\n"
                "- **Local Aid & Utility Relief:** Dial **211** (US) or visit [211.org](https://www.211.org) to find emergency food, housing, and utility payment assistance programs in your community.\n\n"
                "Whenever you feel ready, we can take a calm look at your current numbers together to prioritize essential survival costs (food, shelter, utilities) first."
            )
    return None


def sanitize_prompt_injection(text: str) -> str:
    """Neutralize common prompt injection techniques."""
    # Filter common boundary override tokens
    patterns = [
        r"(?i)ignore\s+(all\s+)?previous\s+instructions",
        r"(?i)system\s*prompt",
        r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
        r"(?i)jailbreak",
        r"(?i)disregard\s+prior\s+guidance"
    ]
    cleaned = text
    for p in patterns:
        cleaned = re.sub(p, "[REDACTED_INSTRUCTION]", cleaned)
    return cleaned
