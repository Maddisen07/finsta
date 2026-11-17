import json
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from db import get_db
from models import ChatSession, ChatMessage, UserProfile
from schemas import ChatRequest, ChatMessageSchema, ChatSessionSchema, SummarizeRequest, UserProfileSchema
from services.safety import check_rate_limit, mask_sensitive_data, detect_scams_and_risks, detect_distress, sanitize_prompt_injection
from services.nlp import classify_intent, extract_entities
from services.llm import stream_chat_response

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class SaveTurnRequest(BaseModel):
    session_id: str
    user_message: str
    assistant_message: str
    intent: Optional[str] = None
    entities: Optional[dict] = None
    tool_calls: Optional[list] = None
    chart_data: Optional[dict] = None


@router.get("/sessions", response_model=List[ChatSessionSchema])
def list_chat_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    results = []
    for s in sessions:
        results.append(ChatSessionSchema(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages=[
                ChatMessageSchema(
                    id=m.id,
                    session_id=m.session_id,
                    sender=m.sender,
                    content=m.content,
                    intent=m.intent,
                    entities=json.loads(m.entities_json) if m.entities_json else None,
                    tool_calls=json.loads(m.tool_calls_json) if m.tool_calls_json else None,
                    chart_data=json.loads(m.chart_data_json) if m.chart_data_json else None,
                    created_at=m.created_at
                )
                for m in s.messages
            ]
        ))
    return results


@router.get("/sessions/{session_id}", response_model=ChatSessionSchema)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = [
        ChatMessageSchema(
            id=m.id,
            session_id=m.session_id,
            sender=m.sender,
            content=m.content,
            intent=m.intent,
            entities=json.loads(m.entities_json) if m.entities_json else None,
            tool_calls=json.loads(m.tool_calls_json) if m.tool_calls_json else None,
            chart_data=json.loads(m.chart_data_json) if m.chart_data_json else None,
            created_at=m.created_at
        )
        for m in session.messages
    ]

    return ChatSessionSchema(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages
    )


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": f"Session {session_id} deleted"}


@router.post("")
async def chat_endpoint(chat_req: ChatRequest, req: Request, db: Session = Depends(get_db)):
    # 1. Rate limiting check
    client_ip = req.client.host if req.client else "127.0.0.1"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute before messaging again.")

    # 2. Input length check
    raw_text = chat_req.message.strip()
    if len(raw_text) > 2000:
        raise HTTPException(status_code=400, detail="Message exceeds maximum limit of 2,000 characters.")

    # 3. Mask sensitive data (SSN, credit card, PAN, bank account)
    masked_text, pii_warnings = mask_sensitive_data(raw_text)
    sanitized_text = sanitize_prompt_injection(masked_text)

    # 4. Check for session
    session_id = chat_req.session_id or str(uuid.uuid4())
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        # Title from first 5 words
        title_words = sanitized_text.split()[:5]
        title = " ".join(title_words) if title_words else "New Conversation"
        session = ChatSession(id=session_id, title=title)
        db.add(session)
        db.commit()

    # 5. Fetch recent conversation history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.id.desc())
        .limit(6)
        .all()
    )
    history = [{"role": m.sender, "content": m.content} for m in reversed(past_messages)]

    # 6. Fetch user profile
    profile = db.query(UserProfile).first()
    profile_schema = None
    if profile:
        profile_schema = UserProfileSchema(
            currency=profile.currency,
            monthly_income=profile.monthly_income,
            monthly_expenses=profile.monthly_expenses,
            risk_tolerance=profile.risk_tolerance,
            primary_goal=profile.primary_goal
        )
    elif chat_req.user_profile:
        profile_schema = chat_req.user_profile

    # Determine currency
    currency_code = chat_req.currency or (profile_schema.currency if profile_schema else "USD")

    # Safety: check for distress or scams
    scam_warning = detect_scams_and_risks(sanitized_text)
    distress_msg = detect_distress(sanitized_text)

    async def sse_event_generator():
        # Heartbeat initial ping
        yield ": ping\n\n"

        # Inform frontend of session_id and any PII masking warnings
        initial_payload = {
            "session_id": session_id,
            "masked_input": masked_text if masked_text != raw_text else None,
            "pii_warnings": pii_warnings
        }
        yield f"data: {json.dumps(initial_payload)}\n\n"

        if distress_msg:
            yield f"data: {json.dumps({'chunk': distress_msg})}\n\n"
            yield f"data: {json.dumps({'done': True, 'follow_ups': ['How do I prioritize bills during hardship?', 'How can I lower monthly utility bills?', 'What is a hardship plan?']})}\n\n"
            return

        if scam_warning:
            yield f"data: {json.dumps({'chunk': scam_warning})}\n\n"
            yield f"data: {json.dumps({'done': True, 'follow_ups': ['What are realistic investment returns?', 'How do I identify a financial scam?', 'What are safe investments for beginners?']})}\n\n"
            return

        async for sse_chunk in stream_chat_response(
            message=sanitized_text,
            conversation_history=history,
            user_profile=profile_schema,
            currency_code=currency_code
        ):
            if await req.is_disconnected():
                break
            yield sse_chunk

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/save-turn")
def save_chat_turn(turn: SaveTurnRequest, db: Session = Depends(get_db)):
    """Saves user and assistant messages at the end of a streaming exchange."""
    session = db.query(ChatSession).filter(ChatSession.id == turn.session_id).first()
    if not session:
        session = ChatSession(id=turn.session_id, title=turn.user_message[:40])
        db.add(session)
        db.commit()

    user_msg = ChatMessage(
        session_id=turn.session_id,
        sender="user",
        content=turn.user_message,
        intent=turn.intent,
        entities_json=json.dumps(turn.entities) if turn.entities else None
    )
    db.add(user_msg)

    asst_msg = ChatMessage(
        session_id=turn.session_id,
        sender="assistant",
        content=turn.assistant_message,
        intent=turn.intent,
        tool_calls_json=json.dumps(turn.tool_calls) if turn.tool_calls else None,
        chart_data_json=json.dumps(turn.chart_data) if turn.chart_data else None
    )
    db.add(asst_msg)

    session.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "session_id": turn.session_id}


@router.post("/summarize")
def summarize_conversation(req: SummarizeRequest, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
    if not session or not session.messages:
        raise HTTPException(status_code=404, detail="No conversation history to summarize.")

    message_texts = [f"{m.sender.upper()}: {m.content}" for m in session.messages]
    intents = list({m.intent for m in session.messages if m.intent})

    summary = (
        f"### 📋 FinSta Financial Conversation Summary\n\n"
        f"**Session:** {session.title}\n"
        f"**Key Topics Explored:** {', '.join(intents) if intents else 'General Personal Finance'}\n"
        f"**Total Exchanges:** {len(session.messages)} messages\n\n"
        f"#### Core Insights & Key Numbers:\n"
        f"- We reviewed your financial scenarios with exact calculations and personalized formulas.\n"
        f"- You examined structured strategies (such as budget splits, debt repayment priorities, or investment compounding).\n\n"
        f"#### Action Plan:\n"
        f"1. **Confirm Your Base Numbers:** Review your monthly essential expenses and reserve funds.\n"
        f"2. **Automate Transfers:** Set up recurring transfers on payday for your savings or debt payoff goals.\n"
        f"3. **Stay Consistent:** Keep following your plan and revisit your calculations whenever your income or interest rates change.\n\n"
        f"> *Disclaimer: Educational information, not professional financial advice.*"
    )

    return {"summary": summary, "session_title": session.title}
