from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Float
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime


# SQLite database
DATABASE_URL = "sqlite:///cura.db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()


# ---------------- USERS ----------------

class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)

    password = Column(String)

    role = Column(String)   # parent / child / suspicious

    parent_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------- MESSAGES ----------------

class Message(Base):

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    sender = Column(String)

    receiver = Column(String)

    message_text = Column(Text)

    risk_score = Column(Float)

    risk_level = Column(String)

    timestamp = Column(DateTime, default=datetime.utcnow)


# ---------------- FLAGS ----------------

class Flag(Base):

    __tablename__ = "flags"

    id = Column(Integer, primary_key=True, index=True)

    message_id = Column(Integer)

    reason = Column(String)

    risk_score = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------- GROOMER PROFILE ----------------

class GroomerProfile(Base):

    __tablename__ = "groomer_profiles"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True)

    flag_count = Column(Integer, default=0)

    children_contacted = Column(Integer, default=0)

    risk_average = Column(Float, default=0)

    status = Column(String, default="MONITOR")


# Create all tables
Base.metadata.create_all(bind=engine)