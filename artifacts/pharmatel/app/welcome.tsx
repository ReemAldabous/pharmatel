import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useApp();

  const goNext = () => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
      return;
    }
    router.replace("/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 28 }]}
      >
        <View style={styles.logoWrap}>
          <Feather name="activity" size={34} color="#fff" />
        </View>
        <Text style={styles.title}>PharmaTel</Text>
        <Text style={styles.subtitle}>
          رفيقك الذكي لتنظيم أدويتك، التذكير بالجرعات، ومتابعة حالتك الصحية بسهولة.
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="bell" size={18} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>تنبيهات دقيقة للجرعات</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              لا تفوّت أي جرعة مع تذكيرات واضحة في الوقت المناسب.
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBadge, { backgroundColor: colors.secondary + "18" }]}>
            <Feather name="book-open" size={18} color={colors.secondary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>سجل صحي يومي</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              دوّن الأعراض والملاحظات اليومية لمتابعة أفضل مع الطبيب.
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBadge, { backgroundColor: colors.accent + "1A" }]}>
            <Feather name="map-pin" size={18} color={colors.accent} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>بحث سريع عن الصيدليات</Text>
            <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
              اعثر على أقرب الصيدليات المتوفرة لدوائك بسهولة.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>{isAuthenticated ? "الدخول للتطبيق" : "ابدأ الآن"}</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  logoWrap: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.95)",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  ctaButton: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
