import enum

class UserRoles(str, enum.Enum):
    """
    Enumeration for user roles in the system.
    """
    ADMIN = "admin"
    CIVITAS = "civitas"
    FACILITY_MANAGER = "facility_manager"