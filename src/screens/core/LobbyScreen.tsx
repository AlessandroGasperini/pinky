// PROFESSIONAL LOBBY SCREEN - Bulletproof navigation with centralized manager
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../../contexts/GameContext";
import { navigationManager } from "../../services/navigationManager";

export default function LobbyScreen() {
  const navigation = useNavigation();
  const {
    state,
    startRound,
    refreshPlayers,
    refreshGameState,
    leaveGame,
    isHost,
    navigateToCorrectScreen,
    getPlayerScores,
  } = useGame();
  const [refreshing, setRefreshing] = useState(false);

  // BULLETPROOF NAVIGATION - Only navigate when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!state.currentGame || !state.currentPlayer) {
        console.log("🏠 [Lobby] No game or player, redirecting to landing");
        navigation.navigate("Landing" as never);
        return;
      }

      const currentState = state.currentGame.current_state;

      console.log("🏠 [Lobby] State check:", {
        currentState,
        isWaiting: currentState === "waiting",
      });

      // If we're in waiting state, stay in lobby - this is the correct screen
      if (currentState === "waiting") {
        console.log("🏠 [Lobby] Staying in lobby - correct state");
        return;
      }

      // For any other state, use centralized navigation
      console.log("🏠 [Lobby] State changed, navigating to correct screen");
      navigateToCorrectScreen(
        navigation,
        currentState,
        state.currentGame.category_chooser_id,
        state.currentPlayer.id,
        state.currentPlayer.is_host
      );
    }, [
      state.currentGame?.current_state,
      state.currentGame?.category_chooser_id,
      state.currentPlayer?.id,
    ])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshPlayers();
      // Also refresh scores
      const playerScores = await getPlayerScores();
      setScores(playerScores);
    } catch (error) {
      console.error("❌ [Lobby] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPlayers, getPlayerScores]);

  // No polling - rely on real-time updates only

  // Real-time game state monitoring for navigation - REMOVED DUPLICATE

  const handleStartRound = async () => {
    if (!isHost()) {
      Alert.alert("Error", "Only the host can start the game");
      return;
    }

    if (state.players.length < 2) {
      Alert.alert("Error", "Need at least 2 players to start");
      return;
    }

    try {
      console.log("🎮 [Lobby] Starting round...");
      await startRound();
    } catch (error) {
      console.error("❌ [Lobby] Start round error:", error);
      Alert.alert("Error", "Failed to start round. Please try again.");
    }
  };

  const handleLeaveGame = () => {
    Alert.alert("Leave Game", "Are you sure you want to leave this game?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await leaveGame();
            navigation.navigate("Landing" as never);
          } catch (error) {
            console.error("❌ [Lobby] Leave game error:", error);
          }
        },
      },
    ]);
  };

  // Get player scores from GameContext
  const [scores, setScores] = useState<{ [playerId: string]: number }>({});

  // Fetch scores when component mounts or players change
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const playerScores = await getPlayerScores();
        setScores(playerScores);
      } catch (error) {
        console.error("❌ [Lobby] Error fetching player scores:", error);
      }
    };

    if (state.players.length > 0) {
      fetchScores();
    }
  }, [state.players, state.currentGame?.id]);

  const getLeadingPlayerInfo = () => {
    if (state.players.length === 0) return null;

    const sortedPlayers = [...state.players].sort((a, b) => {
      const scoreA = scores[a.id] || 0;
      const scoreB = scores[b.id] || 0;
      return scoreB - scoreA;
    });

    const topScore = scores[sortedPlayers[0]?.id] || 0;
    const playersWithTopScore = sortedPlayers.filter(
      (player) => (scores[player.id] || 0) === topScore
    );

    if (playersWithTopScore.length === 1) {
      return "Will " + playersWithTopScore[0].name + " bring it home?";
    } else {
      return "nailbiting ending...";
    }
  };

  const renderPlayerList = () => {
    const sortedPlayers = [...state.players].sort((a, b) => {
      const scoreA = scores[a.id] || 0;
      const scoreB = scores[b.id] || 0;
      return scoreB - scoreA;
    });

    return sortedPlayers.map((player, index) => {
      const score = scores[player.id] || 0;
      const isCurrentPlayer = player.id === state.currentPlayer?.id;

      return (
        <View
          key={player.id}
          style={[
            styles.playerItem,
            isCurrentPlayer && styles.currentPlayerItem,
          ]}
        >
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
                    {player.avatar || player.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.playerNameContainer}>
                <Text style={styles.playerName}>
                  {player.name} {isCurrentPlayer && "(You)"}
                </Text>
                {player.is_host && (
                  <Text style={styles.hostBadge}>👑 Host</Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.playerScore}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
      );
    });
  };

  if (!state.currentGame || !state.currentPlayer) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active game</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Landing" as never)}
          >
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Game Lobby</Text>
          <Text style={styles.gameCode}>Code: {state.currentGame.code}</Text>
        </View>

        <View style={styles.gameInfo}>
          {/* <Text style={styles.infoText}>
            Players: {state.players.length}/{state.currentGame.max_players}
          </Text> */}
          <Text style={styles.infoText}>
            {state.currentGame.current_round + 1 ===
            state.currentGame.game_length - 1 ? (
              <Text style={styles.infoText}>
                Get ready for the final round! {getLeadingPlayerInfo()}
              </Text>
            ) : (
              <Text style={styles.infoText}>
                Get ready for round: {state.currentGame.current_round + 1} of{" "}
                {state.currentGame.game_length}
              </Text>
            )}
          </Text>
        </View>

        <View style={styles.playersSection}>
          <Text style={styles.sectionTitle}>Pole</Text>
          {state.players.length === 0 ? (
            <Text style={styles.emptyText}>No players yet</Text>
          ) : (
            renderPlayerList()
          )}
        </View>

        {state.connectionStatus === "disconnected" && (
          <View style={styles.connectionWarning}>
            <Text style={styles.warningText}>
              ⚠️ Connection lost. Attempting to reconnect...
            </Text>
          </View>
        )}

        {state.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isHost() && state.players.length >= 2 && (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartRound}
            disabled={state.loading}
          >
            <Text style={styles.buttonText}>
              {state.loading ? "Starting..." : "Start Round"}
            </Text>
          </TouchableOpacity>
        )}

        {isHost() && state.players.length < 2 && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>
              Waiting for players to join... ({state.players.length}/2)
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.leaveButton]}
          onPress={handleLeaveGame}
        >
          <Text style={styles.buttonText}>Leave Game</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 40,
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  gameCode: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  gameInfo: {
    backgroundColor: "pink",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: "black",
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: "center",
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  debugButton: {
    backgroundColor: "#FF9800",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    alignItems: "center",
  },
  debugButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  playersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  playerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  currentPlayerItem: {
    backgroundColor: "#4CAF50",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  hostBadge: {
    fontSize: 12,
    color: "#FFD700",
    marginTop: 2,
  },
  playerScore: {
    backgroundColor: "#555",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  emptyText: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    fontStyle: "italic",
  },
  connectionWarning: {
    backgroundColor: "#FF9800",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  warningText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  connectionSuccess: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  successText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  pollingText: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginTop: 5,
    opacity: 0.8,
  },
  errorBanner: {
    backgroundColor: "#F44336",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  leaveButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  waitingContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  waitingText: {
    fontSize: 16,
    color: "#ccc",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerInitialCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  playerNameContainer: {
    flex: 1,
  },
});
