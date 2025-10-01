import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../../contexts/GameContext";
import { db } from "../../../services/supabase";

export default function ImposterVotingScreen({ navigation }: any) {
  const { state, navigateToCorrectScreen } = useGame();
  const hasNavigatedRef = useRef(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingProgress, setVotingProgress] = useState({ voted: 0, total: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Filter out current player from voting options
  const otherPlayers = (state.players || []).filter(
    (player) => player.id !== state.currentPlayer?.id
  );

  // Check voting progress
  const checkVotingProgress = React.useCallback(() => {
    if (!state.currentGame?.game_data || !state.players) return;

    const votes = state.currentGame.game_data.votes || {};
    const totalPlayers = state.players.length;
    const votedCount = Object.keys(votes).length;

    console.log("🎭 [ImposterVoting] Voting progress check:", {
      votes,
      totalPlayers,
      votedCount,
      hasVoted,
    });

    setVotingProgress({ voted: votedCount, total: totalPlayers });

    // If everyone has voted, calculate results and return to lobby
    if (
      votedCount >= totalPlayers &&
      !hasNavigatedRef.current &&
      totalPlayers > 0
    ) {
      hasNavigatedRef.current = true;
      console.log("🎭 [ImposterVoting] All players voted, moving to results");

      // Update game state to results and navigate to results screen
      if (state.currentGame?.id) {
        db.updateGame(state.currentGame.id, { current_state: "game_results" })
          .then(() => {
            console.log(
              "✅ [ImposterVoting] All players voted, moving to results"
            );
            navigateToCorrectScreen(
              navigation,
              "game_results",
              state.currentGame?.category_chooser_id,
              state.currentPlayer?.id,
              state.currentPlayer?.is_host
            );
          })
          .catch((error) => {
            console.error(
              "❌ [ImposterVoting] Failed to update game state:",
              error
            );
          });
      }
    }
  }, [state.currentGame?.game_data, state.players, hasVoted]);

  // Check progress when game data changes
  useEffect(() => {
    checkVotingProgress();
  }, [checkVotingProgress]);

  // Navigation logic
  useFocusEffect(
    React.useCallback(() => {
      if (hasNavigatedRef.current) return;

      console.log("🎭 [ImposterVoting] Screen focused");

      // Auto-navigate after 60 seconds if not everyone voted
      const timeout = setTimeout(() => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          console.log("🎭 [ImposterVoting] Timeout reached, moving to results");
          navigateToCorrectScreen(
            navigation,
            "game_results",
            state.currentGame?.category_chooser_id,
            state.currentPlayer?.id,
            state.currentPlayer?.is_host
          );
        }
      }, 60000); // 60 seconds

      return () => {
        console.log("🎭 [ImposterVoting] Screen unfocused, cleaning up");
        clearTimeout(timeout);
      };
    }, [state.currentGame?.id, state.currentPlayer?.id])
  );

  const handleVote = (playerId: string) => {
    if (hasVoted || playerId === state.currentPlayer?.id) return;

    setSelectedPlayer(playerId);
    setHasVoted(true);

    // Save vote to database
    if (state.currentGame?.id && state.currentPlayer?.id) {
      db.savePlayerVote(state.currentGame.id, state.currentPlayer.id, playerId)
        .then(() => {
          console.log(`🎭 [ImposterVoting] Vote saved for player: ${playerId}`);
          // Don't navigate immediately - let the real-time updates handle it
        })
        .catch((error) => {
          console.error("❌ [ImposterVoting] Failed to save vote:", error);
        });
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>🎭 WHO IS THE IMPOSTER?</Text>

        {/* Voting Status List */}
        <View style={styles.votingStatusContainer}>
          {votingProgress.voted < votingProgress.total && (
            <Text style={styles.waitingText}>
              Waiting for {votingProgress.total - votingProgress.voted} more
              player
              {votingProgress.total - votingProgress.voted !== 1 ? "s" : ""}...
            </Text>
          )}
          <View style={styles.playersStatusList}>
            {state.players.map((player) => {
              const hasVotedForThisPlayer =
                state.currentGame?.game_data?.votes?.[player.id];
              const isCurrentPlayer = player.id === state.currentPlayer?.id;

              return (
                <View key={player.id} style={styles.playerStatusRow}>
                  <View style={styles.playerStatusInfo}>
                    {player.avatar &&
                    (player.avatar.startsWith("http") ||
                      player.avatar.startsWith("file://") ||
                      player.avatar.startsWith("data:")) ? (
                      <Image
                        source={{ uri: player.avatar }}
                        style={styles.playerStatusAvatarImage}
                        onError={() =>
                          console.log("Image load error for:", player.avatar)
                        }
                      />
                    ) : (
                      <View style={styles.playerStatusInitialCircle}>
                        <Text style={styles.playerStatusInitial}>
                          {player.avatar || player.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.playerStatusName,
                        isCurrentPlayer && styles.currentPlayerName,
                      ]}
                    >
                      {player.name} {isCurrentPlayer && "(You)"}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.voteStatus,
                      hasVotedForThisPlayer
                        ? styles.hasVotedStatus
                        : styles.notVotedStatus,
                    ]}
                  >
                    {hasVotedForThisPlayer ? "✓ Voted" : "⏳ Waiting"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <ScrollView
          style={styles.playersList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.instruction}>
            Vote for who you think is the imposter
          </Text>
          {otherPlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerButton,
                selectedPlayer === player.id && styles.selectedPlayer,
                hasVoted && styles.disabledButton,
              ]}
              onPress={() => handleVote(player.id)}
              disabled={hasVoted}
            >
              <View style={styles.playerVoteInfo}>
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
                      {player.avatar || player.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.playerName,
                    selectedPlayer === player.id && styles.selectedPlayerName,
                    hasVoted && styles.disabledPlayerName,
                  ]}
                >
                  {player.name}
                </Text>
              </View>
              {selectedPlayer === player.id && (
                <Text style={styles.votedText}>✓ VOTED</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hasVoted && (
          <View style={styles.votedContainer}>
            <Text style={styles.votedMessage}>
              Vote submitted! Waiting for players to vote...
            </Text>
          </View>
        )}
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
    paddingTop: 80,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginBottom: 20,
    textAlign: "center",
  },
  instruction: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  progressContainer: {
    backgroundColor: "#2a2a3e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  progressText: {
    fontSize: 16,
    color: "#4ecdc4",
    fontWeight: "bold",
    marginBottom: 5,
  },
  waitingText: {
    fontSize: 14,
    marginBottom: 12,
    color: "#aaa",
    textAlign: "center",
  },
  votingStatusContainer: {
    backgroundColor: "#2a2a3e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
  },
  playersStatusList: {
    width: "100%",
  },
  playerStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: "#1a1a2e",
  },
  playerStatusName: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  currentPlayerName: {
    color: "#4ecdc4",
    fontWeight: "bold",
  },
  voteStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  hasVotedStatus: {
    color: "#28a745",
  },
  notVotedStatus: {
    color: "#ffc107",
  },
  playersList: {
    width: "100%",
    maxHeight: 400,
    marginBottom: 20,
  },
  playerButton: {
    backgroundColor: "#2a2a3e",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#4a4a5e",
    alignItems: "center",
  },
  selectedPlayer: {
    backgroundColor: "#4ecdc4",
    borderColor: "#4ecdc4",
  },
  disabledButton: {
    opacity: 0.6,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  selectedPlayerName: {
    color: "#fff",
  },
  disabledPlayerName: {
    color: "#aaa",
  },
  votedText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 5,
    fontWeight: "bold",
  },
  votedContainer: {
    backgroundColor: "#4ecdc4",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  votedMessage: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  tip: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 20,
  },
  playerVoteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playerInitialCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4ecdc4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  playerInitial: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  playerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 10,
  },
  playerStatusInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  playerStatusInitialCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4ecdc4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  playerStatusInitial: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  playerStatusAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
});
