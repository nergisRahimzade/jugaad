"""Berkeley-specific hack knowledge per domain (Section 5 of strategy doc)."""

DOMAIN_KNOWLEDGE: dict[str, dict] = {
    "food": {
        "summary": "Stack CalFresh, pantry, free food calendar, and surplus network for near-zero food budget.",
        "recommendations": [
            "CalFresh Stacking: CalFresh ($292/mo) + MLK food pantry (weekly) + Grab N Go meals + club catering + BSFC sliding-scale + Market Match at Saturday farmers market.",
            "CalFresh Loopholes: Half-time + work-study = qualified regardless of income; OR 20+ hrs/week work; OR employment training; OR CalWORKs — Jugaad walks each exemption.",
            "Free Food Calendar: Live crowdsourced calendar of club meetings, speaker series, dept receptions, and cultural org dinners with free food.",
            "Food Surplus Network: Real-time surplus postings — e.g. '12 servings pasta, Soda Hall, 45 min' — redistributes food that would be trashed.",
            "Meal Co-Op Matching: Match nearby students into meal-sharing groups — 5 students cooking rotation = ~80% cheaper than solo cooking.",
        ],
        "resources": [
            {"name": "CalFresh FAQ", "url": "https://basicneeds.berkeley.edu/faq/calfresh", "value": "$292/month", "effort": "30 min application"},
            {"name": "Food Pantry (MLK lower level)", "url": "https://basicneeds.berkeley.edu/pantry", "value": "Weekly groceries", "effort": "Walk-in"},
        ],
        "urgency": "high",
    },
    "housing": {
        "summary": "Co-op secret, emergency bridge, rent control, and lease protection for Berkeley students.",
        "recommendations": [
            "BSC Co-Op Secret: Berkeley Student Cooperative — 30–50% cheaper than dorms, meals included, rolling admissions. Most first-gen/international students never hear about it.",
            "Summer Sublet Conversion: Take summer sublet at 40–60% discount, then offer full lease in August — landlords often prefer you over new applicants.",
            "Rent Control: Pre-1980 Berkeley apartments have annual caps set by Rent Board — push back on illegal increases.",
            "Lease Red-Flag Scanner: Upload lease — AI flags predatory clauses, illegal deposits, missing habitability terms.",
            "Emergency Bridge Housing: Basic Needs matches temporary housing between semesters when leases have gaps.",
        ],
        "resources": [
            {"name": "BSC Co-ops", "url": "https://bsc.coop", "value": "30–50% cheaper", "effort": "Application + interview"},
            {"name": "Basic Needs Emergency Housing", "url": "https://basicneeds.berkeley.edu", "value": "Bridge housing", "effort": "Same-day intake"},
        ],
        "urgency": "high",
    },
    "wellness": {
        "summary": "Bypass CAPS wait times with Let's Talk, SHIP therapists, urgent pathway, and peer support.",
        "recommendations": [
            "Let's Talk Drop-Ins: Free informal counseling at multiple campus locations — no appointment, no paperwork. Most students never hear of it.",
            "SHIP Therapist Bypass: Off-campus therapists covered by SHIP with NO referral — same-week openings while Tang Center has 3-week waits.",
            "Urgent Appointment Trick: CAPS same-day urgent slots exist — communicate urgency when you walk in; you don't need full crisis status.",
            "24/7 Counseling Line: 855-817-5667 — free for all Berkeley students, any time. Not just crisis — stress, anxiety, relationships.",
            "Peer Support Circles: AI-matched groups of 4–6 students facing similar challenges with structured check-in prompts.",
        ],
        "resources": [
            {"name": "CAPS Counseling", "url": "https://uhs.berkeley.edu/counseling", "value": "Let's Talk + urgent slots", "effort": "Drop-in or call"},
            {"name": "24/7 Counseling Line", "url": "tel:8558175667", "value": "Free 24/7 support", "effort": "Call anytime"},
        ],
        "urgency": "high",
    },
    "financial_aid": {
        "summary": "Appeals, emergency loans, fee plans, and Basic Needs fund when FAFSA is paused or insufficient.",
        "recommendations": [
            "Special Circumstances Appeal: Recalculate aid on CURRENT income (job loss, medical, divorce) — can add thousands. Most students don't know this exists.",
            "Emergency Loan Bridge: Short-term loans with minimal paperwork while FAFSA processing is paused (post April 2026).",
            "Fee Payment Plan: Spread tuition across semester instead of one lump — combine with emergency loan to survive FAFSA delay.",
            "Basic Needs Holistic Fund: One-time emergency assistance for food, housing deposits, immediate crises — simpler application than most think.",
            "Micro-Scholarship Scan: Hundreds of $500–$2,000 awards across departments with few applicants — see Scholarship Agent for matches.",
        ],
        "resources": [
            {"name": "Financial Aid Office", "url": "https://financialaid.berkeley.edu", "value": "Appeals + emergency aid", "effort": "Online form"},
            {"name": "Federal Aid Updates", "url": "https://financialaid.berkeley.edu/apply-now/apply-for-aid/federal-updates/", "value": "FAFSA pause guidance", "effort": "5 min read"},
        ],
        "urgency": "high",
    },
    "scholarship": {
        "summary": "Micro-scholarship scan across Berkeley departments, cultural centers, and foundations.",
        "recommendations": [
            "Department Scholarships: Many $500–$2,000 awards per major with few applicants — financialaid.berkeley.edu + department pages.",
            "Cultural Center Awards: Scholarships through identity-based centers often overlooked by general searches.",
            "Professional Org Micro-Grants: Engineering, pre-med, and business societies with rolling small awards.",
            "Essay Reuse Strategy: One strong personal statement adapted per micro-scholarship — Jugaad pre-fills from your profile.",
            "Deadline Stack: Apply to 5+ small awards this week — cumulative impact rivals one large scholarship.",
        ],
        "resources": [
            {"name": "Berkeley Financial Aid Scholarships", "url": "https://financialaid.berkeley.edu", "value": "$500–$5,000 awards", "effort": "Varies per award"},
        ],
        "urgency": "medium",
    },
    "safety": {
        "summary": "Walking buddies, safe routes, SafeWalk, and community safety pulse for late-night campus travel.",
        "recommendations": [
            "Walking Buddy Matching: 'Leaving Main Stacks at 11pm to Unit 2' → match students heading same direction in next 10 minutes.",
            "Smart Safe Route: Oxford over Telegraph after 10pm — 3 min longer, better lit, fewer recent incidents.",
            "SafeWalk On-Demand: Request CSO escort via app — frictionless voice request through Jugaad.",
            "Community Safety Pulse: Anonymous real-time flags (sketchy situation on Durant) aggregated for area alerts.",
            "Blue Light + UCPD: Save non-emergency UCPD line; use blue light phones if uncomfortable.",
        ],
        "resources": [
            {"name": "Campus Safety (UCPD)", "url": "https://ucpd.berkeley.edu", "value": "SafeWalk + emergency", "effort": "Call or app"},
        ],
        "urgency": "medium",
    },
    "academic": {
        "summary": "Enrollment strategy, BerkeleyTime patterns, study groups, and prerequisite navigation.",
        "recommendations": [
            "Instructor Email Strategy: Genuine email to instructor can unlock permission codes — Jugaad knows which departments respond.",
            "UC Extension Backdoor: Full main-campus class? Extension equivalent may count toward degree with open enrollment.",
            "BerkeleyTime Pattern Analysis: Which sections have drops, which professors' sections fill slower — enrollment STRATEGY not hope.",
            "Prerequisite Soft vs Hard: Some prereqs are recommended not required — don't delay schedule unnecessarily.",
            "Study Group Matching: For high-failure courses (CS 10, CS 61A, EECS 127) — matched groups pass at higher rates.",
        ],
        "resources": [
            {"name": "BerkeleyTime", "url": "https://berkeleytime.com", "value": "Grade + workload data", "effort": "Free"},
            {"name": "Class Schedule", "url": "https://classes.berkeley.edu", "value": "Enrollment + holds", "effort": "CalNet login"},
        ],
        "urgency": "medium",
    },
}
