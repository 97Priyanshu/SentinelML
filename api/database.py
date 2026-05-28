from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# This creates a local file named 'industrial.db' in your project root
SQLALCHEMY_DATABASE_URL = "sqlite:///./industrial.db"

# The engine is what actually talks to the SQLite file
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# A SessionLocal class. Every instance of this will be an actual database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# We will inherit from this Base class to create our database models
Base = declarative_base()

# Dependency: This function gives a database session to our API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()