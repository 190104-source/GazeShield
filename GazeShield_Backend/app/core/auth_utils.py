from datetime import datetime, timedelta, timezone # Use timezone
from jose import jwt
import hashlib
from passlib.context import CryptContext

# Move these to a config/env file later    
SECRET_KEY = "your_secret_key_here" 
ALGORITHM = "HS256"                                                                                                                               
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def normalize_password(password: str) -> str:
    # strip() removes accidental whitespace, encode() handles UTF-8
    return hashlib.sha256(password.strip().encode()).hexdigest()

def hash_password(password: str) -> str:
    print(f"--- DEBUG START ---")
    print(f"Original Input: {password}")
    
    # This is the magic part that shrinks the password
    safe = normalize_password(password)
    
    print(f"SHA256 Result: {safe}")
    print(f"SHA256 Length: {len(safe)}") # This SHOULD be 64
    print(f"--- DEBUG END ---")
    
    return pwd_context.hash(safe)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(normalize_password(plain_password), hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    # Using the modern timezone-aware approach
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)