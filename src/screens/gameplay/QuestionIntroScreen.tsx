import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../contexts/GameContext";
import { db } from "../../services/supabase";
import { navigationManager } from "../../services/navigationManager";

export default function QuestionIntroScreen() {
  const navigation = useNavigation();
  const { state, navigateToCorrectScreen } = useGame();
  const [countdown, setCountdown] = useState(8);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // BULLETPROOF VALIDATION - Only stay if state is question_intro
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || !state.currentPlayer) {
        console.log(
          "📖 [QuestionIntro] No game or player, redirecting to landing"
        );
        navigation.navigate("Landing" as never);
        return;
      }

      // If not in question_intro state, navigate to correct screen
      if (state.currentGame.current_state !== "question_intro") {
        console.log(
          "📖 [QuestionIntro] State changed, navigating to correct screen"
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

      console.log(
        "📖 [QuestionIntro] Staying in QuestionIntro - correct state"
      );
    }, [state.currentGame?.current_state, state.currentPlayer])
  );

  // FOCUS-BASED COUNTDOWN - Only runs when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || hasNavigatedRef.current) return;

      console.log("📖 [QuestionIntro] Starting countdown - screen is focused");
      setCountdown(8);
      hasNavigatedRef.current = false;

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Countdown finished - update game state and navigate
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }

              // Update game state to question
              if (state.currentGame?.id) {
                db.updateGame(state.currentGame.id, {
                  current_state: "question",
                }).then(() => {
                  console.log(
                    "📖 [QuestionIntro] Countdown finished, navigating to question"
                  );
                  navigateToCorrectScreen(
                    navigation,
                    "question",
                    state.currentGame?.category_chooser_id,
                    state.currentPlayer?.id,
                    state.currentPlayer?.is_host
                  );
                });
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log(
          "📖 [QuestionIntro] Cleaning up countdown - screen lost focus"
        );
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }, [state.currentGame?.id, state.currentPlayer?.id])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const getCategoryName = () => {
    if (!state.currentGame?.current_category_id) return "Unknown";

    const category = state.categories.find(
      (cat) => cat.id === state.currentGame.current_category_id
    );
    return category?.name || "Unknown";
  };

  const categoryName = getCategoryName();

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Get Ready!</Text>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.countdown}>{countdown}</Text>
        <Text style={styles.subtitle}>Question starting in...</Text>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  category: {
    fontSize: 24,
    color: "#4CAF50",
    fontWeight: "bold",
    marginBottom: 40,
  },
  countdown: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
  },
});
