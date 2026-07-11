from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


@router.get("", response_model=List[schemas.MeetingListItem])
def list_meetings(
    search: Optional[str] = Query(default=None),
    participant: Optional[str] = Query(default=None),
    sort: str = Query(default="recent", pattern="^(recent|oldest|title|duration)$"),
    db: Session = Depends(get_db),
):
    return crud.list_meetings(db, search=search, participant=participant, sort=sort)


@router.post("", response_model=schemas.MeetingDetail, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = crud.create_meeting(db, payload)
    return meeting


@router.get("/{meeting_id}", response_model=schemas.MeetingDetail)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.put("/{meeting_id}", response_model=schemas.MeetingDetail)
def update_meeting(meeting_id: str, payload: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return crud.update_meeting(db, meeting, payload)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    crud.delete_meeting(db, meeting)
    return None


@router.post("/{meeting_id}/action-items", response_model=schemas.ActionItemOut, status_code=201)
def add_action_item(meeting_id: str, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    meeting = crud.get_meeting(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return crud.add_action_item(db, meeting, payload)


@router.put("/{meeting_id}/action-items/{item_id}", response_model=schemas.ActionItemOut)
def update_action_item(meeting_id: str, item_id: int, payload: schemas.ActionItemUpdate, db: Session = Depends(get_db)):
    item = crud.get_action_item(db, item_id)
    if not item or item.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Action item not found")
    return crud.update_action_item(db, item, payload)


@router.delete("/{meeting_id}/action-items/{item_id}", status_code=204)
def delete_action_item(meeting_id: str, item_id: int, db: Session = Depends(get_db)):
    item = crud.get_action_item(db, item_id)
    if not item or item.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Action item not found")
    crud.delete_action_item(db, item)
    return None
