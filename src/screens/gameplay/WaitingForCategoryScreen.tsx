// PROFESSIONAL WAITING FOR CATEGORY SCREEN - Bulletproof navigation
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../contexts/GameContext";
import { navigationManager } from "../../services/navigationManager";

export default function WaitingForCategoryScreen() {
  const navigation = useNavigation();
  const { state, navigateToCorrectScreen } = useGame();
  const [dots, setDots] = useState("");

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // BULLETPROOF VALIDATION - Only stay if state is category_selection and user is NOT chooser
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || !state.currentPlayer) {
        console.log(
          "⏳ [WaitingForCategory] No game or player, redirecting to landing"
        );
        navigation.navigate("Landing" as never);
        return;
      }

      // If not in category_selection state, navigate to correct screen
      if (state.currentGame.current_state !== "category_selection") {
        console.log(
          "⏳ [WaitingForCategory] State changed, navigating to correct screen"
        );
        navigateToCorrectScreen(
          navigation,
          state.currentGame.current_state,
          state.currentGame.category_chooser_id,
          state.currentPlayer.id,
          state.currentPlayer.is_host
        );
        return;
      }

      // If user IS the category chooser, navigate to selection screen
      if (state.currentGame.category_chooser_id === state.currentPlayer.id) {
        console.log(
          "⏳ [WaitingForCategory] User is category chooser, navigating to selection"
        );
        navigateToCorrectScreen(
          navigation,
          "category_selection",
          state.currentGame.category_chooser_id,
          state.currentPlayer.id,
          state.currentPlayer.is_host
        );
        return;
      }

      console.log(
        "⏳ [WaitingForCategory] Staying in WaitingForCategory - correct state and user"
      );
    }, [
      state.currentGame?.current_state,
      state.currentGame?.category_chooser_id,
      state.currentPlayer,
    ])
  );

  const getCategoryChooserName = () => {
    if (!state.currentGame?.category_chooser_id) return "Someone";

    const chooser = state.players.find(
      (p) => p.id === state.currentGame?.category_chooser_id
    );
    return chooser?.name || "Someone";
  };

  if (!state.currentGame || !state.currentPlayer) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active game</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎯</Text>
        </View>

        <Text style={styles.title}>Waiting for Category</Text>
        <Text style={styles.subtitle}>
          {getCategoryChooserName()} is choosing the category{dots}
        </Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    textAlign: "center",
  },
});
