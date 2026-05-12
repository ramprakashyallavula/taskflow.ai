from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics_service import get_user_analytics_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsSummary:
    summary = get_user_analytics_summary(db, current_user.id)
    return AnalyticsSummary(**summary)
