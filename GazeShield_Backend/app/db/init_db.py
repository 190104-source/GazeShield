from app.db.database import Base, engine

# IMPORT ALL MODELS HERE 👇 (VERY IMPORTANT)
from app.models.user import User
from app.models.team import Team
from app.models.team_member import TeamMember

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
