import enum

class StatusApproval(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"
    CHECKED_IN = "checked-in"