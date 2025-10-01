import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../../contexts/GameContext";

const { width, height } = Dimensions.get("window");

export default function ImposterGameScreen({ navigation }: any) {
  const { state, navigateToCorrectScreen } = useGame();
  const hasNavigatedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [word, setWord] = useState("");
  const [isImposter, setIsImposter] = useState(false);
  const [isWordRevealed, setIsWordRevealed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const curtainAnim = useRef(new Animated.Value(0)).current;
  const wordSetRef = useRef(false);
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get timeout from category
  const getTimeoutForCurrentCategory = () => {
    if (!state.currentGame?.current_category_id) return 30;

    const currentCategory = state.categories.find(
      (cat) => cat.id === state.currentGame?.current_category_id
    );

    return currentCategory?.timeout_seconds || 30;
  };

  // Handle word reveal/hide with coin flip animation
  const handleWordReveal = () => {
    if (isWordRevealed) return; // Prevent multiple clicks while revealed

    setIsWordRevealed(true);

    // Start curtain animation
    Animated.sequence([
      // Pull curtain up to reveal
      Animated.timing(curtainAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Hold for 2 seconds
      Animated.delay(2000),
      // Pull curtain down to hide
      Animated.timing(curtainAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsWordRevealed(false);
    });

    // Clear any existing timer
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }

    // Auto-hide after 3 seconds (as backup)
    autoHideTimerRef.current = setTimeout(() => {
      setIsWordRevealed(false);
    }, 3000);
  };

  // Initialize game data (only once)
  useEffect(() => {
    if (state.currentGame?.game_data && !wordSetRef.current) {
      const gameData = state.currentGame.game_data;
      setIsImposter(gameData.imposter_id === state.currentPlayer?.id);

      if (gameData.imposter_id === state.currentPlayer?.id) {
        setWord("Try to blend in");
      } else {
        // Get a random word from the words array
        const words = gameData.words || [];
        const randomWord = words[Math.floor(Math.random() * words.length)];
        setWord(randomWord || "Unknown word");
      }

      wordSetRef.current = true;
    }
  }, [state.currentGame?.game_data, state.currentPlayer?.id]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Timer logic
  useFocusEffect(
    React.useCallback(() => {
      if (hasNavigatedRef.current) return;

      console.log("🎭 [ImposterGame] Starting timer - screen is focused");
      setTimeLeft(getTimeoutForCurrentCategory());

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - navigate to voting
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }

              console.log("🎭 [ImposterGame] Time's up, moving to voting");
              navigateToCorrectScreen(
                navigation,
                "game_voting",
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
        console.log("🎭 [ImposterGame] Cleaning up timer - screen lost focus");
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (autoHideTimerRef.current) {
          clearTimeout(autoHideTimerRef.current);
        }
      };
    }, [state.currentGame?.id, state.currentPlayer?.id])
  );

  const handleNextPhase = () => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      navigateToCorrectScreen(
        navigation,
        "game_voting",
        state.currentGame?.category_chooser_id,
        state.currentPlayer?.id,
        state.currentPlayer?.is_host
      );
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{timeLeft}</Text>
        </View>

        {/* Game Content */}
        <View style={styles.gameContent}>
          <TouchableOpacity
            style={styles.curtainContainer}
            onPress={handleWordReveal}
            activeOpacity={0.9}
          >
            <View style={styles.contentContainer}>
              {/* Content underneath curtain */}
              <Text style={styles.roleTitle}>
                {isImposter ? "🎭 IMPOSTER" : "👥 PLAYER"}
              </Text>
              <Text style={styles.instructionText}>
                {isImposter ? "try to blend in" : "the word is"}
              </Text>
              <Text style={[styles.word, isImposter && styles.imposterWord]}>
                {word}
              </Text>
            </View>

            {/* Curtain overlay */}
            <Animated.View
              style={[
                styles.curtain,
                {
                  transform: [
                    {
                      translateY: curtainAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -300],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.curtainText}>🎭</Text>
              <Text style={styles.curtainText}>Click to reveal your role</Text>
              <Text style={styles.curtainSubtext}>
                Tap to see for 3 seconds
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNextPhase}>
          <Text style={styles.nextButtonText}>Ready to Vote →</Text>
        </TouchableOpacity>
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
    width: "100%",
  },
  timerContainer: {
    backgroundColor: "#ff6b6b",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 4,
  },
  timer: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  gameContent: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 40,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  curtainContainer: {
    width: 320,
    height: 280,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 30,
    position: "relative",
  },
  contentContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#4ecdc4",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  curtain: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#FFC0CB",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  curtainText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  curtainSubtext: {
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  word: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  imposterWord: {
    color: "#ff6b6b",
  },
  imposterTip: {
    backgroundColor: "#ff4444",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  playerTip: {
    backgroundColor: "#4ecdc4",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  tipText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },
  nextButton: {
    backgroundColor: "#4ecdc4",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
