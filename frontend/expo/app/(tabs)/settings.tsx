import { StyleSheet, Text, View, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Shield,
  Info,
  ChevronRight,
  Moon,
} from "lucide-react-native";
import { useState } from "react";

import Colors from "@/constants/colors";
import { useTheme } from "@/providers/theme";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;
  const [notifications, setNotifications] = useState(true);

  const settingsItems = [
    {
      icon: Bell,
      title: "Notifications",
      description: "Get alerts for suspicious links",
      type: "switch" as const,
      value: notifications,
      onValueChange: setNotifications,
    },
    {
      icon: Moon,
      title: "Dark Mode",
      description: "Use dark theme",
      type: "switch" as const,
      value: isDark,
      onValueChange: toggleTheme,
    },
  ];

  const aboutItems = [
    {
      icon: Shield,
      title: "Privacy Policy",
      type: "link" as const,
    },
    {
      icon: Info,
      title: "About LinkGuard",
      type: "link" as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={styles.content}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Preferences</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {settingsItems.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.settingItem,
                  index !== settingsItems.length - 1 && [styles.borderBottom, { borderBottomColor: theme.border }],
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
                    <item.icon color={theme.tint} size={20} />
                  </View>
                  <View>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.settingDescription, { color: theme.tertiaryText }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: theme.border, true: theme.tint }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>About</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {aboutItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.settingItem,
                  index !== aboutItems.length - 1 && [styles.borderBottom, { borderBottomColor: theme.border }],
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.iconBackground }]}>
                    <item.icon color={theme.tint} size={20} />
                  </View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
                </View>
                <ChevronRight color={theme.tertiaryText} size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.tertiaryText }]}>Version 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  versionText: {
    fontSize: 14,
  },
});
