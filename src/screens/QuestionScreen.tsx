import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../services/supabase";
import { navigationManager } from "../services/navigationManager";

export default function QuestionScreen() {
  const navigation = useNavigation();
  const {
    state,
    submitAnswer,
    moveToRoundScoreboard,
    navigateToCorrectScreen,
  } = useGame();
  const [timeLeft, setTimeLeft] = useState(20);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const checkAnswersRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // Get current question - SIMPLIFIED
  const getCurrentQuestion = () => {
    if (
      !state.currentGame?.questions ||
      !Array.isArray(state.currentGame.questions)
    ) {
      return null;
    }

    const questions = state.currentGame.questions;
    const currentRound = state.currentGame.current_round || 0;
    const currentCategoryId = state.currentGame.current_category_id;

    if (currentRound >= questions.length) {
      return null;
    }

    const roundQuestion = questions[currentRound];
    if (!roundQuestion) {
      return null;
    }

    // Get the selected category name
    const selectedCategory = state.categories.find(
      (cat) => cat.id === currentCategoryId
    );
    const categoryName = selectedCategory?.name;

    if (!categoryName) {
      return null;
    }

    // Get the question for the selected category
    return roundQuestion[categoryName];
  };

  const question = getCurrentQuestion();

  // Simple function to check if all players answered
  const checkAllPlayersAnswered = async () => {
    if (!state.currentGame || !state.currentGame.current_question_id)
      return false;

    try {
      // Get all active players
      const { data: players } = await supabase
        .from("players")
        .select("id")
        .eq("game_id", state.currentGame.id)
        .eq("is_active", true);

      // Get all answers for current question
      const { data: answers } = await supabase
        .from("player_answers")
        .select("player_id")
        .eq("game_id", state.currentGame.id)
        .eq("question_id", state.currentGame.current_question_id);

      if (!players || !answers) return false;

      const answeredPlayerIds = new Set(answers.map((a) => a.player_id));
      const allPlayerIds = new Set(players.map((p) => p.id));

      return (
        allPlayerIds.size > 0 &&
        Array.from(allPlayerIds).every((playerId) =>
          answeredPlayerIds.has(playerId)
        )
      );
    } catch (error) {
      console.error("❌ [Question] Error checking answers:", error);
      return false;
    }
  };

  // BULLETPROOF VALIDATION - Only stay if state is question
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || !state.currentPlayer) {
        console.log("❓ [Question] No game or player, redirecting to landing");
        navigation.navigate("Landing" as never);
        return;
      }

      // If not in question state, navigate to correct screen
      if (state.currentGame.current_state !== "question") {
        console.log(
          "❓ [Question] State changed, navigating to correct screen"
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

      console.log("❓ [Question] Staying in Question - correct state");
    }, [state.currentGame?.current_state, state.currentPlayer])
  );

  // Reset everything when question changes
  useEffect(() => {
    if (question) {
      setTimeLeft(question.timeout_seconds || 20);
      setHasAnswered(false);
      setSubmitting(false);
      hasNavigatedRef.current = false;

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [question?.id]);

  // FOCUS-BASED TIMER - Keeps running even after player answers
  useFocusEffect(
    React.useCallback(() => {
      if (!question || hasNavigatedRef.current) return;

      console.log("❓ [Question] Starting timer - screen is focused");
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - navigate to results
            if (!hasNavigatedRef.current) {
              hasNavigatedRef.current = true;
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              if (checkAnswersRef.current) {
                clearInterval(checkAnswersRef.current);
              }
              console.log(
                "❓ [Question] Time's up, moving to round scoreboard"
              );
              moveToRoundScoreboard().then(() => {
                navigateToCorrectScreen(
                  navigation,
                  "round_scoreboard",
                  state.currentGame?.category_chooser_id,
                  state.currentPlayer?.id,
                  state.currentPlayer?.is_host
                );
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log("❓ [Question] Cleaning up timer - screen lost focus");
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [question?.id, state.currentGame?.id, state.currentPlayer?.id])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (checkAnswersRef.current) {
        clearInterval(checkAnswersRef.current);
      }
    };
  }, []);

  const handleAnswer = async (answer: string) => {
    if (hasAnswered || submitting || !question) return;

    try {
      setSubmitting(true);
      setHasAnswered(true);

      // Calculate if answer is correct
      let isCorrect = false;
      if (question.type === "true_false") {
        isCorrect = answer === question.correct_answer;
      } else if (question.type === "never_have_i_ever") {
        isCorrect = answer === "Yes, I have";
      }

      await submitAnswer(answer, isCorrect);

      // Start checking if all players answered
      checkAnswersRef.current = setInterval(async () => {
        const allAnswered = await checkAllPlayersAnswered();
        if (allAnswered && !hasNavigatedRef.current) {
          hasNavigatedRef.current = true;

          // Clear timers
          if (checkAnswersRef.current) {
            clearInterval(checkAnswersRef.current);
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          // Navigate to results
          console.log(
            "❓ [Question] All players answered, moving to round scoreboard"
          );
          moveToRoundScoreboard().then(() => {
            navigateToCorrectScreen(
              navigation,
              "round_scoreboard",
              state.currentGame?.category_chooser_id,
              state.currentPlayer?.id,
              state.currentPlayer?.is_host,
              "Question"
            );
          });
        }
      }, 1000);
    } catch (error) {
      console.error("❌ [Question] Error submitting answer:", error);
      setSubmitting(false);
      setHasAnswered(false);
      Alert.alert("Error", "Failed to submit answer. Please try again.");
    }
  };

  if (!question) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading question...</Text>
        </View>
      </LinearGradient>
    );
  }

  const getAnswerOptions = () => {
    if (question.type === "true_false") {
      return ["True", "False"];
    } else if (question.type === "never_have_i_ever") {
      return ["Yes, I have", "No, I haven't"];
    }
    return [];
  };

  const answerOptions = getAnswerOptions();

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.timer}>{timeLeft}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.category}>
            {state.currentGame?.current_category_id ===
            state.categories.find((c) => c.name === "simple")?.id
              ? "Simple Questions"
              : "Never Have I Ever"}
          </Text>
          <Text style={styles.points}>+{question.points || 1} points</Text>
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question_text}</Text>
      </View>

      <View style={styles.answersContainer}>
        {answerOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              hasAnswered && styles.answerButtonDisabled,
            ]}
            onPress={() => handleAnswer(option)}
            disabled={hasAnswered || submitting}
          >
            <Text style={styles.answerText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasAnswered && (
        <View style={styles.answeredContainer}>
          <Text style={styles.answeredText}>
            {submitting ? "Submitting..." : "Answer submitted!"}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 60,
  },
  timer: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  headerInfo: {
    alignItems: "flex-end",
  },
  category: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  points: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "bold",
    marginTop: 4,
  },
  questionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 20,
  },
  answersContainer: {
    marginBottom: 30,
  },
  answerButton: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  answerButtonDisabled: {
    opacity: 0.6,
  },
  answerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  answeredContainer: {
    alignItems: "center",
    padding: 20,
  },
  answeredText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
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
