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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";
import { navigationManager } from "../services/navigationManager";

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
    } catch (error) {
      console.error("❌ [Lobby] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPlayers]);

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

  const getPlayerScores = (): { [playerId: string]: number } => {
    // This would be implemented with the getPlayerScores function
    // For now, return empty scores
    return {};
  };

  const scores = getPlayerScores();

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
            <Text style={styles.playerName}>
              {player.name} {isCurrentPlayer && "(You)"}
            </Text>
            {player.is_host && <Text style={styles.hostBadge}>👑 Host</Text>}
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
          <Text style={styles.infoText}>
            Players: {state.players.length}/{state.currentGame.max_players}
          </Text>
          <Text style={styles.infoText}>
            Round: {state.currentGame.current_round + 1} of{" "}
            {state.currentGame.game_length}
          </Text>
          {/* <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          ></TouchableOpacity> */}

          {/* <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              console.log("🔍 [Debug] Current state:", {
                current_state: state.currentGame?.current_state,
                category_chooser_id: state.currentGame?.category_chooser_id,
                current_player_id: state.currentPlayer?.id,
                is_category_chooser:
                  state.currentGame?.category_chooser_id ===
                  state.currentPlayer?.id,
              });
              await refreshGameState();
            }}
          >
            <Text style={styles.debugButtonText}>🔍 Debug State</Text>
          </TouchableOpacity> */}

          {/* <TouchableOpacity
            style={styles.debugButton}
            onPress={async () => {
              if (state.currentGame?.id) {
                console.log(
                  "🔄 [Lobby] Manually fetching questions for game:",
                  state.currentGame.id
                );
                try {
                  // Questions are already loaded in the game context
                  console.log("✅ [Lobby] Questions already available");
                  await refreshGameState();
                } catch (error) {
                  console.error(
                    "❌ [Lobby] Error refreshing game state:",
                    error
                  );
                }
              }
            }}
          >
            <Text style={styles.debugButtonText}>🔄 Fetch Questions</Text>
          </TouchableOpacity> */}
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
              Waiting for players... ({state.players.length}/2)
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
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 5,
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
});
