"""
Run with: python seed.py
Wipes and repopulates the SQLite database with realistic sample meetings.
"""
import datetime as dt
import random

from app.database import Base, engine, SessionLocal
from app import models
from app.seed_data import MEETINGS, PALETTE

# Average speaking pace: ~2.6 seconds per line + a few seconds of natural pause
SECONDS_PER_LINE_MIN = 6
SECONDS_PER_LINE_MAX = 16


def initial_of(name: str) -> str:
    parts = name.split()
    return (parts[0][0] + (parts[-1][0] if len(parts) > 1 else "")).upper()


def color_for(name: str, mapping: dict) -> str:
    if name not in mapping:
        mapping[name] = PALETTE[len(mapping) % len(PALETTE)]
    return mapping[name]


def build():
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    random.seed(42)

    now = dt.datetime.utcnow()

    for m in MEETINGS:
        meeting = models.Meeting(
            title=m["title"],
            host_name=m["participants"][0],
            host_initial=initial_of(m["participants"][0]),
            meeting_date=now - dt.timedelta(days=m["days_ago"], hours=random.randint(0, 6)),
            duration_seconds=0,  # computed below
            language="English (Global)",
            audio_url="/audio/sample-meeting.mp3",
            overview=m["overview"],
            is_starred=random.random() < 0.2,
        )
        db.add(meeting)
        db.flush()

        color_map = {}
        for name in m["participants"]:
            db.add(
                models.Participant(
                    meeting_id=meeting.id,
                    name=name,
                    initial=initial_of(name),
                    color=color_for(name, color_map),
                )
            )

        for topic in m["topics"]:
            db.add(models.Topic(meeting_id=meeting.id, name=topic))

        for idx, (assignee, text) in enumerate(m["action_items"]):
            db.add(
                models.ActionItem(
                    meeting_id=meeting.id,
                    order_index=idx,
                    text=text,
                    assignee=assignee,
                    completed=random.random() < 0.25,
                )
            )

        cursor = 0.0
        for idx, (speaker, text) in enumerate(m["dialogue"]):
            duration = random.uniform(SECONDS_PER_LINE_MIN, SECONDS_PER_LINE_MAX) + len(text) * 0.04
            start = cursor
            end = cursor + duration
            db.add(
                models.TranscriptSegment(
                    meeting_id=meeting.id,
                    order_index=idx,
                    speaker_name=speaker,
                    speaker_color=color_for(speaker, color_map),
                    start_time=round(start, 1),
                    end_time=round(end, 1),
                    text=text,
                )
            )
            cursor = end + random.uniform(0.3, 1.2)

        meeting.duration_seconds = int(cursor)

    db.commit()
    count = db.query(models.Meeting).count()
    seg_count = db.query(models.TranscriptSegment).count()
    print(f"Seeded {count} meetings with {seg_count} transcript segments total.")
    db.close()


if __name__ == "__main__":
    build()
