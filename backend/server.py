from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import hashlib
import hmac
import json
import io
import aiohttp
from jose import jwt, JWTError
from passlib.context import CryptContext
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'igate-host-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Kashier Settings
KASHIER_MERCHANT_ID = os.environ.get('KASHIER_MERCHANT_ID', '')
KASHIER_API_KEY = os.environ.get('KASHIER_API_KEY', '')
KASHIER_MODE = os.environ.get('KASHIER_MODE', 'sandbox')
KASHIER_API_URL = 'https://api.sandbox.kashier.io' if KASHIER_MODE == 'sandbox' else 'https://api.kashier.io'

app = FastAPI(title="Igate-host API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProductCategory(str, Enum):
    HOSTING = "hosting"
    DESIGN = "design"
    MARKETING = "marketing"

# ============== MODELS ==============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: UserRole = UserRole.CUSTOMER
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name_ar: str
    name_en: str
    description_ar: str
    description_en: str
    category: ProductCategory
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    is_active: bool = True
    is_popular: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name_ar: str
    name_en: str
    description_ar: str
    description_en: str
    category: ProductCategory
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    is_popular: bool = False

class ProductUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    category: Optional[ProductCategory] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"ORD-{uuid.uuid4().hex[:8].upper()}")
    user_id: str
    product_id: str
    product_name: str
    plan_duration: str  # monthly or yearly
    amount: float
    currency: str = "EGP"
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    product_id: str
    plan_duration: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str = Field(default_factory=lambda: f"PAY-{uuid.uuid4().hex[:8].upper()}")
    order_id: str
    kashier_transaction_id: Optional[str] = None
    amount: float
    currency: str = "EGP"
    status: PaymentStatus = PaymentStatus.PENDING
    payment_method: str = "card"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str = Field(default_factory=lambda: f"IG-{str(uuid.uuid4().int)[:4].zfill(4)}")
    invoice_number: str
    order_id: str
    payment_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    product_name: str
    plan_duration: str
    subtotal: float
    tax: float = 0
    total: float
    currency: str = "EGP"
    status: PaymentStatus = PaymentStatus.PAID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== AUTH HELPERS ==============
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode = {"user_id": user_id, "email": email, "role": role, "exp": expire}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Then check Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Try JWT token first
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id:
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user_doc:
                return User(**user_doc)
    except JWTError:
        pass
    
    # Try session token (for Google OAuth)
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============== AUTH ROUTES ==============
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "role": UserRole.CUSTOMER.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user_id, user_data.email, UserRole.CUSTOMER.value)
    return {"token": token, "user": {"user_id": user_id, "email": user_data.email, "name": user_data.name, "role": UserRole.CUSTOMER.value}}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc or not verify_password(user_data.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["user_id"], user_doc["email"], user_doc["role"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRATION_HOURS * 3600,
        path="/"
    )
    
    return {
        "token": token,
        "user": {
            "user_id": user_doc["user_id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc["role"],
            "picture": user_doc.get("picture")
        }
    }

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process Emergent OAuth session_id and create local session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Exchange session_id with Emergent Auth
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            auth_data = await resp.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if not user_doc:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "role": UserRole.CUSTOMER.value,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    else:
        user_id = user_doc["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture")}}
        )
    
    # Store session
    session_token = auth_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/"
    )
    
    return {
        "user": {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "role": user_doc.get("role", UserRole.CUSTOMER.value)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============== PRODUCTS ROUTES ==============
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[ProductCategory] = None, active_only: bool = True):
    query = {}
    if category:
        query["category"] = category.value
    if active_only:
        query["is_active"] = True
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: User = Depends(get_admin_user)):
    product = Product(**product_data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, admin: User = Depends(get_admin_user)):
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.products.update_one({"product_id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(get_admin_user)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============== ORDERS ROUTES ==============
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"product_id": order_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    amount = product["price_monthly"] if order_data.plan_duration == "monthly" else product["price_yearly"]
    
    order = Order(
        user_id=current_user.user_id,
        product_id=order_data.product_id,
        product_name=product["name_ar"],
        plan_duration=order_data.plan_duration,
        amount=amount,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone
    )
    
    await db.orders.insert_one(order.model_dump())
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin: User = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus, admin: User = Depends(get_admin_user)):
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# ============== PAYMENTS ROUTES ==============
@api_router.post("/payments/create-session")
async def create_payment_session(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["payment_status"] == PaymentStatus.PAID.value:
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Create payment record
    payment = Payment(
        order_id=order_id,
        amount=order["amount"],
        currency=order["currency"]
    )
    await db.payments.insert_one(payment.model_dump())
    
    # For demo/sandbox, we'll create a mock payment session
    # In production, this would call Kashier API
    if not KASHIER_MERCHANT_ID or not KASHIER_API_KEY:
        # Return mock session for development
        return {
            "payment_id": payment.payment_id,
            "order_id": order_id,
            "amount": order["amount"],
            "currency": order["currency"],
            "mock_mode": True,
            "message": "Payment gateway not configured. Use mock payment."
        }
    
    # Prepare Kashier payment request
    payment_data = {
        "merchant_id": KASHIER_MERCHANT_ID,
        "merchant_order_id": order_id,
        "amount": int(order["amount"] * 100),  # Convert to smallest unit
        "currency": order["currency"],
        "customer_email": order["customer_email"],
        "description": f"Payment for {order['product_name']}"
    }
    
    # Generate signature
    data_str = json.dumps(payment_data, separators=(',', ':'), sort_keys=True)
    signature = hmac.new(KASHIER_API_KEY.encode(), data_str.encode(), hashlib.sha256).hexdigest().upper()
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{KASHIER_API_URL}/api/v1/payment/session",
            json=payment_data,
            headers={"Content-Type": "application/json", "X-Signature": signature}
        ) as resp:
            result = await resp.json()
            if resp.status == 200 and result.get("status"):
                return {
                    "payment_id": payment.payment_id,
                    "session_id": result.get("id"),
                    "payment_url": result.get("redirect_url"),
                    "order_id": order_id
                }
            else:
                raise HTTPException(status_code=400, detail=result.get("message", "Payment session failed"))

@api_router.post("/payments/mock-complete/{payment_id}")
async def mock_complete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """Mock payment completion for development/testing"""
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    order = await db.orders.find_one({"order_id": payment["order_id"]}, {"_id": 0})
    if not order or order["user_id"] != current_user.user_id:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update payment
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "status": PaymentStatus.PAID.value,
            "kashier_transaction_id": f"MOCK-{uuid.uuid4().hex[:8].upper()}",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update order
    await db.orders.update_one(
        {"order_id": payment["order_id"]},
        {"$set": {
            "payment_status": PaymentStatus.PAID.value,
            "status": OrderStatus.COMPLETED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create invoice
    invoice_count = await db.invoices.count_documents({})
    invoice_number = f"IG-{str(invoice_count + 1).zfill(4)}"
    
    invoice = Invoice(
        invoice_number=invoice_number,
        order_id=payment["order_id"],
        payment_id=payment_id,
        customer_name=order["customer_name"],
        customer_email=order["customer_email"],
        customer_phone=order.get("customer_phone"),
        product_name=order["product_name"],
        plan_duration=order["plan_duration"],
        subtotal=order["amount"],
        tax=0,
        total=order["amount"],
        currency=order["currency"]
    )
    await db.invoices.insert_one(invoice.model_dump())
    
    return {"message": "Payment completed", "invoice_id": invoice.invoice_id, "invoice_number": invoice_number}

@api_router.post("/payments/webhook")
async def payment_webhook(request: Request):
    """Handle Kashier payment webhook"""
    body = await request.body()
    payload = json.loads(body)
    
    signature = request.headers.get("X-Signature", "")
    
    # Verify signature
    if KASHIER_API_KEY:
        payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        expected_sig = hmac.new(KASHIER_API_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest().upper()
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    order_id = payload.get("merchant_order_id")
    transaction_id = payload.get("transaction_id")
    status = payload.get("status")
    
    payment_status = PaymentStatus.PAID if status == "success" else PaymentStatus.FAILED
    
    # Update payment
    await db.payments.update_one(
        {"order_id": order_id},
        {"$set": {
            "status": payment_status.value,
            "kashier_transaction_id": transaction_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update order
    order_status = OrderStatus.COMPLETED if status == "success" else OrderStatus.CANCELLED
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "payment_status": payment_status.value,
            "status": order_status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create invoice if paid
    if payment_status == PaymentStatus.PAID:
        order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
        payment = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
        
        invoice_count = await db.invoices.count_documents({})
        invoice_number = f"IG-{str(invoice_count + 1).zfill(4)}"
        
        invoice = Invoice(
            invoice_number=invoice_number,
            order_id=order_id,
            payment_id=payment["payment_id"],
            customer_name=order["customer_name"],
            customer_email=order["customer_email"],
            customer_phone=order.get("customer_phone"),
            product_name=order["product_name"],
            plan_duration=order["plan_duration"],
            subtotal=order["amount"],
            total=order["amount"],
            currency=order["currency"]
        )
        await db.invoices.insert_one(invoice.model_dump())
    
    return {"status": "ok"}

# ============== INVOICES ROUTES ==============
@api_router.get("/invoices", response_model=List[Invoice])
async def get_user_invoices(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    order_ids = [o["order_id"] for o in orders]
    invoices = await db.invoices.find({"order_id": {"$in": order_ids}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return invoices

@api_router.get("/admin/invoices", response_model=List[Invoice])
async def get_all_invoices(admin: User = Depends(get_admin_user)):
    invoices = await db.invoices.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/{invoice_id}/pdf")
async def get_invoice_pdf(invoice_id: str, current_user: User = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Check user access
    order = await db.orders.find_one({"order_id": invoice["order_id"]}, {"_id": 0})
    if order and order["user_id"] != current_user.user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=1, spaceAfter=20)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=12, alignment=1, textColor=colors.grey, spaceAfter=30)
    
    # Header
    elements.append(Paragraph("Igate-host", title_style))
    elements.append(Paragraph("Professional Hosting Solutions", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Invoice info
    info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=11, leading=16)
    elements.append(Paragraph(f"<b>Invoice Number:</b> {invoice['invoice_number']}", info_style))
    
    created_at = invoice.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    date_str = created_at.strftime('%Y-%m-%d %H:%M') if created_at else 'N/A'
    elements.append(Paragraph(f"<b>Date:</b> {date_str}", info_style))
    elements.append(Paragraph(f"<b>Status:</b> {invoice['status'].upper()}", info_style))
    elements.append(Spacer(1, 20))
    
    # Customer info
    elements.append(Paragraph("<b>Customer Information:</b>", info_style))
    elements.append(Paragraph(f"Name: {invoice['customer_name']}", info_style))
    elements.append(Paragraph(f"Email: {invoice['customer_email']}", info_style))
    if invoice.get('customer_phone'):
        elements.append(Paragraph(f"Phone: {invoice['customer_phone']}", info_style))
    elements.append(Spacer(1, 20))
    
    # Items table
    table_data = [
        ['Item', 'Duration', 'Amount'],
        [invoice['product_name'], invoice['plan_duration'].capitalize(), f"{invoice['subtotal']} {invoice['currency']}"],
        ['', 'Subtotal:', f"{invoice['subtotal']} {invoice['currency']}"],
        ['', 'Tax:', f"{invoice['tax']} {invoice['currency']}"],
        ['', 'Total:', f"{invoice['total']} {invoice['currency']}"]
    ]
    
    table = Table(table_data, colWidths=[80*mm, 50*mm, 40*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('FONTNAME', (1, -3), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EFF6FF')),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 40))
    
    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, alignment=1, textColor=colors.grey)
    elements.append(Paragraph("Thank you for choosing Igate-host!", footer_style))
    elements.append(Paragraph("Website: www.igate-host.com | Support: support@igate-host.com", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice['invoice_number']}.pdf"}
    )

# ============== CONTACT ROUTES ==============
@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact(message_data: ContactMessageCreate):
    message = ContactMessage(**message_data.model_dump())
    await db.contact_messages.insert_one(message.model_dump())
    return message

@api_router.get("/admin/contact", response_model=List[ContactMessage])
async def get_contact_messages(admin: User = Depends(get_admin_user)):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return messages

@api_router.put("/admin/contact/{message_id}/read")
async def mark_message_read(message_id: str, admin: User = Depends(get_admin_user)):
    result = await db.contact_messages.update_one({"message_id": message_id}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message marked as read"}

# ============== STATS ROUTES ==============
@api_router.get("/admin/stats")
async def get_admin_stats(admin: User = Depends(get_admin_user)):
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"payment_status": PaymentStatus.PAID.value})
    pending_orders = await db.orders.count_documents({"payment_status": PaymentStatus.PENDING.value})
    total_products = await db.products.count_documents({})
    total_users = await db.users.count_documents({})
    unread_messages = await db.contact_messages.count_documents({"is_read": False})
    
    # Calculate revenue
    pipeline = [
        {"$match": {"payment_status": PaymentStatus.PAID.value}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "total_products": total_products,
        "total_users": total_users,
        "unread_messages": unread_messages,
        "total_revenue": total_revenue
    }

# ============== SALES REPORT ROUTES ==============
@api_router.get("/admin/sales-report")
async def get_sales_report(
    from_date: str,
    to_date: str,
    admin: User = Depends(get_admin_user)
):
    """Get detailed sales report for a date range"""
    try:
        from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Query orders in date range
    query = {
        "created_at": {
            "$gte": from_dt.isoformat(),
            "$lte": to_dt.isoformat()
        }
    }
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total_sales = sum(o["amount"] for o in orders if o.get("payment_status") == PaymentStatus.PAID.value)
    orders_count = len(orders)
    paid_orders = len([o for o in orders if o.get("payment_status") == PaymentStatus.PAID.value])
    pending_orders = len([o for o in orders if o.get("payment_status") == PaymentStatus.PENDING.value])
    average_order_value = total_sales / paid_orders if paid_orders > 0 else 0
    
    # Get invoices count
    invoices_count = await db.invoices.count_documents({
        "created_at": {"$gte": from_dt.isoformat(), "$lte": to_dt.isoformat()}
    })
    
    # Daily breakdown
    daily_data = {}
    for order in orders:
        if order.get("payment_status") == PaymentStatus.PAID.value:
            order_date = order["created_at"][:10]  # Get YYYY-MM-DD
            if order_date not in daily_data:
                daily_data[order_date] = {"orders": 0, "amount": 0}
            daily_data[order_date]["orders"] += 1
            daily_data[order_date]["amount"] += order["amount"]
    
    daily_breakdown = [
        {"date": date, "orders": data["orders"], "amount": data["amount"]}
        for date, data in sorted(daily_data.items(), reverse=True)
    ]
    
    return {
        "total_sales": total_sales,
        "orders_count": orders_count,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "average_order_value": round(average_order_value, 2),
        "invoices_count": invoices_count,
        "daily_breakdown": daily_breakdown,
        "from_date": from_date,
        "to_date": to_date
    }

# ============== SETTINGS ROUTES ==============
class SettingsModel(BaseModel):
    kashier_merchant_id: Optional[str] = ""
    kashier_api_key: Optional[str] = ""
    kashier_mode: Optional[str] = "sandbox"
    tax_enabled: Optional[bool] = False
    tax_percentage: Optional[float] = 14
    company_name: Optional[str] = "igate"
    website_name: Optional[str] = "Igate-host"
    support_email: Optional[str] = "support@igate-host.com"
    support_phone: Optional[str] = "+20 100 123 4567"

@api_router.get("/admin/settings")
async def get_settings(admin: User = Depends(get_admin_user)):
    """Get current settings"""
    settings_doc = await db.settings.find_one({"type": "global"}, {"_id": 0})
    
    if not settings_doc:
        # Return defaults
        settings_doc = {
            "kashier_merchant_id": KASHIER_MERCHANT_ID,
            "kashier_api_key": "***" if KASHIER_API_KEY else "",
            "kashier_mode": KASHIER_MODE,
            "kashier_connected": bool(KASHIER_MERCHANT_ID and KASHIER_API_KEY),
            "tax_enabled": False,
            "tax_percentage": 14,
            "company_name": "igate",
            "website_name": "Igate-host",
            "support_email": "support@igate-host.com",
            "support_phone": "+20 100 123 4567"
        }
    else:
        # Mask API key
        if settings_doc.get("kashier_api_key"):
            settings_doc["kashier_api_key"] = "***" + settings_doc["kashier_api_key"][-4:] if len(settings_doc.get("kashier_api_key", "")) > 4 else "***"
        settings_doc["kashier_connected"] = bool(settings_doc.get("kashier_merchant_id") and settings_doc.get("kashier_api_key"))
    
    return settings_doc

@api_router.put("/admin/settings")
async def update_settings(settings: SettingsModel, admin: User = Depends(get_admin_user)):
    """Update settings"""
    settings_dict = settings.model_dump()
    
    # Don't update API key if it's masked
    if settings_dict.get("kashier_api_key", "").startswith("***"):
        existing = await db.settings.find_one({"type": "global"}, {"_id": 0})
        if existing:
            settings_dict["kashier_api_key"] = existing.get("kashier_api_key", "")
    
    settings_dict["type"] = "global"
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.settings.update_one(
        {"type": "global"},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

@api_router.post("/admin/settings/test-kashier")
async def test_kashier_connection(admin: User = Depends(get_admin_user)):
    """Test Kashier API connection"""
    settings_doc = await db.settings.find_one({"type": "global"}, {"_id": 0})
    
    merchant_id = settings_doc.get("kashier_merchant_id") if settings_doc else KASHIER_MERCHANT_ID
    api_key = settings_doc.get("kashier_api_key") if settings_doc else KASHIER_API_KEY
    mode = settings_doc.get("kashier_mode", "sandbox") if settings_doc else KASHIER_MODE
    
    if not merchant_id or not api_key:
        return {"connected": False, "error": "Missing credentials"}
    
    # For now, we just check if credentials are provided
    # In production, you would make a test API call to Kashier
    return {
        "connected": True,
        "merchant_id": merchant_id,
        "mode": mode
    }

# ============== SEED DATA ==============
@api_router.post("/seed")
async def seed_data():
    """Seed initial hosting plans - for development"""
    existing = await db.products.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded"}
    
    products = [
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name_ar": "استضافة البداية",
            "name_en": "Starter Hosting",
            "description_ar": "مثالية للمواقع الشخصية والمدونات الصغيرة",
            "description_en": "Perfect for personal sites and small blogs",
            "category": "hosting",
            "price_monthly": 49,
            "price_yearly": 490,
            "features": ["5 GB SSD Storage", "10 GB Bandwidth", "1 Website", "Free SSL", "24/7 Support"],
            "is_active": True,
            "is_popular": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name_ar": "استضافة الأعمال",
            "name_en": "Business Hosting",
            "description_ar": "للشركات الصغيرة والمتوسطة",
            "description_en": "For small and medium businesses",
            "category": "hosting",
            "price_monthly": 99,
            "price_yearly": 990,
            "features": ["25 GB SSD Storage", "Unlimited Bandwidth", "5 Websites", "Free SSL", "Daily Backup", "Priority Support"],
            "is_active": True,
            "is_popular": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name_ar": "استضافة الشركات",
            "name_en": "Enterprise Hosting",
            "description_ar": "للشركات الكبيرة والمشاريع المتقدمة",
            "description_en": "For large companies and advanced projects",
            "category": "hosting",
            "price_monthly": 199,
            "price_yearly": 1990,
            "features": ["100 GB SSD Storage", "Unlimited Bandwidth", "Unlimited Websites", "Free SSL", "Daily Backup", "DDoS Protection", "Dedicated Support"],
            "is_active": True,
            "is_popular": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name_ar": "تصميم موقع بسيط",
            "name_en": "Basic Website Design",
            "description_ar": "تصميم موقع احترافي من 5 صفحات",
            "description_en": "Professional 5-page website design",
            "category": "design",
            "price_monthly": 2500,
            "price_yearly": 2500,
            "features": ["5 Pages", "Responsive Design", "Contact Form", "SEO Ready", "3 Revisions"],
            "is_active": True,
            "is_popular": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name_ar": "تسويق رقمي شهري",
            "name_en": "Monthly Digital Marketing",
            "description_ar": "إدارة حملاتك على السوشيال ميديا",
            "description_en": "Social media campaign management",
            "category": "marketing",
            "price_monthly": 1500,
            "price_yearly": 15000,
            "features": ["Social Media Management", "Content Creation", "Monthly Reports", "Ad Campaign Management"],
            "is_active": True,
            "is_popular": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(products)
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@igate-host.com"})
    if not admin_exists:
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@igate-host.com",
            "name": "Admin",
            "password_hash": hash_password("admin123"),
            "role": UserRole.ADMIN.value,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
    
    return {"message": "Data seeded successfully"}

@api_router.get("/")
async def root():
    return {"message": "Igate-host API", "status": "running"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
