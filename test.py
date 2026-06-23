BENIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/benign_sample_10000_rs42.txt"
MALIGN_FILE = "Phishing Website Detection Dataset/Data/Sampled/malign_sample_10000_rs42.txt"
MODEL_PATH = "Model/lstm/"

def normalize_url(url):
    url = url.strip().lower()
    if url.startswith("http://"):
        url = url[7:]
    elif url.startswith("https://"):
        url = url[8:]
    return "http://" + url

def load_txt(file, label):
    with open(file, "r", encoding="utf-8", errors="ignore") as f:
        urls = [normalize_url(line.strip()) for line in f if line.strip()]
    return pd.DataFrame({"url": urls, "label": label})

df_benign = load_txt(BENIGN_FILE, 0)
df_malign = load_txt(MALIGN_FILE, 1)
df = pd.concat([df_benign, df_malign], ignore_index=True)




model = Sequential([
    Embedding(input_dim=MAX_WORDS, output_dim=64, input_length=MAX_LEN),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    Dense(32, activation="relu"),
    Dense(1, activation="sigmoid")
])

early_stop = EarlyStopping(
    monitor="val_loss", patience=3, restore_best_weights=True
)
history = model.fit(X_train, y_train, validation_data=(X_val, y_val),
    epochs=10, batch_size=64, callbacks=[early_stop], verbose=1
)