QUERY_PREFIX = "JUGAAD_QUERY|"
RESPONSE_PREFIX = "JUGAAD_RESPONSE|"


def format_response(request_id: str, domain: str, summary: str, recommendations: list[str]) -> str:
    rec_block = ";;".join(recommendations[:5])
    return f"{RESPONSE_PREFIX}{request_id}|{domain}|{summary}||{rec_block}"


def parse_query(text: str) -> tuple[str, str] | None:
    if not text.startswith(QUERY_PREFIX):
        return None
    body = text[len(QUERY_PREFIX) :]
    request_id, _, user_message = body.partition("|")
    if not request_id or not user_message:
        return None
    return request_id, user_message
