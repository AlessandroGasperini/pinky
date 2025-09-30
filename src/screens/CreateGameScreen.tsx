// PROFESSIONAL CREATE GAME SCREEN - Strict navigation flow
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

type GameLength = 6 | 12 | 20;

const GAME_LENGTHS = [
  { length: 6, label: "Short Game", emoji: "⚡", subtext: "Quick & fun" },
  { length: 12, label: "Medium Game", emoji: "🎯", subtext: "Perfect balance" },
  {
    length: 20,
    label: "Long Game",
    emoji: "🏆",
    subtext: "Ultimate challenge",
  },
];

export default function CreateGameScreen() {
  const navigation = useNavigation();
  const { createGame } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [selectedLength, setSelectedLength] = useState<GameLength>(12);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    const name = playerName.trim();
    if (name.length < 2) {
      Alert.alert("Error", "Name must be at least 2 characters");
      return;
    }

    try {
      setIsCreating(true);
      console.log("🎮 [CreateGame] Creating game...");
      const code = await createGame(selectedLength, name);

      Alert.alert(
        "Game Created! 🎮",
        `Your game code is: ${code}\n\nGame Length: ${selectedLength} questions\n\nShare this code with other players to join!`,
        [{ text: "OK", onPress: () => navigation.navigate("Lobby" as never) }]
      );
    } catch (error) {
      console.error("❌ [CreateGame] Create game error:", error);
      Alert.alert("Error", "Failed to create game. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderGameLengthSelection = () => (
    <View style={styles.lengthContainer}>
      <Text style={styles.lengthTitle}>Choose Game Length</Text>
      <View style={styles.lengthButtons}>
        {GAME_LENGTHS.map(({ length, label, emoji, subtext }) => (
          <TouchableOpacity
            key={length}
            style={[
              styles.lengthButton,
              selectedLength === length && styles.lengthButtonSelected,
            ]}
            onPress={() => setSelectedLength(length)}
          >
            <Text style={styles.lengthEmoji}>{emoji}</Text>
            <Text
              style={[
                styles.lengthText,
                selectedLength === length && styles.lengthTextSelected,
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.lengthSubtext,
                selectedLength === length && styles.lengthSubtextSelected,
              ]}
            >
              {subtext}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Game</Text>
          <Text style={styles.subtitle}>Set up your own game room</Text>
        </View>

        {renderGameLengthSelection()}

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#666"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />

        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={handleCreateGame}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Game</Text>
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
    marginBottom: 30,
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
  lengthContainer: {
    marginBottom: 30,
  },
  lengthTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  lengthButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lengthButton: {
    flex: 1,
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "#333",
    alignItems: "center",
  },
  lengthButtonSelected: {
    backgroundColor: "#4CAF50",
  },
  lengthEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  lengthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  lengthTextSelected: {
    color: "#fff",
  },
  lengthSubtext: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
  },
  lengthSubtextSelected: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 20,
    fontSize: 18,
    color: "#fff",
    marginBottom: 30,
  },
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#4CAF50",
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

