import json
import uuid
from models.student import StudentProfile, IntakeSession
from prompts.intake import INTAKE_SYSTEM, EXTRACTION_PROMPT, OPENING_MESSAGE
from core.arize_logger import logged_complete

# In-memory session store — Person 3's Redis will slot in here without touching routers
_sessions: dict[str, IntakeSession] = {}

MIN_QUESTIONS = 6


def start_session() -> tuple[str, str]:
    """Create a new intake session and return (session_id, first_question)."""
    session_id = str(uuid.uuid4())
    session = IntakeSession(session_id=session_id)
    session.messages = [
        {"role": "assistant", "content": OPENING_MESSAGE}
    ]
    session.questions_asked = 1
    _sessions[session_id] = session
    return session_id, OPENING_MESSAGE


def continue_session(session_id: str, answer: str) -> dict:
    """
    Process the student's answer, decide whether to ask another question
    or extract the profile.
    Returns: {"message": str, "is_complete": bool, "profile": dict | None}
    """
    session = _sessions.get(session_id)
    if not session:
        raise ValueError(f"Session not found: {session_id}")

    if session.is_complete:
        return {
            "message": "Your profile is already complete.",
            "is_complete": True,
            "profile": session.profile.model_dump() if session.profile else None,
        }

    # Append student's answer to message history
    session.messages.append({"role": "user", "content": answer})

    # Decide: ask more or extract
    if session.questions_asked >= MIN_QUESTIONS:
        result = _try_extract(session)
        if result:
            return result

    # Ask next question
    response = logged_complete(
        system=INTAKE_SYSTEM,
        messages=session.messages,
        max_tokens=150,
        trace_name="intake",
    )
    session.messages.append({"role": "assistant", "content": response})
    session.questions_asked += 1

    # Check if Claude signaled completion in its response
    if "let me pull up what you qualify for" in response.lower():
        result = _try_extract(session)
        if result:
            return result

    return {
        "message": response,
        "is_complete": False,
        "profile": None,
        "questions_asked": session.questions_asked,
    }


def _try_extract(session: IntakeSession) -> dict | None:
    """Attempt to extract a StudentProfile from the conversation."""
    conversation = "\n".join(
        f"{'Student' if m['role'] == 'user' else 'Jugaad'}: {m['content']}"
        for m in session.messages
    )

    extraction_prompt = EXTRACTION_PROMPT.format(conversation=conversation)

    raw = logged_complete(
        system="You are a JSON extractor. Output only valid JSON.",
        messages=[{"role": "user", "content": extraction_prompt}],
        max_tokens=400,
        trace_name="intake_extract",
    )

    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        profile_data = json.loads(clean)
        profile = StudentProfile(**profile_data)
        session.profile = profile
        session.is_complete = True

        completion_msg = (
            "Got it — I've built your profile. Let me pull up everything you qualify for."
        )
        session.messages.append({"role": "assistant", "content": completion_msg})

        return {
            "message": completion_msg,
            "is_complete": True,
            "profile": profile.model_dump(),
            "questions_asked": session.questions_asked,
        }
    except Exception:
        return None


def get_session(session_id: str) -> IntakeSession | None:
    return _sessions.get(session_id)
