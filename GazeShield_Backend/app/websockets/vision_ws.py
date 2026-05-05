from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio


class VisionSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()

        async with self._lock:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()

            self.active_connections[session_id].add(websocket)

    async def disconnect(self, session_id: str, websocket: WebSocket):
        async with self._lock:
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)

                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, payload: dict):
        if session_id not in self.active_connections:
            return

        dead = set()

        for ws in self.active_connections[session_id]:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.add(ws)

        for ws in dead:
            await self.disconnect(session_id, ws)

    # 🔴 CRITICAL FOR STOP SESSION
    async def close_session(self, session_id: str):
        async with self._lock:
            sockets = self.active_connections.pop(session_id, set())

        for ws in sockets:
            try:
                await ws.close(code=1000)
            except Exception:
                pass


vision_ws_manager = VisionSocketManager()
