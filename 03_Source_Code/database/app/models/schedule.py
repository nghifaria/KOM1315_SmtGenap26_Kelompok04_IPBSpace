from app.core.database import Base
from sqlalchemy import Date, Integer, Date, Time
from sqlalchemy.orm import Mapped, mapped_column

class Schedule(Base):
    """
    Schedule model representing a booking schedule for a facility.
    """

    __tablename__ = "schedules"

    id : Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date : Mapped[Date] = mapped_column(Date, nullable=False)
    start_time : Mapped[Time] = mapped_column(Time, nullable=False)
    end_time : Mapped[Time] = mapped_column(Time, nullable=False)