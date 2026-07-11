"""
Raw seed content used by seed.py.
Each meeting has: title, days_ago, participants, overview, topics,
action_items, and a dialogue list of (speaker, text) tuples.
Timestamps are auto-computed from dialogue order in seed.py.
"""

PALETTE = ["#EC4899", "#F97316", "#22C55E", "#06B6D4", "#8B5CF6", "#EAB308", "#EF4444", "#14B8A6"]

MEETINGS = [
    {
        "title": "Q3 Product Roadmap Sync",
        "days_ago": 1,
        "participants": ["Danish Kodavanti", "Priya Sharma", "Rohan Mehta", "Alina Cruz"],
        "overview": (
            "The team reviewed Q3 roadmap priorities, focusing on the new fee-management module "
            "and its rollout timeline. Engineering flagged risk around the installment queue-locking "
            "logic, and the group agreed to timebox a spike before committing to the release date. "
            "Design walked through updated dashboard mocks, and the meeting closed with clear owners "
            "for the remaining open items."
        ),
        "topics": ["roadmap planning", "fee management module", "release timeline", "design review"],
        "action_items": [
            ("Danish Kodavanti", "Finish installment queue-locking spike by Thursday"),
            ("Priya Sharma", "Share updated dashboard Figma link with the team"),
            ("Rohan Mehta", "Confirm QA availability for the Q3 release window"),
            ("Alina Cruz", "Draft release notes template for fee module"),
        ],
        "dialogue": [
            ("Priya Sharma", "Alright, let's get started. Today we're mainly looking at the Q3 roadmap and where the fee management module stands."),
            ("Danish Kodavanti", "Sounds good. Quick status — backend for installments and challan generation is basically done, just polishing the caching layer."),
            ("Priya Sharma", "Nice. How's the Redis integration holding up under load?"),
            ("Danish Kodavanti", "Pretty solid so far. We're invalidating cache across controllers now, so stale data issues from before are mostly gone."),
            ("Rohan Mehta", "That was the bug where fee summaries showed old amounts after a payment, right?"),
            ("Danish Kodavanti", "Yeah exactly. Root cause was embedded student data not getting refreshed. Fixed now with the invalidation hooks."),
            ("Alina Cruz", "Good catch. What about the queue-locking logic for installments? I saw that flagged as a risk."),
            ("Danish Kodavanti", "That's the trickiest part. We need to make sure two admins can't edit the same installment queue at once and cause a race condition."),
            ("Rohan Mehta", "Are we doing optimistic or pessimistic locking there?"),
            ("Danish Kodavanti", "Leaning pessimistic for now since fee edits are low frequency, but I want to spike it before committing to a timeline."),
            ("Priya Sharma", "Let's timebox that. Can you have a spike done by Thursday?"),
            ("Danish Kodavanti", "Yeah, Thursday works."),
            ("Priya Sharma", "Great, moving to design. Alina, want to walk us through the new dashboard mocks?"),
            ("Alina Cruz", "Sure. We simplified the admin fee dashboard — added a summary card at the top showing collected versus pending amounts."),
            ("Rohan Mehta", "I like that. Is the installment breakdown still in a table below?"),
            ("Alina Cruz", "Yes, same table but with clearer status chips — paid, due, overdue."),
            ("Priya Sharma", "Can you share that Figma link after this call so engineering can review?"),
            ("Alina Cruz", "Will do, I'll drop it in the channel right after."),
            ("Rohan Mehta", "On the QA side, I'll need to check availability for the release window, we have another project wrapping up the same week."),
            ("Priya Sharma", "Please confirm that today if you can, it affects our release date."),
            ("Rohan Mehta", "Understood, I'll confirm by end of day."),
            ("Danish Kodavanti", "One more thing — should release notes mention the caching changes or just the visible features?"),
            ("Alina Cruz", "Just visible features for the customer-facing notes, we can keep the technical stuff in internal docs."),
            ("Priya Sharma", "Agreed. Alina can you draft that release notes template this week?"),
            ("Alina Cruz", "Yep, I'll have a draft ready by Friday."),
            ("Priya Sharma", "Perfect. I think that covers everything, thanks all."),
        ],
    },
    {
        "title": "Engineering Standup — Backend Squad",
        "days_ago": 2,
        "participants": ["Danish Kodavanti", "Kabir Anand", "Neha Iyer"],
        "overview": (
            "Daily standup covering backend progress on the ERP fee module. The team discussed the "
            "cross-controller cache invalidation fix, remaining edge cases in challan PDF generation, "
            "and a blocked ticket related to academic year normalization. No major blockers were raised "
            "outside of waiting on the shared staging database refresh."
        ),
        "topics": ["standup", "cache invalidation", "challan generation", "staging environment"],
        "action_items": [
            ("Kabir Anand", "Refresh staging database with latest seed data"),
            ("Neha Iyer", "Write unit tests for normalizeAcademicYear helper"),
            ("Danish Kodavanti", "Open PR for challan PDF browser-print fix"),
        ],
        "dialogue": [
            ("Danish Kodavanti", "I'll go first. Yesterday I finished the cross-controller cache invalidation for fee updates and payment records."),
            ("Kabir Anand", "Did that fix the stale balance issue we saw in QA?"),
            ("Danish Kodavanti", "Yeah, tested it against the same steps and balances update immediately now."),
            ("Neha Iyer", "Nice. I'm still working on the academic year normalization helper, some old records use a different year format."),
            ("Danish Kodavanti", "Right, that's the truncation bug — normalizeAcademicYear should handle both formats now."),
            ("Neha Iyer", "I'll add unit tests today to cover the mismatched formats so we don't regress."),
            ("Kabir Anand", "I'm blocked a bit on testing since staging DB is out of date, some new students aren't reflected there."),
            ("Danish Kodavanti", "I can refresh staging with the latest seed data after standup."),
            ("Kabir Anand", "That'd help a lot, thanks."),
            ("Neha Iyer", "Also, quick one — the challan PDF still has a spacing issue when printing from the browser."),
            ("Danish Kodavanti", "Yeah I noticed that too, margin's off on Chrome specifically. I'll open a PR today for the print CSS fix."),
            ("Kabir Anand", "Anything blocking for me to look at, or should I just continue on the participant import feature?"),
            ("Danish Kodavanti", "Continue on that, nothing blocking from my side."),
            ("Neha Iyer", "Same, no blockers, just heads down on the helper tests."),
            ("Danish Kodavanti", "Cool, sounds like a short one today. Let's sync again tomorrow."),
        ],
    },
    {
        "title": "Design Review: Student Portal Onboarding",
        "days_ago": 4,
        "participants": ["Alina Cruz", "Sana Malhotra", "Danish Kodavanti"],
        "overview": (
            "Reviewed the redesigned onboarding flow for the student portal, including the new fee "
            "payment entry point. Feedback centered on reducing steps to the first payment and improving "
            "mobile responsiveness. Team agreed on a simplified 3-step flow and scheduled a follow-up "
            "usability test."
        ),
        "topics": ["onboarding flow", "student portal", "mobile responsiveness", "usability testing"],
        "action_items": [
            ("Alina Cruz", "Update onboarding flow to 3 steps in Figma"),
            ("Sana Malhotra", "Schedule usability testing session with 5 students"),
            ("Danish Kodavanti", "Estimate backend effort for simplified onboarding"),
        ],
        "dialogue": [
            ("Alina Cruz", "So this is the current onboarding flow — five steps before a student sees their fee dashboard."),
            ("Sana Malhotra", "Five feels like a lot honestly, especially on mobile where every screen adds friction."),
            ("Danish Kodavanti", "Agreed from a data standpoint too, some of these steps just collect info we could infer from existing records."),
            ("Alina Cruz", "Which steps do you think we could merge?"),
            ("Danish Kodavanti", "Guardian details and contact info could be one screen instead of two, we already have most of it from admission records."),
            ("Sana Malhotra", "And the fee acknowledgment step could just be a checkbox on the summary screen instead of its own page."),
            ("Alina Cruz", "That gets us down to three steps — welcome, confirm details, and fee summary with payment option."),
            ("Danish Kodavanti", "That works well for the backend too, fewer API round trips during onboarding."),
            ("Sana Malhotra", "On mobile specifically, the current fee table overflows horizontally, we should switch to stacked cards below a certain width."),
            ("Alina Cruz", "Good point, I'll adjust the responsive breakpoints in the mockups."),
            ("Danish Kodavanti", "Should we validate this with actual students before building it out fully?"),
            ("Sana Malhotra", "Yes, let's run a quick usability test, maybe five students, before we finalize."),
            ("Alina Cruz", "I'll have the updated three-step flow ready in Figma by tomorrow."),
            ("Sana Malhotra", "I'll reach out to a few students today to schedule the session."),
            ("Danish Kodavanti", "I'll put together a rough backend estimate once I see the final flow."),
            ("Alina Cruz", "Perfect, let's regroup once we have testing feedback."),
        ],
    },
    {
        "title": "Sprint Planning — Fee Module Release 2.1",
        "days_ago": 6,
        "participants": ["Priya Sharma", "Danish Kodavanti", "Kabir Anand", "Rohan Mehta", "Neha Iyer"],
        "overview": (
            "Sprint planning for release 2.1 of the fee management module. The team scoped installment "
            "queue-locking, receipt generation improvements, and the participant bulk-import feature. "
            "Story points were estimated and assigned, with a focus on finishing queue-locking early in "
            "the sprint to unblock QA."
        ),
        "topics": ["sprint planning", "installment queue-locking", "receipt generation", "bulk import"],
        "action_items": [
            ("Danish Kodavanti", "Implement installment queue-locking backend logic"),
            ("Kabir Anand", "Build participant bulk-import CSV parser"),
            ("Rohan Mehta", "Write test plan for receipt generation edge cases"),
            ("Neha Iyer", "Review and merge normalizeAcademicYear PR"),
        ],
        "dialogue": [
            ("Priya Sharma", "Let's plan sprint scope for release 2.1. Top priority is installment queue-locking, since it's blocking QA sign-off."),
            ("Danish Kodavanti", "I can take that. Based on the spike, pessimistic locking with row-level locks should work and won't need major schema changes."),
            ("Priya Sharma", "Great, how many points would you put on that?"),
            ("Danish Kodavanti", "I'd say 8 points, there's some complexity around handling timeouts if a lock is held too long."),
            ("Priya Sharma", "Fair enough. Kabir, you mentioned bulk import for participants last week — is that ready to start?"),
            ("Kabir Anand", "Yeah, I've got the CSV schema figured out, just need to build the parser and validation."),
            ("Priya Sharma", "How many points?"),
            ("Kabir Anand", "5 points feels right, including error reporting for bad rows."),
            ("Rohan Mehta", "For QA, I want to make sure receipt generation covers partial payments and refunds too, not just full payments."),
            ("Priya Sharma", "Good call, can you write up a test plan for those edge cases?"),
            ("Rohan Mehta", "Yes, I'll have that ready early in the sprint so dev can reference it."),
            ("Neha Iyer", "My PR for the academic year normalization helper is up, just needs a review."),
            ("Priya Sharma", "I'll assign that to Danish or Kabir once queue-locking is further along."),
            ("Neha Iyer", "Sounds good, no rush on my end."),
            ("Priya Sharma", "Alright, let's also flag dependencies — queue-locking needs to land before Rohan's edge case testing can really start."),
            ("Danish Kodavanti", "I'll prioritize getting a working version out by mid-sprint so QA isn't blocked till the end."),
            ("Priya Sharma", "Perfect, that's the plan. Let's check in mid-sprint on progress."),
        ],
    },
    {
        "title": "Client Onboarding Call — Greenfield Academy",
        "days_ago": 8,
        "participants": ["Danish Kodavanti", "Meera Nair", "James Okafor"],
        "overview": (
            "Kickoff call with Greenfield Academy to onboard their school onto the multi-tenant ERP "
            "platform. Discussed data migration from their existing spreadsheet-based system, fee "
            "structure configuration, and a rollout timeline targeting the start of the next term."
        ),
        "topics": ["client onboarding", "data migration", "fee structure setup", "rollout timeline"],
        "action_items": [
            ("Meera Nair", "Send existing student and fee spreadsheet for migration"),
            ("Danish Kodavanti", "Set up tenant configuration for Greenfield Academy"),
            ("James Okafor", "Confirm go-live date with school leadership"),
        ],
        "dialogue": [
            ("Meera Nair", "Thanks for hopping on. We're excited to move off spreadsheets and onto the new system before next term."),
            ("Danish Kodavanti", "Happy to help get that set up. Can you tell me roughly how many students and fee categories you're dealing with?"),
            ("Meera Nair", "About 650 students across primary and secondary, with maybe six or seven different fee categories including transport and hostel."),
            ("Danish Kodavanti", "That's very manageable. If you can share the existing spreadsheet, I can map the fields to our schema for migration."),
            ("James Okafor", "I'll get that spreadsheet cleaned up and sent over this week."),
            ("Danish Kodavanti", "Perfect. On our side, each school runs as its own tenant, so I'll set up Greenfield's tenant configuration once I have your branding details — logo, colors, that sort of thing."),
            ("Meera Nair", "We can send our logo and brand guide along with the spreadsheet."),
            ("Danish Kodavanti", "Great. For the fee structure, do installments follow a fixed schedule, or does it vary by class?"),
            ("James Okafor", "Mostly fixed — three installments per term, though hostel fees are billed separately."),
            ("Danish Kodavanti", "Understood, that maps cleanly onto our installment model, we'll just configure hostel as its own fee category."),
            ("Meera Nair", "What's a realistic timeline for go-live?"),
            ("Danish Kodavanti", "Once we have the data, migration and setup usually takes about a week, then a week of testing with your admin staff."),
            ("James Okafor", "That lines up well with the start of next term. I'll confirm the exact go-live date with school leadership."),
            ("Meera Nair", "Sounds like a plan. We'll get the spreadsheet and brand assets over by Thursday."),
            ("Danish Kodavanti", "Great, I'll start on tenant configuration as soon as I receive them."),
        ],
    },
    {
        "title": "Retro — Sprint 14 Wrap-up",
        "days_ago": 10,
        "participants": ["Priya Sharma", "Danish Kodavanti", "Kabir Anand", "Neha Iyer"],
        "overview": (
            "Sprint 14 retrospective. The team celebrated shipping the challan/receipt generation "
            "feature on time, discussed friction around unclear ticket descriptions, and agreed on "
            "small process changes for the next sprint including clearer acceptance criteria."
        ),
        "topics": ["sprint retrospective", "process improvement", "ticket quality"],
        "action_items": [
            ("Priya Sharma", "Add acceptance criteria template to ticket creation process"),
            ("Danish Kodavanti", "Document caching invalidation pattern for future reference"),
            ("Neha Iyer", "Share testing checklist used for the academic year fix"),
        ],
        "dialogue": [
            ("Priya Sharma", "Let's start with what went well this sprint."),
            ("Danish Kodavanti", "Shipping challan and receipt generation on time felt good, especially since the PDF formatting took longer than expected."),
            ("Kabir Anand", "Agreed, and the cache invalidation fix seemed to resolve a bunch of related bugs we didn't even file separately."),
            ("Neha Iyer", "The academic year normalization fix went smoothly too, tests caught the edge cases before it hit staging."),
            ("Priya Sharma", "Great. What didn't go well, or could be improved?"),
            ("Kabir Anand", "Honestly a couple tickets were vague, I had to ping Danish mid-sprint to clarify scope on the bulk import ticket."),
            ("Danish Kodavanti", "Yeah same, a few tickets didn't have clear acceptance criteria, so we were guessing at done-ness."),
            ("Priya Sharma", "That's fair feedback, let's add an acceptance criteria template when creating tickets going forward."),
            ("Neha Iyer", "That would help a lot, especially for anything touching shared logic like the caching layer."),
            ("Danish Kodavanti", "Speaking of which, I don't think we have documentation on the cache invalidation pattern anywhere, I'll write that up."),
            ("Priya Sharma", "Good idea, that'll help onboard people faster too."),
            ("Neha Iyer", "I can also share the testing checklist I used for the academic year fix, might be useful as a general template."),
            ("Priya Sharma", "Let's action all three of those. Anything else before we close out?"),
            ("Kabir Anand", "Nothing from me, overall a solid sprint."),
            ("Priya Sharma", "Agreed, thanks everyone, see you at planning."),
        ],
    },
    {
        "title": "1:1 — Danish & Priya",
        "days_ago": 12,
        "participants": ["Danish Kodavanti", "Priya Sharma"],
        "overview": (
            "One-on-one check-in covering workload balance between the school ERP project and Danish's "
            "coursework, career growth interests in backend architecture, and feedback on recent PRs. "
            "Priya offered to loop Danish into the upcoming system design discussion."
        ),
        "topics": ["workload check-in", "career growth", "code review feedback"],
        "action_items": [
            ("Priya Sharma", "Add Danish to upcoming system design discussion invite"),
            ("Danish Kodavanti", "Share current coursework schedule for the next month"),
        ],
        "dialogue": [
            ("Priya Sharma", "Hey, how's everything going, especially balancing this with your coursework?"),
            ("Danish Kodavanti", "It's manageable, some weeks are tighter than others depending on deadlines, but nothing unmanageable right now."),
            ("Priya Sharma", "Good to hear. Let me know if that changes, we can always adjust sprint load."),
            ("Danish Kodavanti", "Will do, thanks."),
            ("Priya Sharma", "On the technical side, your PRs around the caching layer were really solid, clean invalidation logic."),
            ("Danish Kodavanti", "Thanks, that one took a few iterations to get right, especially reasoning about which controllers needed to invalidate what."),
            ("Priya Sharma", "It showed. Are you still interested in going deeper into backend architecture longer term?"),
            ("Danish Kodavanti", "Yeah definitely, distributed systems stuff especially, I've been tinkering with a task scheduler project on the side."),
            ("Priya Sharma", "That's great, actually there's a system design discussion coming up for the next platform iteration, I'll loop you in."),
            ("Danish Kodavanti", "I'd really appreciate that, thank you."),
            ("Priya Sharma", "Of course. Can you share your coursework schedule for the next month so I can plan sprint load around it?"),
            ("Danish Kodavanti", "Sure, I'll send that over today."),
            ("Priya Sharma", "Perfect, that's all I had, thanks for the update."),
        ],
    },
    {
        "title": "Cross-team Sync: ERP + Analytics",
        "days_ago": 14,
        "participants": ["Danish Kodavanti", "Vikram Rao", "Sana Malhotra", "Alina Cruz"],
        "overview": (
            "Cross-team sync between the ERP fee module team and the analytics team to align on data "
            "requirements for the upcoming fee-collection dashboard. Agreed on an event schema for "
            "payment transactions and discussed how caching might affect data freshness for analytics."
        ),
        "topics": ["cross-team alignment", "analytics integration", "event schema", "data freshness"],
        "action_items": [
            ("Danish Kodavanti", "Draft payment transaction event schema"),
            ("Vikram Rao", "Set up analytics pipeline to consume new event schema"),
            ("Sana Malhotra", "Define required metrics for fee-collection dashboard"),
        ],
        "dialogue": [
            ("Vikram Rao", "Thanks for joining. We're building a fee-collection dashboard for school admins and need reliable event data from your side."),
            ("Danish Kodavanti", "Makes sense. Right now we log payment events internally but not in a structured format meant for analytics consumption."),
            ("Sana Malhotra", "For the dashboard, we mainly need total collected, pending, overdue amounts, broken down by class and fee category."),
            ("Danish Kodavanti", "That's doable. I think the cleanest way is emitting a structured event whenever a payment or installment status changes."),
            ("Vikram Rao", "Agreed, if you can define that schema, we can build the pipeline to consume it."),
            ("Danish Kodavanti", "I'll draft something with fields like meeting... sorry, student ID, fee category, amount, status, and timestamp."),
            ("Sana Malhotra", "Timestamp is important for us to track trends over time, monthly collection rates especially."),
            ("Danish Kodavanti", "Noted, I'll make sure that's precise, not just date but full timestamp."),
            ("Alina Cruz", "From a design side, will the dashboard need real-time updates, or is daily refresh okay?"),
            ("Vikram Rao", "Daily refresh should be fine for admins, this isn't a live operations dashboard."),
            ("Danish Kodavanti", "Good, that simplifies things. One thing to flag — we do cache some fee summaries for performance, so there might be slight lag before an event reflects everywhere."),
            ("Vikram Rao", "As long as it converges within a few minutes that's fine for our use case."),
            ("Danish Kodavanti", "Should be well within that after invalidation kicks in."),
            ("Sana Malhotra", "I'll put together the exact metrics list so Danish knows what fields to prioritize in the schema."),
            ("Danish Kodavanti", "That'll help, I'll wait for that before finalizing the draft."),
            ("Vikram Rao", "Sounds like a plan, let's reconvene once the schema draft is ready."),
        ],
    },
]
