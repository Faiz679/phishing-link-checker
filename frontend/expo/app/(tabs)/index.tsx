import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
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
  const params = useLocalSearchParams<{ url?: string }>();
  const lastHandledUrl = useRef<string | null>(null);

  const [url, setUrl] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    prediction: "safe" | "phishing" | "suspicious";
    confidence: number;
    source: "whitelist" | "blacklist" | "ml";
    processing_time?: number;
  } | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const BASE_URL = "https://phishing-link-checker-production.up.railway.app";

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/history`
      );

      const data = await response.json();

      console.log("HISTORY:", data);

      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("HISTORY ERROR:", error);
      setHistory([]);
    }
  };

  const reportUrl = async (
    url: string,
    prediction: string,
    confidence: number
  ) => {
    try {
      const response = await fetch(
        `${BASE_URL}/report-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            prediction,
            confidence,
          }),
        }
      );

      const data = await response.json();

      alert(data.message);
    } catch (error) {
      console.error("REPORT ERROR:", error);
      alert("Failed to submit report");
    }
  };

  const handleCheck = async () => {
    if (!url.trim()) return;

    setIsChecking(true);
    setResult(null);

    try {
      let cleanUrl = url.trim().toLowerCase();

      cleanUrl = cleanUrl.replace(/\/+$/, "");

      if (!cleanUrl.startsWith("http")) {
        cleanUrl = "http://" + cleanUrl;
      }

      const response = await fetch(`${BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await response.json();

      console.log("API RESPONSE:", data);

      setResult({
        prediction: data.prediction,
        confidence: data.confidence,
        source: data.source,
        processing_time: data.processing_time,
      });

      fetchHistory();

    } catch (error) {
      console.error("API ERROR:", error);

      const end = Date.now();
      const latency = end - start;

      console.log("LATENCY (ms) [FAILED]:", latency);

      setResult({
        prediction: "phishing",
        confidence: 1,
        source: "ml",
      });
    }

    setIsChecking(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Handle deep link param (from +native-intent redirect)
  useEffect(() => {
    const incoming = typeof params.url === "string" ? params.url : undefined;
    if (incoming && incoming !== lastHandledUrl.current) {
      lastHandledUrl.current = incoming;
      setUrl(incoming);
      // Defer so state is set before the check fires
      setTimeout(() => {
        runCheck(incoming);
      }, 50);
    }
  }, [params.url]);

  // Handle links received while app is already open
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url: incoming }) => {
      try {
        const parsed = Linking.parse(incoming);
        const target =
          (parsed.queryParams?.url as string | undefined) ??
          (incoming.startsWith("http") ? incoming : undefined);
        if (target && target !== lastHandledUrl.current) {
          lastHandledUrl.current = target;
          setUrl(target);
          runCheck(target);
        }
      } catch (e) {
        console.log("linking parse error", e);
      }
    });
    return () => sub.remove();
  }, []);

  const runCheck = async (target: string) => {
    setUrl(target);
    setIsChecking(true);
    setResult(null);
    try {
      let cleanUrl = target.trim().toLowerCase().replace(/\/+$/, "");
      if (!cleanUrl.startsWith("http")) cleanUrl = "http://" + cleanUrl;
      const response = await fetch(`${BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await response.json();
      setResult({
        prediction: data.prediction,
        confidence: data.confidence,
        source: data.source,
        processing_time: data.processing_time,
      });
      fetchHistory();
    } catch (error) {
      console.error("API ERROR (deep link):", error);
      setResult({ prediction: "phishing", confidence: 1, source: "ml" });
    }
    setIsChecking(false);
  };

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

             {Array.isArray(history) && history.length > 0 ? (
               history.map((item, index) => {
                 const url = item[0];
                 const result = item[1];
                 const confidence = item[2];
                 const source = item[3]; // 🔥 instead of date

                 const isSafe = result === "safe";
                 const isPhishing = result === "phishing";

                 return (
                   <View
                     key={index}
                     style={[
                       styles.historyItem,
                       isSafe
                         ? styles.safeResult
                         : isPhishing
                         ? styles.phishingResult
                         : styles.suspiciousResult,
                     ]}
                   >
                     {/* URL */}
                     <Text style={[styles.historyUrl]}>
                       {url}
                     </Text>

                     {/* RESULT */}
                     <Text
                       style={[
                         styles.resultText,
                         isSafe
                           ? styles.safeText
                           : isPhishing
                           ? styles.phishingText
                           : styles.suspiciousText,
                       ]}
                     >
                       {result.toUpperCase()} ({source || "ml"})
                     </Text>

                     {/* CONFIDENCE */}
                     <Text style={styles.confidenceText}>
                       Confidence: {(confidence * 100).toFixed(2)}%
                     </Text>
                     <TouchableOpacity
                       style={styles.reportButton}
                       onPress={() =>
                         reportUrl(url, result, confidence)
                       }
                     >
                       <Text style={styles.reportButtonText}>
                         Report Result
                       </Text>
                     </TouchableOpacity>
                   </View>
                 );
               })
             ) : (
               <Text style={{ color: theme.secondaryText }}>
                 No history yet
               </Text>
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
    marginBottom: 2,
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

  reportButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
