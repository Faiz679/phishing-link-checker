# IMPORTS
import pandas as pd
import numpy as np
import joblib
import re
import math
import os
from urllib.parse import urlparse
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    roc_curve, 
    roc_auc_score, 
    confusion_matrix
)
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Embedding,
    LSTM,
    Dense,
    Dropout
)
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import EarlyStopping

import seaborn as sns
import matplotlib.pyplot as plt

# MODEL AND DATA PATHS
BENIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/benign_sample_10000_rs42.txt"
MALIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/malign_sample_10000_rs42.txt"
MODEL_PATH = "Model/lstm/"
MAX_WORDS = 50000
MAX_LEN = 200

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
        urls = [
            normalize_url(line.strip())
            for line in f
            if line.strip()
        ]
    return pd.DataFrame({
        "url": urls,
        "label": label
    })
df_benign = load_txt(BENIGN_FILE, 0)
df_malign = load_txt(MALIGN_FILE, 1)
df = pd.concat([df_benign, df_malign], ignore_index=True)
print("Dataset size:", len(df))
print(df["label"].value_counts())

# TOKENIZATION
tokenizer = Tokenizer(
    num_words=MAX_WORDS,
    char_level=True
)
tokenizer.fit_on_texts(df["url"])
X_seq = tokenizer.texts_to_sequences(df["url"])
X = pad_sequences(
    X_seq,
    maxlen=MAX_LEN,
    padding="post",
    truncating="post"
)
y = df["label"].values

# 80 : 10 : 10 SPLIT
X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.5,
    stratify=y_temp
)
print("\nSplit sizes:")
print("Train:", X_train.shape[0])
print("Validation:", X_val.shape[0])
print("Test:", X_test.shape[0])

# BUILD LSTM MODEL
model = Sequential([
    Embedding(input_dim=MAX_WORDS, output_dim=64, input_length=MAX_LEN),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation="relu"),
    Dense(1, activation="sigmoid")
])
model.compile(
    loss="binary_crossentropy",
    optimizer="adam",
    metrics=["accuracy"]
)
model.summary()

# TRAIN MODEL
early_stop = EarlyStopping(
    monitor="val_loss", patience=3, restore_best_weights=True
)
history = model.fit(X_train, y_train, validation_data=(X_val, y_val),
    epochs=10, batch_size=64, callbacks=[early_stop], verbose=1
)

# VALIDATION
y_val_prob = model.predict(X_val).flatten()
y_val_pred = (y_val_prob >= 0.5).astype(int)
print("\n=== VALIDATION RESULT ===\n")
print(classification_report(y_val,y_val_pred,digits=4))
print("Validation Accuracy:",accuracy_score(y_val, y_val_pred))
print("Validation AUC:",roc_auc_score(y_val, y_val_prob))

# TEST
y_test_prob = model.predict(X_test).flatten()
y_test_pred = (y_test_prob >= 0.5).astype(int)

print("\n=== FINAL TEST RESULT ===\n")
print(classification_report(
    y_test,
    y_test_pred,
    digits=4
))
print(
    "Test Accuracy:",
    accuracy_score(y_test, y_test_pred)
)
print(
    "Test AUC:",
    roc_auc_score(y_test, y_test_prob)
)

# SAVE MODEL
os.makedirs(MODEL_PATH, exist_ok=True)
model.save(
    MODEL_PATH + "lstm_model.keras"
)
joblib.dump(
    tokenizer,
    MODEL_PATH + "tokenizer_lstm.pkl"
)
print("\n LSTM Model trained")

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