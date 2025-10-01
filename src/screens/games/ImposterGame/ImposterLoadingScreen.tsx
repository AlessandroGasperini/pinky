import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../../contexts/GameContext";

const { width, height } = Dimensions.get("window");

export default function ImposterLoadingScreen({ navigation }: any) {
  const { state, navigateToCorrectScreen } = useGame();
  const hasNavigatedRef = useRef(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = React.useState(8);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Navigation logic
  useFocusEffect(
    React.useCallback(() => {
      if (hasNavigatedRef.current) return;

      console.log("🎭 [ImposterLoading] Screen focused");

      // Start countdown
      setCountdown(8);
      hasNavigatedRef.current = false;

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Countdown finished - navigate to game playing
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }

              console.log(
                "🎭 [ImposterLoading] Countdown finished, navigating to game_playing"
              );
              navigateToCorrectScreen(
                navigation,
                "game_playing",
                state.currentGame?.category_chooser_id,
                state.currentPlayer?.id,
                state.currentPlayer?.is_host
              );
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log("🎭 [ImposterLoading] Screen unfocused, cleaning up");
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }, [state.currentGame?.id, state.currentPlayer?.id])
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>🎭 IMPOSTER GAME</Text>

        <View style={styles.countdownContainer}>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ HIDE YOUR SCREEN ⚠️</Text>
          <Text style={styles.warningSubtext}>
            One player will be randomly selected as the imposter
          </Text>
        </View>

        <Text style={styles.instructionText}>
          Everyone will get a word to describe, except the imposter who must
          blend in!
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 40,
    textAlign: "center",
  },
  countdownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  countdown: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  warningContainer: {
    backgroundColor: "#ff4444",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 3,
    borderColor: "#ff6666",
  },
  warningText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  warningSubtext: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
});
