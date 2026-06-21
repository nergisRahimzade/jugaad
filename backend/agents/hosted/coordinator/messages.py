"""Wire format — copy this file into each hosted agent project that needs it."""

QUERY_PREFIX = "JUGAAD_QUERY|"
RESPONSE_PREFIX = "JUGAAD_RESPONSE|"


def format_query(request_id: str, user_message: str) -> str:
    return f"{QUERY_PREFIX}{request_id}|{user_message}"


def parse_query(text: str) -> tuple[str, str] | None:
    if not text.startswith(QUERY_PREFIX):
        return None
    body = text[len(QUERY_PREFIX) :]
    request_id, _, user_message = body.partition("|")
    if not request_id or not user_message:
        return None
    return request_id, user_message


def format_response(request_id: str, domain: str, summary: str, recommendations: list[str]) -> str:
    rec_block = ";;".join(recommendations[:5])
    return f"{RESPONSE_PREFIX}{request_id}|{domain}|{summary}||{rec_block}"


def parse_response(text: str) -> tuple[str, str, str, list[str]] | None:
    if not text.startswith(RESPONSE_PREFIX):
        return None
    body = text[len(RESPONSE_PREFIX) :]
    parts = body.split("|", 3)
    if len(parts) < 4:
        return None
    request_id, domain, summary, rec_block = parts[0], parts[1], parts[2], parts[3]
    recommendations = [r for r in rec_block.split(";;") if r]
    return request_id, domain, summary, recommendations
