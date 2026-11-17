import pytest
from services.nlp import classify_intent, extract_entities
from services.safety import mask_sensitive_data, detect_scams_and_risks, detect_distress


SAMPLE_QUERIES = [
    # 1. Budgeting
    ("How should I budget my $5,000 monthly salary using the 50/30/20 rule?", "budgeting"),
    ("What percentage of my income should go to rent and essential expenses?", "budgeting"),
    # 2. Savings
    ("How do I build a 6-month emergency fund for rainy days?", "savings"),
    ("Where is the best place to keep my liquid savings account?", "savings"),
    # 3. Loans
    ("Calculate my loan EMI for a 200,000 mortgage at 6.5% interest over 20 years", "loans"),
    ("What will my monthly car loan payment be on $25,000 at 5% APR?", "loans"),
    # 4. Investments
    ("If I start a SIP of $500 per month in an index fund with 10% expected return, what is the compound growth?", "investments"),
    ("Should I invest in mutual funds or ETFs for long-term wealth creation?", "investments"),
    # 5. Retirement
    ("How much do I need to save in my 401k to retire comfortably at 65?", "retirement"),
    ("Explain the difference between a Roth IRA and a traditional pension", "retirement"),
    # 6. Debt
    ("Should I use the debt avalanche or debt snowball method to pay off my credit cards?", "debt"),
    ("I have 3 credit card balances with high APR. How do I clear my debt faster?", "debt"),
    # 7. Taxes Basic
    ("What are the basic tax deductions and standard deduction rules?", "taxes_basic"),
    ("How does long-term capital gains tax work on stock investments?", "taxes_basic"),
    # 8. Out of Scope
    ("Can you give me a recipe for chocolate chip cookies?", "out_of_scope"),
    ("Who won the 2022 football world cup and what were the scores?", "out_of_scope"),
    ("Write a python script to play tic tac toe game", "out_of_scope"),
    # 9. General
    ("Hi FinSta, what can you help me with?", "general")
]


@pytest.mark.parametrize("query,expected_intent", SAMPLE_QUERIES)
def test_intent_classification(query, expected_intent):
    intent, confidence = classify_intent(query)
    assert intent == expected_intent, f"Failed for query '{query}': got '{intent}', expected '{expected_intent}'"
    assert confidence > 0.3


def test_entity_extraction_monetary_amounts():
    text = "I earn $6,000 a month and want to buy a $350,000 house with 7.5% loan interest rate for 30 years."
    entities = extract_entities(text)
    assert entities["currency_detected"] == "USD"
    assert entities["interest_rate"] == 7.5
    assert entities["tenure_years"] == 30
    assert entities["tenure_months"] == 360
    assert 6000.0 in entities["amounts"] or entities["income"] == 6000.0


def test_entity_extraction_indian_format():
    text = "My monthly salary is ₹80,000 and I want to start a SIP of 10k for 15 years with 12% return."
    entities = extract_entities(text)
    assert entities["currency_detected"] == "INR"
    assert entities["interest_rate"] == 12.0
    assert entities["tenure_years"] == 15
    assert 80000.0 in entities["amounts"] or entities["income"] == 80000.0
    assert 10000.0 in entities["amounts"]


def test_mask_sensitive_credit_card():
    text = "Here is my credit card 4111 2222 3333 4444 to pay off."
    masked, warnings = mask_sensitive_data(text)
    assert "[MASKED_CARD_NUMBER]" in masked
    assert "4111 2222 3333 4444" not in masked
    assert len(warnings) > 0


def test_mask_sensitive_ssn_and_pan():
    text = "My SSN is 123-45-6789 and PAN is ABCDE1234F"
    masked, warnings = mask_sensitive_data(text)
    assert "[MASKED_SSN]" in masked
    assert "[MASKED_PAN]" in masked
    assert "123-45-6789" not in masked
    assert "ABCDE1234F" not in masked


def test_scam_detection():
    scam_text = "Is this telegram bot promising guaranteed 100% returns in 24 hours legit?"
    warning = detect_scams_and_risks(scam_text)
    assert warning is not None
    assert "Safety Alert" in warning


def test_distress_detection():
    distress_text = "I am drowning in debt and can't afford food or rent, I feel hopeless."
    response = detect_distress(distress_text)
    assert response is not None
    assert "988" in response
    assert "NFCC" in response


def test_mask_sensitive_aadhaar_and_otp():
    text = "My Aadhaar is 1234 5678 9012 and my bank OTP is 654321"
    masked, warnings = mask_sensitive_data(text)
    assert "[MASKED_AADHAAR]" in masked
    assert "[MASKED_OTP]" in masked
    assert "1234 5678 9012" not in masked
    assert "654321" not in masked
    assert len(warnings) == 2


def test_three_tier_model_opinion_and_basics():
    from services.llm import get_financial_coaching_response

    # Basics test: "what is a stock"
    basics_res = get_financial_coaching_response("what is a stock", "$")
    assert basics_res is not None
    chunks, follow_ups = basics_res
    full_text = "".join(chunks)
    assert "fractional ownership" in full_text
    assert len(follow_ups) > 0

    # Opinion test: "rent vs buy"
    opinion_res = get_financial_coaching_response("rent vs buy", "$")
    assert opinion_res is not None
    o_chunks, o_follow_ups = opinion_res
    o_text = "".join(o_chunks)
    assert "My view:" in o_text
    assert "The counter-argument:" in o_text
    assert "When this view changes:" in o_text
    assert "Educational information, not professional financial advice." in o_text
