// PROFESSIONAL JOIN GAME SCREEN - Strict navigation flow
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";

export default function JoinGameScreen() {
  const navigation = useNavigation();
  const { joinGame } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async () => {
    const name = playerName.trim();
    const code = gameCode.trim();

    if (name.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return;
    }

    if (code.length !== 3) {
      Alert.alert("Error", "Game code must be 3 digits");
      return;
    }

    try {
      setIsJoining(true);
      console.log("🎮 [JoinGame] Joining game...");
      await joinGame(code, name);

      console.log(
        "✅ [JoinGame] Successfully joined game, navigating to lobby"
      );
      navigation.navigate("Lobby" as never);
    } catch (error) {
      console.error("❌ [JoinGame] Join game error:", error);
      Alert.alert(
        "Error",
        "Failed to join game. Please check the code and try again."
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Game</Text>
          <Text style={styles.subtitle}>Enter a game code to join</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter game code (3 digits)"
          placeholderTextColor="#666"
          value={gameCode}
          onChangeText={setGameCode}
          keyboardType="numeric"
          maxLength={3}
        />

        <TouchableOpacity
          style={[styles.button, styles.joinButton]}
          onPress={handleJoinGame}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Game</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
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
  input: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    fontSize: 18,
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    alignItems: "center",
    padding: 15,
  },
  backButtonText: {
    fontSize: 18,
    color: "#ccc",
  },
});
