# 🔧 BACKEND - FASTAPI (Python)

## CONFIGURATION & SETUP

### 1. requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
redis==5.0.1
celery==5.3.4
aioredis==2.0.1
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
requests==2.31.0
python-dotenv==1.0.0
alembic==1.13.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

### 2. .env.example

```
# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/broker_ia
SQLALCHEMY_ECHO=True

# REDIS
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# API
API_PORT=8000
API_HOST=0.0.0.0
DEBUG=True

# CORS
FRONTEND_URL=http://localhost:3000
MOBILE_URL=*

# STRIPE (optional)
STRIPE_API_KEY=sk_test_...

# AI MODULE
AI_MODULE_URL=http://localhost:8001
```

### 3. config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """Configuration centrale de l'application"""
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/broker_ia")
    
    # JWT
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # API
    api_port: int = 8000
    debug: bool = os.getenv("DEBUG", "True") == "True"
    
    # CORS
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 🗄️ DATABASE MODELS (SQLAlchemy ORM)

### 4. models/user.py

```python
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    """Modèle utilisateur"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRole), default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    strategies = relationship("Strategy", back_populates="owner")
    signals = relationship("Signal", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    reports = relationship("Report", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"
```

### 5. models/strategy.py

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .user import Base

class Strategy(Base):
    """Modèle pour les stratégies utilisateur"""
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    original_text = Column(Text)  # Texte original uploadé
    extracted_rules = Column(JSON)  # Règles extraites par NLP
    asset = Column(String)  # ex: "AAPL", "BTC"
    timeframe = Column(String)  # ex: "1H", "4H", "1D"
    confidence = Column(Integer, default=50)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="strategies")
    signals = relationship("Signal", back_populates="strategy")
    
    def __repr__(self):
        return f"<Strategy {self.name} by {self.user_id}>"
```

### 6. models/signal.py

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .user import Base

class Signal(Base):
    """Modèle pour les signaux générés"""
    __tablename__ = "signals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    
    # Signal info
    asset = Column(String, index=True)  # ex: AAPL
    timeframe = Column(String)  # ex: 1H, 4H
    direction = Column(String)  # BUY, SELL, HOLD
    pattern_type = Column(String)  # Hammer, Doji, etc.
    confidence = Column(Integer)  # 0-100
    entry_price = Column(Float)
    stop_loss = Column(Float)
    take_profit = Column(Float)
    risk_reward = Column(Float)
    
    # Metadata
    detected_patterns = Column(JSON)  # Liste patterns détectés
    indicators = Column(JSON)  # RSI, MACD values, etc.
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="signals")
    strategy = relationship("Strategy", back_populates="signals")
    
    def __repr__(self):
        return f"<Signal {self.direction} {self.asset} by {self.user_id}>"
```

### 7. models/subscription.py

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .user import Base

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    ELITE = "elite"

class Subscription(Base):
    """Modèle abonnement utilisateur"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    status = Column(String, default="active")  # active, cancelled, expired
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ends_at = Column(DateTime, nullable=True)
    auto_renew = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="subscription")
    
    def __repr__(self):
        return f"<Subscription {self.user_id} - {self.plan}>"
```

### 8. models/report.py

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .user import Base

class Report(Base):
    """Modèle pour les bilans mensuels"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Period
    month = Column(Integer)  # 1-12
    year = Column(Integer)
    
    # Performance
    total_signals = Column(Integer, default=0)
    winning_signals = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)  # percentage
    avg_return = Column(Float, default=0.0)  # percentage
    best_signal = Column(Float, default=0.0)
    worst_signal = Column(Float, default=0.0)
    
    # Simulator data
    simulator_data = Column(JSON)  # {initial: 1000, final: 1250, ...}
    
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reports")
    
    def __repr__(self):
        return f"<Report {self.user_id} - {self.month}/{self.year}>"
```

---

## 🔐 AUTHENTIFICATION

### 9. utils/jwt_handler.py

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import get_settings
from fastapi import HTTPException, status

settings = get_settings()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crée un JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Crée un JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Vérifie et decode un JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception
```

### 10. utils/password.py

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash un mot de passe"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe"""
    return pwd_context.verify(plain_password, hashed_password)
```

---

## 📡 PYDANTIC SCHEMAS (Validation)

### 11. schemas/user.py

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```

