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

