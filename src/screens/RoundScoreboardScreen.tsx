import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../services/supabase";
import { navigationManager } from "../services/navigationManager";

interface ResultItem {
  id: string;
  name: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
}

export default function RoundScoreboardScreen() {
  const navigation = useNavigation();
  const { state, getPlayerScores, returnToLobby, navigateToCorrectScreen } =
    useGame();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [question, setQuestion] = useState<any>(null);
  const [scores, setScores] = useState<{ [playerId: string]: number }>({});
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // BULLETPROOF VALIDATION - Only stay if state is round_scoreboard
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || !state.currentPlayer) {
        console.log(
          "📊 [RoundScoreboard] No game or player, redirecting to landing"
        );
        navigation.navigate("Landing" as never);
        return;
      }

      // If not in round_scoreboard state, navigate to correct screen
      if (state.currentGame.current_state !== "round_scoreboard") {
        console.log(
          "📊 [RoundScoreboard] State changed, navigating to correct screen"
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
        "📊 [RoundScoreboard] Staying in RoundScoreboard - correct state"
      );
    }, [state.currentGame?.current_state, state.currentPlayer])
  );

  // Fetch results when component mounts
  useEffect(() => {
    if (!state.currentGame?.current_question_id) return;

    const fetchResults = async () => {
      try {
        // Fetch question details
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", state.currentGame!.current_question_id)
          .single();

        if (questionError) {
          console.error(
            "❌ [RoundScoreboard] Error fetching question:",
            questionError
          );
          return;
        }

        setQuestion(questionData);

        // Fetch player answers
        const { data: answersData, error: answersError } = await supabase
          .from("player_answers")
          .select(
            `
            *,
            players(name)
          `
          )
          .eq("game_id", state.currentGame!.id)
          .eq("question_id", state.currentGame!.current_question_id);

        if (answersError) {
          console.error(
            "❌ [RoundScoreboard] Error fetching answers:",
            answersError
          );
          setResults([]);
          return;
        }

        const formattedResults =
          answersData?.map((answer: any) => ({
            id: answer.id,
            name: answer.players?.name || "Unknown Player",
            answer: answer.answer || "No answer",
            is_correct: answer.is_correct || false,
            points_earned: answer.points_earned || 0,
          })) || [];

        setResults(formattedResults);

        // Get current scores
        const currentScores = await getPlayerScores();
        setScores(currentScores);
      } catch (error) {
        console.error("❌ [RoundScoreboard] Error fetching results:", error);
      }
    };

    fetchResults();
  }, [state.currentGame?.current_question_id, state.currentGame?.id]);

  // FOCUS-BASED COUNTDOWN - Only runs when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (
        hasNavigatedRef.current ||
        !state.currentGame ||
        state.currentGame.current_state !== "round_scoreboard"
      ) {
        return;
      }

      console.log(
        "📊 [RoundScoreboard] Starting 10-second countdown - screen is focused"
      );
      setCountdown(10);
      hasNavigatedRef.current = false;

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Only host triggers return to lobby
            if (!hasNavigatedRef.current && state.currentPlayer?.is_host) {
              hasNavigatedRef.current = true;
              if (countdownRef.current) {
                clearInterval(countdownRef.current);
              }
              console.log(
                "📊 [RoundScoreboard] Host triggering return to lobby"
              );
              returnToLobby();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log(
          "📊 [RoundScoreboard] Cleaning up countdown - screen lost focus"
        );
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    }, [state.currentGame?.current_state, state.currentPlayer?.is_host]) // Restart if state changes
  );

  // LISTEN FOR STATE CHANGES - Only when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (
        state.currentGame?.current_state === "waiting" &&
        !hasNavigatedRef.current
      ) {
        hasNavigatedRef.current = true;
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
        console.log(
          "📊 [RoundScoreboard] State changed to waiting, navigating to lobby"
        );
        // Use centralized navigation
        navigateToCorrectScreen(
          navigation,
          "waiting",
          state.currentGame.category_chooser_id,
          state.currentPlayer?.id,
          state.currentPlayer?.is_host
        );
      }
    }, [state.currentGame?.current_state, state.currentPlayer])
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const getCurrentPlayerResult = () => {
    if (!state.currentPlayer) return null;
    return results.find((r) => r.name === state.currentPlayer?.name);
  };

  const getOtherPlayersResults = () => {
    if (!state.currentPlayer) return results;
    return results.filter((r) => r.name !== state.currentPlayer?.name);
  };

  const currentPlayerResult = getCurrentPlayerResult();
  const otherPlayersResults = getOtherPlayersResults();

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Round Results</Text>
          <Text style={styles.countdown}>Next round in {countdown}s</Text>
        </View>

        {question && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{question.question_text}</Text>
            {question.correct_answer && (
              <Text style={styles.correctAnswer}>
                Correct Answer: {question.correct_answer}
              </Text>
            )}
          </View>
        )}

        {/* Current Player Result */}
        {currentPlayerResult && (
          <View style={styles.currentPlayerSection}>
            <Text style={styles.sectionTitle}>Your Result</Text>
            <View
              style={[
                styles.playerResult,
                currentPlayerResult.is_correct
                  ? styles.correctResult
                  : styles.incorrectResult,
              ]}
            >
              <Text style={styles.playerName}>
                {currentPlayerResult.name} (You)
              </Text>
              <Text style={styles.playerAnswer}>
                {currentPlayerResult.answer}
              </Text>
              <Text style={styles.playerPoints}>
                +{currentPlayerResult.points_earned} points
              </Text>
            </View>
          </View>
        )}

        {/* No Results Message */}
        {results.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              No results available yet. Loading...
            </Text>
          </View>
        )}

        {/* Other Players Results */}
        {otherPlayersResults.length > 0 && (
          <View style={styles.otherPlayersSection}>
            <Text style={styles.sectionTitle}>Other Players</Text>
            {otherPlayersResults.map((result, index) => (
              <View
                key={result.id}
                style={[
                  styles.playerResult,
                  result.is_correct
                    ? styles.correctResult
                    : styles.incorrectResult,
                ]}
              >
                <Text style={styles.playerName}>{result.name}</Text>
                <Text style={styles.playerAnswer}>{result.answer}</Text>
                <Text style={styles.playerPoints}>
                  +{result.points_earned} points
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  countdown: {
    fontSize: 16,
    color: "#4CAF50",
  },
  questionContainer: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  questionText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  correctAnswer: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "bold",
  },
  currentPlayerSection: {
    marginBottom: 30,
  },
  otherPlayersSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  playerResult: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
  },
  correctResult: {
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
  },
  incorrectResult: {
    backgroundColor: "#C62828",
    borderColor: "#F44336",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  playerAnswer: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 5,
  },
  playerPoints: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "bold",
  },
  scoresSection: {
    marginBottom: 30,
  },
  scoreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  scoreRank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    width: 40,
  },
  scoreName: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
    marginLeft: 10,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFD700",
  },
  noResultsContainer: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 16,
    color: "#FFD700",
    textAlign: "center",
    fontStyle: "italic",
  },
});
