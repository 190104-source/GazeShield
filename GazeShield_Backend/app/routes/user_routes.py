from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.core.auth_utils import hash_password
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

# -------------------------
# HELPER FUNCTION TO VALIDATE PASSWORD
# -------------------------


# REGISTER OWNER
@router.post("/register-owner", response_model=UserResponse)
def register_owner(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        is_owner=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# REGISTER NORMAL USER
@router.post("/register-user", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
       password_hash=hash_password(user.password),
        is_owner=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# GET ALL REGISTERED USERS
@router.get("/", summary="Get all registered users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()
    return [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "role": "Owner" if user.is_owner else "User"
        }
        for user in users
    ]


# GET USER BY ID
@router.get("/{user_id}")
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": "Owner" if user.is_owner else "User"
    }