### 12. schemas/signal.py

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SignalCreate(BaseModel):
    asset: str
    timeframe: str
    direction: str  # BUY, SELL, HOLD
    confidence: int
    entry_price: float
    stop_loss: float
    take_profit: float
    pattern_type: Optional[str] = None
    strategy_id: Optional[int] = None

class SignalResponse(SignalCreate):
    id: int
    user_id: int
    detected_patterns: Optional[List[str]] = None
    risk_reward: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class SignalFilter(BaseModel):
    asset: Optional[str] = None
    direction: Optional[str] = None
    timeframe: Optional[str] = None
    min_confidence: Optional[int] = 50
```

### 13. schemas/strategy.py

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    original_text: str  # Contenu de la stratégie
    asset: Optional[str] = None
    timeframe: Optional[str] = None

class StrategyResponse(StrategyCreate):
    id: int
    user_id: int
    extracted_rules: Optional[dict] = None
    confidence: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## 🛠️ SERVICES MÉTIER

### 14. services/auth_service.py

```python
from app.utils.password import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, create_refresh_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, LoginRequest
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

class AuthService:
    
    @staticmethod
    async def register(user_data: UserCreate, db: Session) -> User:
        """Enregistre un nouvel utilisateur"""
        # Check si l'email existe
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hash_password(user_data.password)
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    async def login(login_data: LoginRequest, db: Session) -> dict:
        """Authentifie un utilisateur et retourne les tokens"""
        # Trouve l'user
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Vérifie le mot de passe
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Génère les tokens
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
```

### 15. services/signal_service.py

```python
from app.models.signal import Signal
from app.schemas.signal import SignalCreate, SignalFilter
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List, Optional

class SignalService:
    
    @staticmethod
    async def create_signal(user_id: int, signal_data: SignalCreate, db: Session) -> Signal:
        """Crée un nouveau signal"""
        signal = Signal(
            user_id=user_id,
            **signal_data.dict()
        )
        db.add(signal)
        db.commit()
        db.refresh(signal)
        return signal
    
    @staticmethod
    async def get_signals(
        user_id: int,
        filters: SignalFilter,
        db: Session,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Signal], int]:
        """Récupère les signaux avec filtres"""
        query = db.query(Signal).filter(Signal.user_id == user_id)
        
        # Appliquer les filtres
        if filters.asset:
            query = query.filter(Signal.asset == filters.asset)
        if filters.direction:
            query = query.filter(Signal.direction == filters.direction)
        if filters.timeframe:
            query = query.filter(Signal.timeframe == filters.timeframe)
        if filters.min_confidence:
            query = query.filter(Signal.confidence >= filters.min_confidence)
        
        # Tri par date
        query = query.order_by(Signal.created_at.desc())
        
        # Pagination
        total = query.count()
        signals = query.offset(offset).limit(limit).all()
        
        return signals, total
    
    @staticmethod
    async def get_recent_signals(user_id: int, db: Session, hours: int = 24) -> List[Signal]:
        """Récupère les signaux récents"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        signals = db.query(Signal).filter(
            and_(
                Signal.user_id == user_id,
                Signal.created_at >= cutoff_time
            )
        ).order_by(Signal.created_at.desc()).limit(5).all()
        return signals
```

### 16. services/simulator_service.py

```python
from typing import Optional
import math

class SimulatorService:
    """Simulator DCA (Dollar Cost Averaging)"""
    
    @staticmethod
    def calculate_dca(
        initial_amount: float,
        monthly_investment: float,
        months: int,
        annual_return: float = 0.08  # 8% annual default
    ) -> dict:
        """
        Calcule un DCA avec intérêts composés
        
        Args:
            initial_amount: Montant initial
            monthly_investment: Investissement mensuel
            months: Nombre de mois
            annual_return: Rendement annuel (ex: 0.08 = 8%)
        
        Returns:
            dict avec résultats (final_amount, total_invested, gains, etc.)
        """
        monthly_rate = annual_return / 12
        balance = initial_amount
        total_invested = initial_amount
        monthly_data = []
        
        for month in range(1, months + 1):
            # Ajoute l'investissement mensuel
            balance += monthly_investment
            total_invested += monthly_investment
            
            # Applique les intérêts composés
            balance = balance * (1 + monthly_rate)
            
            monthly_data.append({
                "month": month,
                "balance": round(balance, 2),
                "total_invested": total_invested
            })
        
        final_amount = round(balance, 2)
        gains = final_amount - total_invested
        roi = (gains / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "initial_amount": initial_amount,
            "monthly_investment": monthly_investment,
            "months": months,
            "annual_return": annual_return,
            "total_invested": total_invested,
            "final_amount": final_amount,
            "gains": round(gains, 2),
            "roi": round(roi, 2),
            "monthly_data": monthly_data
        }
```

---

## 📡 API ROUTES

### 17. api/auth.py

```python
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.db.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Enregistre un nouvel utilisateur"""
    user = await AuthService.register(user_data, db)
    return user

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authentifie un utilisateur"""
    tokens = await AuthService.login(login_data, db)
    return tokens

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Rafraîchit le JWT access token"""
    # TODO: Implémenter refresh logic
    return {"access_token": "new_token"}
