# IMPORTS
import pandas as pd
import joblib
import re
import math
from urllib.parse import urlparse
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import HashingVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, roc_curve, roc_auc_score, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
import seaborn as sns
import matplotlib.pyplot as plt

# MODEL AND DATA PATHS
BENIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/benign_sample_10000_rs42.txt"
MALIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/malign_sample_10000_rs42.txt"
MODEL_PATH = "Model/rf/"

# URL NORMALIZATION
def normalize_url(url):
    url = url.strip().lower()

    if url.startswith("http://"):
        url = url[7:]
    elif url.startswith("https://"):
        url = url[8:]

    return "http://" + url

# LOAD DATA
def load_txt(file, label):
    with open(file, "r", encoding="utf-8", errors="ignore") as f:
        urls = [normalize_url(line.strip()) for line in f if line.strip()]
    return pd.DataFrame({"url": urls, "label": label})
df_benign = load_txt(BENIGN_FILE, 0)
df_malign = load_txt(MALIGN_FILE, 1)
df = pd.concat([df_benign, df_malign], ignore_index=True)
print("Dataset size:", len(df))
print(df["label"].value_counts())

# FEATURE ENGINEERING
def entropy(s):
    prob = [s.count(c)/len(s) for c in set(s)]
    return -sum(p * math.log2(p) for p in prob) if s else 0
def extract_features(url):
    url = normalize_url(url)
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    return [
        len(url),                              # length_url
        len(domain),                           # length_hostname
        domain.count("."),                     # nb_dots
        url.count("-"),                        # nb_hyphens
        url.count("@"),                        # nb_at
        url.count("?"),                        # nb_qm
        url.count("="),                        # nb_eq
        sum(c.isdigit() for c in url),         # nb_digits
        max(0, domain.count(".") - 1),         # nb_subdomains
        int(bool(re.search(r"\d+\.\d+\.\d+\.\d+", domain))),  # has_ip
        entropy(url),                          # entropy
    ]

# BUILD FEATURES
feature_df = pd.DataFrame(df["url"].apply(extract_features).tolist())
vectorizer = HashingVectorizer(
    n_features=2**18,
    ngram_range=(3,5),
    analyzer='char'
)
X_text = vectorizer.transform(df["url"])
X_struct = csr_matrix(feature_df.values)
X = hstack([X_text, X_struct])
y = df["label"]

# 80 : 10 : 10 SPLIT
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y,
    test_size=0.2,
    stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp,
    test_size=0.5,
    stratify=y_temp
)
print("\nSplit sizes:")
print("Train:", X_train.shape[0])
print("Validation:", X_val.shape[0])
print("Test:", X_test.shape[0])

# TRAIN MODEL
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    n_jobs=-1
)
model.fit(X_train, y_train)

# VALIDATION
y_val_pred = model.predict(X_val)
y_val_prob = model.predict_proba(X_val)[:, 1]
print("\n=== VALIDATION RESULT ===\n")
print(classification_report(y_val, y_val_pred, digits=4))
print("Validation Accuracy:", accuracy_score(y_val, y_val_pred))
print("Validation AUC:", roc_auc_score(y_val, y_val_prob))

# TEST
y_test_pred = model.predict(X_test)
y_test_prob = model.predict_proba(X_test)[:, 1]

print("\n=== FINAL TEST RESULT ===\n")
print(classification_report(y_test, y_test_pred, digits=4))
print("Test Accuracy:", accuracy_score(y_test, y_test_pred))
print("Test AUC:", roc_auc_score(y_test, y_test_prob))

# SAVE MODEL
joblib.dump(model, MODEL_PATH + "random_forest_model.pkl")
joblib.dump(vectorizer, MODEL_PATH + "vectorizer_rf_model.pkl")
print("\n Random Forest Model trained")

# FINAL REPORT
report = classification_report(
    y_test,
    y_test_pred,
    output_dict=True
)
print("\n================ FINAL MODEL REPORT ================\n")
print(f"Akurasi               : {accuracy_score(y_test, y_test_pred):.4f}")
print(f"Presisi               : {report['1']['precision']:.4f}")
print(f"Recall                : {report['1']['recall']:.4f}")
print(f"AUC                   : {roc_auc_score(y_test, y_test_prob):.4f}")

# CONFUSION MATRIX
cm = confusion_matrix(y_test, y_test_pred)

plt.figure(figsize=(5,4))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion Matrix")
plt.show()

#ROC CURVE
fpr, tpr, thresholds = roc_curve(y_test, y_test_prob)
auc = roc_auc_score(y_test, y_test_prob)

plt.figure(figsize=(6,5))
plt.plot(fpr, tpr, label=f"AUC = {auc:.4f}")
plt.plot([0,1], [0,1], linestyle="--", color="gray")

plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")
plt.legend()
plt.show()