import { Stack, Link } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Home } from "lucide-react-native";

import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Oops!" }} />
      
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.subtitle}>
        The page you're looking for doesn't exist.
      </Text>
      
      <Link href="/" asChild>
        <TouchableOpacity style={styles.button}>
          <Home color="#fff" size={20} />
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
