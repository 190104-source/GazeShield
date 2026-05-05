GazeShield
Real-Time Intelligent Screen Privacy Protection Using Face Recognition and Gaze Monitoring

2)About the Project
GazeShield is a real-time computer vision-based security application 
that monitors user attention and detects unauthorized presence during 
screen-based activities. It uses facial recognition and head pose 
estimation to protect screen privacy and prevent shoulder surfing.

Built as a Final Year Project at Usha Mittal Institute of Technology, 
S.N.D.T. Women's University.

3)Tech Stack
Frontend: HTML, CSS, JavaScript, face-api.js (Web Worker)
Backend: Python, FastAPI, SQLAlchemy ORM
Database: SQLite / PostgreSQL
Desktop Agent:Python, pystray (OS-level overlay alerts)
Security:Wazuh SIEM Integration
Communication:WebSockets

4)Features
Gaze Monitoring — Detects when user looks away using 68 facial landmarks (yaw/pitch angles
Intruder Detection — Identifies unauthorized faces in the frame
Exam Mode — Flags hard head turns (>40°) for academic integrity
Team Monitoring — Multi-user monitoring for enterprise environments
Evidence Collection— Captures and stores violation snapshots
SIEM Integration — Exports security events to Wazuh for centralized logging
Desktop Agent — Real-time OS-level overlay alerts via pystray

5) Screenshots
<img width="906" height="471" alt="image" src="https://github.com/user-attachments/assets/ed10db01-013c-4fa3-88c7-ce4c96ceffdd" />
(Frontend)
<img width="968" height="544" alt="image" src="https://github.com/user-attachments/assets/a30236c5-8881-441b-a3a5-1c556f83f5fc" />
(Security Alert)
 6) How to Run

 Prerequisites
- Python 3.9+
- Node.js
- pip

7) Steps
bash
i] Clone the repository
git clone https://github.com/yourusername/gazeshield.git

ii] Install backend dependencies
pip install -r requirements.txt

iii] Run the FastAPI backend
uvicorn main:app --reload

iv]Open frontend in browser
open index.html

8) Architecture
- Face Recognition Pipeline: face-api.js with TinyFaceDetector, 
  descriptors stored in IndexedDB
- Head Pose Estimation: 68 landmark-based yaw/pitch calculation
- Real-time Communication: WebSocket via vision_ws_routes.py
- Analytics: Risk scores and session statistics via analytics_service.py

9) My Contribution
- Built the frontend using React — pages, components and UI flow
- Developed and integrated REST API endpoints for frontend-backend communication
- Connected frontend to backend APIs for real-time data exchange
- Worked on database schema design and queries

10) Future Enhancements
- Liveness detection to prevent photo/video spoofing
- Audio-based alert detection
- Mobile application for remote monitoring
