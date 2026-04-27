import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Search, Shield, ShieldAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useTheme } from "@/providers/theme";

export default function HomeScreen() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    prediction: "safe" | "phishing" | "suspicious";
    confidence: number;
    source: "whitelist" | "blacklist" | "ml";
  } | null>(null);

  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        "https://decompose-shell-crushing.ngrok-free.dev/history"
      );

      const data = await response.json();

      console.log("HISTORY:", data);

      setHistory(data);
    } catch (error) {
      console.error("HISTORY ERROR:", error);
    }
  };

  const handleCheck = async () => {
    if (!url.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      let cleanUrl = url.trim().toLowerCase();

      // remove trailing slash
      cleanUrl = cleanUrl.replace(/\/+$/, "");

      // ensure protocol
      if (!cleanUrl.startsWith("http")) {
        cleanUrl = "http://" + cleanUrl;
      }

      const response = await fetch(
        "https://decompose-shell-crushing.ngrok-free.dev/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: cleanUrl }),
        }
      );

      const data = await response.json();

      console.log("API RESPONSE:", data);

      // ✅ KEEP SAME RESULT FORMAT FOR UI
      setResult({
        prediction: data.prediction,
        confidence: data.confidence,
        source: data.source,
      });
    fetchHistory();

    } catch (error) {
      console.error("API ERROR:", error);

      // fallback (optional)
      setResult({
        prediction: "phishing",
        confidence: 1,
        source: "ml",
      });
    }

    // ✅ IMPORTANT: keep this OUTSIDE like your original structure
    setIsChecking(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
              <Shield color={theme.tint} size={48} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>LinkGuard</Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
              Type the link below to check the possibility for a phishing or not.
            </Text>
          </View>

          <View style={styles.inputSection}>
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Paste link here..."
                placeholderTextColor={theme.tertiaryText}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {url.length > 0 && (
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: theme.tint }]}
                  onPress={handleCheck}
                  disabled={isChecking}
                  testID="search-button"
                >
                  <Search color="#fff" size={20} />
                </TouchableOpacity>
              )}
            </View>

            {isChecking && (
              <View style={styles.checkingContainer}>
                <Text style={[styles.checkingText, { color: theme.secondaryText }]}>Analyzing link...</Text>
              </View>
            )}

            {result && !isChecking && (
              <View
                style={[
                  styles.resultContainer,
                  result.prediction === "safe"
                    ? styles.safeResult
                    : result.prediction === "suspicious"
                    ? styles.suspiciousResult
                    : styles.phishingResult,
                ]}
              >
                {result.prediction === "safe" ? (
                  <>
                    <Shield color="#10b981" size={32} />
                    <Text style={[styles.resultText, styles.safeText]}>
                      Safe ({result.source})
                    </Text>
                  </>
                ) : result.prediction === "suspicious" ? (
                  <>
                    <Shield color="#f59e0b" size={32} />
                    <Text style={[styles.resultText, styles.suspiciousText]}>
                      Suspicious (ML)
                    </Text>
                  </>
                ) : (
                  <>
                    <ShieldAlert color="#ef4444" size={32} />
                    <Text style={[styles.resultText, styles.phishingText]}>
                      Phishing ({result.source})
                    </Text>
                  </>
                )}

                {/* 🔥 Confidence */}
                <Text style={styles.confidenceText}>
                  Confidence: {(result.confidence * 100).toFixed(2)}%
                </Text>
              </View>
            )}
            <View style={styles.historyContainer}>
              <Text style={[styles.tipsTitle, { color: theme.text }]}>
                Recent Checks
              </Text>

              {history.length === 0 ? (
                <Text style={{ color: theme.secondaryText }}>
                  No history yet
                </Text>
              ) : (
                history.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.historyItem,
                      { backgroundColor: theme.card }
                    ]}
                    onPress={() => setUrl(item.url)} // 🔥 clickable
                  >
                    {/* URL */}
                    <Text
                      style={[styles.historyUrl, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.url}
                    </Text>

                    {/* RESULT */}
                    <Text
                      style={[
                        styles.historyMeta,
                        {
                          color:
                            item.prediction === "safe"
                              ? "#10b981"
                              : item.prediction === "phishing"
                              ? "#ef4444"
                              : "#f59e0b",
                        },
                      ]}
                    >
                      {(item.prediction === "benign" ? "safe" : item.prediction)} ({item.source || "ml"}) • {(item.confidence * 100).toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          <View style={[styles.tipsContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.tipsTitle, { color: theme.text }]}>Safety Tips</Text>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: theme.tint }]} />
              <Text style={[styles.tipText, { color: theme.secondaryText }]}>
                Check for misspelled domain names
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: theme.tint }]} />
              <Text style={[styles.tipText, { color: theme.secondaryText }]}>
                Look for HTTPS encryption
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: theme.tint }]} />
              <Text style={[styles.tipText, { color: theme.secondaryText }]}>
                Be cautious of urgent requests
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 280,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchButton: {
    borderRadius: 12,
    padding: 12,
    marginRight: 4,
  },
  checkingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  checkingText: {
    fontSize: 14,
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  safeResult: {
    backgroundColor: "#d1fae5",
  },
  phishingResult: {
    backgroundColor: "#fee2e2",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
  },
  safeText: {
    color: "#059669",
  },
  phishingText: {
    color: "#dc2626",
  },
  tipsContainer: {
    borderRadius: 20,
    padding: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  tipText: {
    fontSize: 15,
  },
  historyContainer: {
    marginTop: 20,
  },

  historyItem: {
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
  },

  historyUrl: {
    fontSize: 14,
    fontWeight: "500",
  },

  historyMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  suspiciousResult: {
    backgroundColor: "#fef3c7",
  },

  suspiciousText: {
    color: "#b45309",
  },

  confidenceText: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.8,
  },
});
