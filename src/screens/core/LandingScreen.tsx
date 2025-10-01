// PROFESSIONAL LANDING SCREEN - Entry point with strict navigation
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

export default function LandingScreen() {
  const navigation = useNavigation();

  const handleCreateGame = () => {
    navigation.navigate("CreateGame" as never);
  };

  const handleJoinGame = () => {
    navigation.navigate("JoinGame" as never);
  };

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pinky</Text>
          <Text style={styles.subtitle}>Game test</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={handleCreateGame}
          >
            <Text style={styles.buttonText}>Create Game</Text>
            <Text style={styles.buttonSubtext}>Start your own game room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.joinButton]}
            onPress={handleJoinGame}
          >
            <Text style={styles.buttonText}>Join Game</Text>
            <Text style={styles.buttonSubtext}>Enter a game code</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#ccc",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 60,
  },
  button: {
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#4CAF50",
  },
  joinButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  featuresContainer: {
    alignItems: "center",
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 8,
  },
});
