from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base

# Models (ensure tables are registered)
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models import session_mode
from app.models import face_encoding

# Routers
from app.routes.user_routes import router as user_router
from app.routes.team_routes import router as team_router
from app.routes.auth_routes import router as auth_router
from app.routes import session_routes
from app.routes import vision
from app.routes import face_status
from app.routes.vision_routes import router as vision_router
from app.routes.vision_ws_routes import router as vision_ws_router

# 🔥 ADD THIS IMPORT
from app.routes.face_routes import router as face_router


# ✅ CREATE APP ONCE
app = FastAPI(title="GazeShield API")

# ✅ ADD CORS IMMEDIATELY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 🔥 allow all during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ CREATE TABLES
Base.metadata.create_all(bind=engine)

# ✅ INCLUDE ROUTERS
app.include_router(auth_router)
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(team_router, prefix="/teams", tags=["Teams"])
app.include_router(session_routes.router)
app.include_router(vision.router)
app.include_router(face_status.router)
app.include_router(vision_router)
app.include_router(vision_ws_router)

# 🔥 ADD THIS LINE (DO NOT REMOVE ANYTHING ABOVE)
app.include_router(face_router)



# ✅ ROOT + HEALTH (frontend-friendly)
@app.get("/")
def root():
    return {"message": "GazeShield Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}