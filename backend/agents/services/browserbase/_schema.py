"""Shared JSON schemas for Browserbase Fetch JSON extraction.

A single ``RESOURCE_LIST_SCHEMA`` covers food/housing/financial_aid because the
fields a Berkeley student cares about (name, value, deadline, eligibility) are
the same across domains. Per-domain finders re-use it.
"""

RESOURCE_LIST_SCHEMA: dict = {
    "type": "object",
    "properties": {
        "resources": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Resource or program name as it appears on the page.",
                    },
                    "description": {
                        "type": "string",
                        "description": "One- or two-sentence summary in the student's voice.",
                    },
                    "url": {
                        "type": "string",
                        "description": "Direct application or info URL, when present.",
                    },
                    "phone": {
                        "type": "string",
                        "description": "Phone number if listed.",
                    },
                    "dollar_value": {
                        "type": "string",
                        "description": "Cash value or grant amount, e.g. '$292/month'.",
                    },
                    "deadline": {
                        "type": "string",
                        "description": "Application deadline if quoted.",
                    },
                    "eligibility": {
                        "type": "string",
                        "description": "Eligibility filter — citizenship, year, major, income.",
                    },
                    "effort_level": {
                        "type": "string",
                        "description": "How long it takes, e.g. '5 min online form'.",
                    },
                },
                "required": ["name"],
            },
        },
    },
    "required": ["resources"],
}
