from fastapi import FastAPI
from pydantic import BaseModel
import psutil
import os
import joblib
import re
import math
import time
from urllib.parse import urlparse
from scipy.sparse import hstack, csr_matrix
from fastapi.middleware.cors import CORSMiddleware
import psycopg2

conn = psycopg2.connect(os.getenv("DATABASE_URL"))

cursor = conn.cursor()

process = psutil.Process(os.getpid())

# =========================
# APP INIT (FIXED ORDER)
# =========================
app = FastAPI()

# =========================
# CORS (FIXED)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD MODEL
# =========================
model = joblib.load("./Model/hybrid_xgb/hybrid_model_strict_whitelist.pkl")
vectorizer = joblib.load("./Model/hybrid_xgb/vectorizer_model_strict_whitelist.pkl")

# =========================
# WHITELIST
# =========================
def load_whitelist(file):
    with open(file, "r") as f:
        return set(
            line.strip().lower().replace("https://", "").replace("http://", "")
            for line in f if line.strip()
        )

whitelist = load_whitelist("./Phishing Website Detection Dataset/Data/Test/clean_whitelist.txt")

# =========================
# BLACKLIST
# =========================
def load_blacklist(file):
    with open(file, "r") as f:
        return set(
            line.strip().lower()
            for line in f if line.strip()
        )

blacklist = load_blacklist("./Phishing Website Detection Dataset/Data/Test/phishing_blacklist.txt")
# =========================
# FEATURES
# =========================
def normalize_url(url):
    url = url.strip()
    if not url.startswith("http"):
        url = "http://" + url
    return url.lower()

def entropy(s):
    prob = [s.count(c)/len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob) if s else 0

def get_clean_domain(url):
    url = normalize_url(url)
    parsed = urlparse(url)

    domain = parsed.netloc.lower()
    domain = domain.split(":")[0]
    domain = domain.replace("www.", "")

    return domain

def extract_features(url):
    url = normalize_url(url)
    domain = get_clean_domain(url)

    is_whitelisted = int(domain in whitelist)

    return [
        len(url),
        len(domain),
        domain.count("."),
        url.count("-"),
        url.count("@"),
        url.count("?"),
        url.count("="),
        sum(c.isdigit() for c in url),
        max(0, domain.count(".") - 1),
        int(bool(re.search(r"\d+\.\d+\.\d+\.\d+", domain))),
        entropy(url),
        is_whitelisted
    ]

# =========================
# REQUEST FORMAT
# =========================
class URLRequest(BaseModel):
    url: str
    
def save_scan(url, result, confidence, source):
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO logs (url, result, confidence, source)
            VALUES (%s, %s, %s, %s)
        """, (url, result, float(confidence), source))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("SAVE ERROR:", e)

    finally:
        cursor.close()
        conn.close()

# =========================
# API ENDPOINT
# =========================
@app.post("/predict")
def predict(request: URLRequest):
    url = normalize_url(request.url)
    domain = get_clean_domain(url)

    print("RAW URL:", request.url)
    print("CLEAN DOMAIN:", domain)
    print("IN WHITELIST:", domain in whitelist)

    parsed = urlparse(url)

    # =========================
    # STRICT BLACKLIST
    # =========================
    if url in blacklist:
        prediction = "phishing"
        confidence = 1.0

        save_scan(url, prediction, confidence, "blacklist")

        return {
            "prediction": prediction,
            "confidence": confidence,
            "source": "blacklist"
        }

    # =========================
    # STRICT WHITELIST
    # =========================
    if (
        domain in whitelist and
        (parsed.path == "" or parsed.path == "/")
    ):
        prediction = "safe"
        confidence = 0.0

        save_scan(url, prediction, confidence, "whitelist")

        return {
            "prediction": prediction,
            "confidence": confidence,
            "source": "whitelist"
        }
        
    cpu_before = psutil.cpu_percent(interval=None)
    mem_before = process.memory_info().rss  # bytes
        
    start = time.time()

    # =========================
    # ML PREDICTION
    # =========================
    X_text = vectorizer.transform([url])
    X_struct = csr_matrix([extract_features(url)])
    X = hstack([X_text, X_struct])

    prob = model.predict_proba(X)[0][1]
    
    end = time.time()
    cpu_after = psutil.cpu_percent(interval=None)
    mem_after = process.memory_info().rss
    
    processing_time = end - start
    memory_used = (mem_after - mem_before) / (1024 * 1024)  # MB
    cpu_usage = cpu_after

    if prob < 0.3:
        label = "safe"
    elif prob < 0.7:
        label = "suspicious"
    else:
        label = "phishing"

    # ✅ SAVE TO DB
    save_scan(url, label, prob, "ml")

    return {
    "prediction": label,
    "confidence": float(prob),
    "source": "ml",
    "processing_time": processing_time,
    "memory_used": memory_used,
    "cpu_usage": cpu_usage,
}
    
@app.get("/history")
def get_history():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

    try:
        cursor.execute("""
                SELECT url, result, confidence, source
                FROM logs
                ORDER BY created_at DESC
                LIMIT 20
            """)
        data = cursor.fetchall()

        return data

    except Exception as e:
        conn.rollback()  # 🔥 VERY IMPORTANT
        print("HISTORY ERROR:", e)
        return []

    finally:
        cursor.close()
        conn.close()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.on_event("startup")
def create_tables():
    import os
    import psycopg2

    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            url TEXT,
            result TEXT,
            confidence FLOAT,
            source TEXT,  -- 🔥 ADD THIS
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

    conn.commit()
    cur.close()
    conn.close()