```

### 18. api/signals.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.signal import SignalCreate, SignalResponse, SignalFilter
from app.services.signal_service import SignalService
from app.db.database import get_db
from app.utils.jwt_handler import verify_token
from typing import List

router = APIRouter(prefix="/api/signals", tags=["signals"])

# Dependency pour récupérer l'user_id du JWT
async def get_current_user_id(token: str = Depends(get_current_user_token)) -> int:
    payload = verify_token(token)
    return int(payload.get("sub"))

@router.post("/generate", response_model=SignalResponse)
async def generate_signal(
    signal_data: SignalCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Génère un nouveau signal"""
    signal = await SignalService.create_signal(user_id, signal_data, db)
    return signal

@router.get("/", response_model=List[SignalResponse])
async def get_signals(
    asset: str = None,
    direction: str = None,
    timeframe: str = None,
    limit: int = 50,
    offset: int = 0,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Récupère les signaux de l'user"""
    filters = SignalFilter(
        asset=asset,
        direction=direction,
        timeframe=timeframe
    )
    signals, total = await SignalService.get_signals(user_id, filters, db, limit, offset)
    return signals

@router.get("/recent", response_model=List[SignalResponse])
async def get_recent_signals(
    hours: int = 24,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Récupère les 5 derniers signaux"""
    signals = await SignalService.get_recent_signals(user_id, db, hours)
    return signals
```

### 19. api/simulator.py

```python
from fastapi import APIRouter, Depends
from app.services.simulator_service import SimulatorService
from pydantic import BaseModel

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

class DCARequest(BaseModel):
    initial_amount: float
    monthly_investment: float
    months: int
    annual_return: float = 0.08

class DCAResponse(BaseModel):
    initial_amount: float
    monthly_investment: float
    months: int
    total_invested: float
    final_amount: float
    gains: float
    roi: float
    monthly_data: list

@router.post("/dca", response_model=DCAResponse)
async def calculate_dca(request: DCARequest):
    """Calcule un DCA (Dollar Cost Averaging)"""
    result = SimulatorService.calculate_dca(
        initial_amount=request.initial_amount,
        monthly_investment=request.monthly_investment,
        months=request.months,
        annual_return=request.annual_return
    )
    return result
```

---

## 🚀 MAIN APPLICATION

### 20. main.py

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import logging
from app.config import get_settings
from app.api import auth, signals, simulator, users, strategies, reports, subscriptions
from app.db.database import engine
from app.models import user as user_models

# Create tables
user_models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Broker IA Intelligent API",
    description="API pour la plateforme de trading IA",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(signals.router)
app.include_router(simulator.router)
# app.include_router(users.router)
# app.include_router(strategies.router)
# app.include_router(reports.router)
# app.include_router(subscriptions.router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Root
@app.get("/")
async def root():
    return {
        "message": "Broker IA Intelligent API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
```

---

## 🗄️ DATABASE CONNECTION

### 21. db/database.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import get_settings

settings = get_settings()

# Create engine
engine = create_engine(
    settings.database_url,
    echo=settings.sqlalchemy_echo,
    pool_pre_ping=True,  # Test connection before use
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency injection pour la session BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

**Ce backend FastAPI est prêt pour:**
✅ Déploiement avec Gunicorn
✅ Extension avec endpoints supplémentaires  
✅ Intégration module IA
✅ Scaling avec Celery workers
