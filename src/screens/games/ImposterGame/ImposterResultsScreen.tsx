import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../../contexts/GameContext";
import { db } from "../../../services/supabase";

interface RoundResult {
  imposterId: string;
  imposterCaught: boolean;
  votedOutPlayer: string;
  voteCounts: Record<string, number>;
  playerScores: Record<string, number>;
  votes: Record<string, string>;
  word: string;
}

export default function ImposterResultsScreen({ navigation }: any) {
  const { state, navigateToCorrectScreen, returnToLobby } = useGame();
  const [results, setResults] = useState<RoundResult | null>(null);
  const [countdown, setCountdown] = useState(8);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasNavigatedRef = useRef(false);
  const scoresSavedRef = useRef(false); // To prevent duplicate score saving
  const resultsCalculatedRef = useRef(false); // To prevent duplicate result calculation

  // Calculate results when component mounts
  useEffect(() => {
    if (
      state.currentGame?.game_data &&
      state.players &&
      !resultsCalculatedRef.current
    ) {
      resultsCalculatedRef.current = true;
      const gameData = state.currentGame.game_data;
      const imposterId = gameData.imposter_id;
      const votes = gameData.votes || {};
      const words = gameData.words || [];
      const word = (words.length > 0 ? words[0] : null) || "Unknown word"; // Use first word as the main word

      // Count votes for each player
      const voteCounts: Record<string, number> = {};
      Object.values(votes).forEach((votedFor: string) => {
        voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
      });

      // Find who got the most votes
      const voteEntries = Object.entries(voteCounts);
      const mostVotedPlayer =
        voteEntries.length > 0
          ? voteEntries.reduce((a, b) =>
              voteCounts[a[0]] > voteCounts[b[0]] ? a : b
            )
          : ["Unknown", 0];

      const imposterCaught = mostVotedPlayer[0] === imposterId;

      // Simple scoring: 3 points for correct vote, 1 point for wrong vote
      const playerScores: Record<string, number> = {};
      state.players.forEach((player) => {
        if (player.id === imposterId) {
          // Imposter gets 3 points if not caught, 0 if caught
          playerScores[player.id] = imposterCaught ? 0 : 3;
        } else {
          // Regular players get 3 points if they voted for imposter, 1 if they voted for someone else
          const playerVote = votes[player.id];
          playerScores[player.id] = playerVote === imposterId ? 3 : 1;
        }
      });

      setResults({
        imposterId: imposterId || "Unknown",
        imposterCaught,
        votedOutPlayer: String(mostVotedPlayer[0]),
        voteCounts,
        playerScores,
        votes,
        word,
      });

      // Save scores to database (only once)
      if (state.currentGame?.id && !scoresSavedRef.current) {
        scoresSavedRef.current = true;
        db.saveGameResults(
          state.currentGame.id,
          state.currentGame.current_round || 1,
          playerScores,
          {
            imposterId,
            imposterCaught,
            votedOutPlayer: String(mostVotedPlayer[0]),
            voteCounts,
            votes,
          }
        )
          .then(() => {
            console.log("✅ [ImposterResults] Scores saved to database");
          })
          .catch((error) => {
            console.error("❌ [ImposterResults] Failed to save scores:", error);
          });
      }
    }
  }, [state.currentGame?.game_data, state.players]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Countdown and navigation
  useFocusEffect(
    React.useCallback(() => {
      if (hasNavigatedRef.current) return;

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            hasNavigatedRef.current = true; // Set flag before navigation
            console.log(
              "🎭 [ImposterResults] Countdown finished, returning to lobby"
            );
            returnToLobby().then(() => {
              navigateToCorrectScreen(
                navigation,
                "waiting",
                state.currentGame?.category_chooser_id,
                state.currentPlayer?.id,
                state.currentPlayer?.is_host
              );
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [
      navigation,
      state.currentGame?.category_chooser_id,
      state.currentPlayer?.id,
      state.currentPlayer?.is_host,
      returnToLobby,
      navigateToCorrectScreen,
    ])
  );

  const getImposterName = () => {
    if (!results) return "Unknown";
    const imposter = state.players.find((p) => p.id === results.imposterId);
    return imposter?.name || "Unknown";
  };

  const getVotedOutPlayerName = () => {
    if (!results) return "Unknown";
    const player = state.players.find((p) => p.id === results.votedOutPlayer);
    return player?.name || "Unknown";
  };

  if (!results) {
    return (
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating results...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Round Results</Text>
            <Text style={styles.subtitle}>Imposter Game</Text>
          </View>

          {/* Imposter Status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusEmoji}>
                {results.imposterCaught ? "🕵️" : "😈"}
              </Text>
              <Text style={styles.statusTitle}>
                {results.imposterCaught
                  ? "IMPOSTER CAUGHT!"
                  : "IMPOSTER ESCAPED!"}
              </Text>
            </View>

            <View style={styles.gameInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Imposter:</Text>
                <Text style={styles.infoValue}>{getImposterName()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Word:</Text>
                <Text style={styles.infoValue}>"{results.word}"</Text>
              </View>
              {results.imposterCaught ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Voted out:</Text>
                  <Text style={styles.infoValue}>
                    {getVotedOutPlayerName()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.escapedMessage}>
                  The imposter blended in successfully!
                </Text>
              )}
            </View>
          </View>

          {/* Round Scores */}
          <View style={styles.scoresContainer}>
            <Text style={styles.scoresTitle}>Round Scores</Text>
            {state.players.map((player) => {
              const points = results.playerScores[player.id] || 0;
              const isImposter = player.id === results.imposterId;
              const votedFor = results.votes[player.id];
              const votedForPlayer = state.players.find(
                (p) => p.id === votedFor
              );

              return (
                <View key={player.id} style={styles.playerScoreRow}>
                  <View style={styles.playerInfo}>
                    <View style={styles.playerHeader}>
                      {player.avatar &&
                      (player.avatar.startsWith("http") ||
                        player.avatar.startsWith("file://") ||
                        player.avatar.startsWith("data:")) ? (
                        <Image
                          source={{ uri: player.avatar }}
                          style={styles.playerAvatarImage}
                          onError={() =>
                            console.log("Image load error for:", player.avatar)
                          }
                        />
                      ) : (
                        <View style={styles.playerInitialCircle}>
                          <Text style={styles.playerInitial}>
                            {player.avatar ||
                              player.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.playerNameContainer}>
                        <Text style={styles.playerName}>
                          {player.name} {isImposter && "👑"}
                        </Text>
                        {!isImposter && votedForPlayer && (
                          <Text style={styles.voteInfo}>
                            Voted for: {votedForPlayer.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.pointsContainer,
                      points === 3 ? styles.correctVote : styles.wrongVote,
                    ]}
                  >
                    <Text style={styles.pointsText}>+{points}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Countdown */}
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              Back to lobby in {countdown}s
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  statusContainer: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  gameInfo: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    padding: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  infoLabel: {
    fontSize: 16,
    color: "#ccc",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  escapedMessage: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  scoresContainer: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  scoresTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  playerScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerNameContainer: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  voteInfo: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 2,
  },
  pointsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: "center",
  },
  pointsText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  correctVote: {
    backgroundColor: "#4CAF50",
  },
  wrongVote: {
    backgroundColor: "#ff9800",
  },
  countdownContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  countdownText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  playerInitialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4ecdc4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  playerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
});
