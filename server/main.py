from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai import analyze_message
from alerts import send_parent_alert
from models import SessionLocal, User, Message, Flag
import hashlib
import asyncio

app = FastAPI()

blocked_users = set()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_users = {}


# --- Schemas ---
class SignupData(BaseModel):
    name: str
    username: str
    password: str
    parentEmail: str
    dob: str

class LoginData(BaseModel):
    username: str
    password: str

class ParentSignupData(BaseModel):
    name: str
    email: str
    password: str
    phone: str

class FlagAlertData(BaseModel):
    flagType: str
    message: str
    parentEmail: str


def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


# --- Routes ---
@app.get("/")
def home():
    return {"message": "CURA backend running"}


@app.post("/auth/signup")
def signup(data: SignupData):
    db = SessionLocal()
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # find parent by email and link
    parent = db.query(User).filter(User.username == data.parentEmail).first()
    parent_id = parent.id if parent else None

    user = User(
        username=data.username,
        password=hash_password(data.password),
        role="child",
        parent_id=parent_id,
    )
    db.add(user)
    db.commit()
    db.close()
    return {"token": f"token-{data.username}", "userId": data.username}


@app.post("/auth/login")
def login(data: LoginData):
    db = SessionLocal()
    user = db.query(User).filter(User.username == data.username).first()
    db.close()
    if not user or user.password != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": f"token-{data.username}", "userId": data.username}


@app.post("/auth/parent/signup")
def parent_signup(data: ParentSignupData):
    db = SessionLocal()
    existing = db.query(User).filter(User.username == data.email).first()
    if existing:
        # if already exists just return token instead of failing
        db.close()
        return {"token": f"token-{data.email}", "userId": data.email}
    user = User(
        username=data.email,
        password=hash_password(data.password),
        role="parent",
    )
    db.add(user)
    db.commit()
    db.close()
    return {"token": f"token-{data.email}", "userId": data.email}

@app.post("/alert/flag")
def flag_alert(data: FlagAlertData):
    db = SessionLocal()
    flag = Flag(
        message_id=0,
        reason=f"{data.flagType}: {data.message}",
        risk_score=100 if data.flagType == "unsafe_content" else 50,
    )
    db.add(flag)
    db.commit()
    db.close()
    send_parent_alert(
        "child",
        data.message,
        {
            "risk_level": data.flagType,
            "risk_score": 100,
            "reason": [data.flagType]
        }
    )
    return {"status": "alert sent"}


@app.get("/parent/children")
def get_children(parent_email: str):
    db = SessionLocal()
    parent = db.query(User).filter(User.username == parent_email).first()
    if not parent:
        db.close()
        raise HTTPException(status_code=404, detail="Parent not found")
    
    children = db.query(User).filter(User.parent_id == parent.id).all()
    
    result = []
    for child in children:
        # get all messages for this child
        messages = db.query(Message).filter(Message.sender == child.username).all()
        
        # calculate risk score from messages
        high_risk_msgs = [m for m in messages if m.risk_level == "HIGH"]
        medium_risk_msgs = [m for m in messages if m.risk_level == "MEDIUM"]
        
        risk_score = min(100, len(high_risk_msgs) * 30 + len(medium_risk_msgs) * 10)
        
        if risk_score >= 60:
            risk = "High Risk"
        elif risk_score >= 30:
            risk = "Mild Concern"
        else:
            risk = "Safe"

        # build alerts from high risk messages
        alerts = []
        for msg in high_risk_msgs:
            alerts.append({
                "title": "Suspicious Message Detected",
                "severity": "High",
                "description": f"Flagged message: \"{msg.message_text}\" — Reason: {msg.risk_level}"
            })
        for msg in medium_risk_msgs:
            alerts.append({
                "title": "Moderate Risk Message",
                "severity": "Moderate", 
                "description": f"Flagged message: \"{msg.message_text}\""
            })

        result.append({
            "id": child.id,
            "name": child.username,
            "age": "—",
            "risk": risk,
            "riskScore": risk_score,
            "stressLevel": "High" if risk_score >= 60 else "Moderate" if risk_score >= 30 else "Low",
            "alerts": alerts if alerts else [{
                "title": "No risks detected",
                "severity": "Low",
                "description": "All messages appear safe so far."
            }],
            "notifications": [a["title"] for a in alerts]
        })
    
    db.close()
    return result


# --- WebSocket ---


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    connected_users[username] = websocket
    print(f"{username} connected")

    # hardcoded groomer responses in order
    groomer_replies = [
        "Hi!, How are you?",
        "Don't say this to anyone ok?",
        "Do you wanna meet up?"
    ]
    reply_index = 0

    try:
        while True:
            if username in blocked_users:

              await websocket.send_json({
                   "status": "blocked",
                    "message": "Chat temporarily blocked until parent approval."
                      })
              continue
       
       
  

   
            data = await websocket.receive_text()
            result = analyze_message(data)

            # save message to DB
            db = SessionLocal()
            msg = Message(
                sender=username,
                receiver="groomer",
                message_text=data,
                risk_score=result["risk_score"],
                risk_level=result["risk_level"]
            )
            db.add(msg)
            db.commit()
            db.close()

            # send risk result back to child
            await websocket.send_json(result)

            if result["risk_score"] >= 40:
                send_parent_alert(username, data, result)
                blocked_users.add(username)

               

            # send next groomer reply after short delay
            if reply_index < len(groomer_replies):
                await asyncio.sleep(1.5)  # typing delay
                groomer_message = groomer_replies[reply_index]

                groomer_result = analyze_message(groomer_message)
                if groomer_result["risk_score"] >= 40:
                    send_parent_alert(
                         username,
                         groomer_message,
                         groomer_result
                    )
                    blocked_users.add(username)



                await websocket.send_json({
                    "sender": "groomer",
                    "text": groomer_replies[reply_index]
                })
                reply_index += 1

            print(f"{username}: {data}")

    except WebSocketDisconnect:
        connected_users.pop(username, None)
        print(f"{username} disconnected")

        