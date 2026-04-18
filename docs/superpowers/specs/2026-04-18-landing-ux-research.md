# Landing UX Research + Redesign Proposal — 2026-04-18

> Working doc. Owner: Khanh. Status: awaiting direction pick.

## Problem

Current landing (Phase 1, shipped 2026-04-17) answers "what roles exist?" but doesn't answer "why should I come back tomorrow?" It's a functional utility, not a branded product. First-time visitors see 60 list rows, feel the data density, and bounce — or stay for one query and leave. There's no identity, no narrative, no Hook.

Recruiter POV (when evaluating this as portfolio): a well-executed list doesn't demonstrate UX craft. We need the design to *show the thinking* — persona-driven, psychologically grounded, with named interactions.

## Primary persona

### "Anxious Ace" — the overwhelmed pre-grad

| Dimension | Detail |
|-----------|--------|
| Role | 3rd–4th year CS / business / design undergrad |
| Context | Applying to 50–200 roles across Summer '26 or Fall '26 new-grad |
| Devices | Laptop primary (late-night applying), mobile secondary (commute/breaks) |
| Session rhythm | 2–4 check-ins per day, 5–20 minutes each, peaks at 9pm–1am |
| Tech savviness | High — uses Notion, LinkedIn, Sheets, sometimes a bug tracker |

**Goals (what they'd tell a friend):**
1. "Find roles before they get buried under 1,000 applicants"
2. "Know if I'm actually competitive — I can't tell from my resume alone"
3. "Reduce time wasted tailoring resumes for jobs I won't get"

**Frustrations (what they feel at 11pm):**
1. "I've applied to 80 places and heard back from 2. Am I doing something wrong?"
2. "LinkedIn shows 500 applicants — I don't even have a shot"
3. "Did I improve today? I can't tell. I feel like I'm spinning."

**Emotional state (the real job-to-be-done):**
- Surface emotion: overwhelm, low-grade anxiety, comparison spiral
- Deeper need: **signal of progress.** "Am I moving forward, or just treading water?"

**Quote** (synthesized from common student communities):
> "I spent three hours on one application tonight. Tomorrow I'll do it again. I have no idea if any of it is working."

## Jobs-to-be-done (functional vs emotional)

| Job | Functional framing | Emotional framing |
|-----|--------------------|-------------------|
| Find fresh roles | "show me newly posted internships" | "reassure me I haven't missed anything" |
| Score my fit | "match my resume to this JD" | "tell me I'm good enough for this" |
| Tailor fast | "rewrite bullets to match JD keywords" | "make me feel efficient, not desperate" |
| Track progress | "log where I applied" | "show me I'm doing something, not nothing" |

The last row is the **gap.** Current product is entirely functional. Emotional jobs go unmet.

## Hooked model analysis (Nir Eyal)

Why some products create habit and ours currently doesn't:

| Phase | What it needs | Current state |
|-------|--------------|--------------|
| **Trigger** (external → internal) | Push notif or time-of-day cue → internal "am I behind?" feeling | **None.** No reason to open the tab unless the user remembers. |
| **Action** (simplest possible) | One tap to see what's new | **Partial.** Landing loads fast, but shows a generic count, not a personal one. |
| **Variable Reward** | Each visit = something new + unpredictable | **Weak.** Same 60 rows each time. No "you have 3 new matches above 80%." |
| **Investment** | Each visit leaves something behind that makes next visit better | **Missing.** No saved searches, no watched companies, no streak, no profile deepening. |

The landing has to seed Trigger + Reward for first-time visitors, and Investment for returning ones.

## Three redesign directions

Each direction has the same functional guts (search + filter + role list). They differ in **what the top 600px says and what identity the product wears.**

### Direction A — "Daily Digest" (editorial / inbox metaphor)

**Hero treatment:** Day-stamped header. "Friday, April 18. 23 new roles overnight. 3 above 80% match for you."

**Identity:** Morning Brew / Feedly / Superhuman. A ritual, not a database.

**Psychology:** Hooked model, tight loop. Fresh content every day (variable reward). Streak counter ("7-day check-in streak"). Digest implies "short read, not an infinite scroll."

**Recruiter read:** "They understand information diet design. They designed a ritual."

**Tradeoff:** Needs a real daily-fresh-count query + streak storage. Slightly more backend work. Loses some of the "endless roles" feeling.

---

### Direction B — "Command Console" (doubling down on terminal aesthetic)

**Hero treatment:** Typewriter effect streaming personal stats. `> scanning 10,432 postings…` `> 3 new matches above 80%` `> you have 14 saved searches`. Interactive cursor.

**Identity:** GitHub / Linear / Raycast. For students who see themselves as operators, not supplicants.

**Psychology:** Identity reinforcement ("I'm not begging for a job, I'm running a campaign"). The terminal framing reframes job-searching from emotional → procedural, which **reduces anxiety** by giving control.

**Recruiter read:** "They committed to a visual language. The brand is consistent and distinctive."

**Tradeoff:** Niche aesthetic — some users might find it alienating. Needs a fallback for non-technical majors.

---

### Direction C — "Mirror" (you-as-the-hero)

**Hero treatment:** Big personal number. "Your resume matches 127 roles today. 12 strong, 34 stretch, 81 for breadth." (For unauthed users: "Upload a resume in 20 seconds to see yours.")

**Identity:** Strava / Duolingo / Finch — "here's how you're doing." Quantified self.

**Psychology:** The strongest answer to "am I good enough?" is a number. Showing the user themselves first, the roles second, flips the hierarchy from "data dump" → "mirror." Creates the feedback loop: upload better resume → number goes up → come back tomorrow.

**Recruiter read:** "They put the user at the center, not the data."

**Tradeoff:** Requires real match-scoring (Phase 1 of product roadmap — not yet shipped). Unauthed state becomes a conversion funnel, which some users find pushy.

## Brand voice (regardless of direction)

Lock this in first. Current voice is neutral technical ("live roles. updated hourly"). Proposed voice:

| Attribute | Current | Proposed |
|-----------|---------|----------|
| Register | Technical-utility | Technical-confident (operator voice) |
| Tense | Static ("42 live roles") | Present-active ("3 new matches just landed") |
| Person | Third-person data | Second-person user ("you have 3…") |
| Punctuation | Period-dominant | Comma-dominant, em-dash for emphasis |
| Example CTA | "sign up free" | "start your campaign" OR "see your numbers" |

## Recommendation

**Hybrid of A + C, keeping B's terminal aesthetic:**
- Hero is Direction C's mirror (personal-first number)
- Secondary strip is Direction A's digest ("12 new overnight, 3 over 80%")
- Visual language stays Phase 1 terminal (mono, stone, orange) — don't abandon existing brand equity

This gives:
- Personal entry for authed users (Investment + Reward)
- Daily-fresh framing for returning users (Trigger)
- Graceful unauthed state ("see yours" CTA) — conversion without guilt

## Open questions for you

1. **Which direction resonates?** A / B / C / hybrid?
2. **Voice:** are you OK with "campaign" / "operator" framing, or does it feel too aggressive for your users?
3. **Streak / gamification:** yes (Duolingo-style) or no (might feel manipulative for a job search)?
4. **Above-the-fold word budget:** current is 22 words. Willing to go to 35–40 for the richer hero?
5. **What's one thing you want a recruiter to say** when they visit your portfolio via this page?

## Next step

Once you pick a direction + answer 1–5, I'll write an implementation plan (files, components, copy strings, token usage) and start Phase 2a: landing-v2. This does NOT block Phase 2 auth/OAuth work — they can ship in parallel on separate branches.
