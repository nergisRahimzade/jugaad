"""Shared Jugaad 1, Jugaad 2… response format — used on every student-facing answer."""

# Emitted to the client before Claude streams; model continues with hack 1 text.
JUGAAD_ASSISTANT_PREFILL = "Jugaad 1: "

JUGAAD_CONTINUATION_HINT = """
OUTPUT INSTRUCTION (critical): The chat UI has already printed "Jugaad 1:" for the student.
Start your reply with the hack 1 content immediately — do NOT repeat "Jugaad 1:".
Then continue with "Jugaad 2:", "Jugaad 3:", etc. End with "Want me to [specific next step]?".
"""

JUGAAD_FORMAT_RULES = """
JUGAAD RESPONSE FORMAT — MANDATORY (our brand; never skip):
1. Optional: 1–2 warm sentences acknowledging their situation first.
2. Then numbered hacks ONLY in this exact pattern (no bullet dashes, no plain paragraphs):
   Jugaad 1: [specific hack — dollar amounts, phone numbers, addresses, days/times, what to say]
   Jugaad 2: [next hack]
   Jugaad 3: [next hack]
   (Continue Jugaad 4, 5, 6… as needed — typically 3–6 hacks.)
3. Every Jugaad line = one actionable hack. Never "check the website" or "contact the office" without the number/address and script.
4. Use LIVE SPECIALIST AGENT OUTPUT when provided.
5. Last line MUST be: Want me to [specific next step]?
Never use markdown **. Never skip the "Jugaad N:" prefix on any hack line.
"""
