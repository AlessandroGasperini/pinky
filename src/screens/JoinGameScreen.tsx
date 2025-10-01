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
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";

export default function JoinGameScreen() {
  const navigation = useNavigation();
  const { joinGame } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
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
      const avatarToUse = customImageUri || "";
      await joinGame(code, name, avatarToUse);

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

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      // Show action sheet
      Alert.alert(
        "Select Avatar",
        "Choose how you'd like to select your avatar",
        [
          {
            text: "Camera Roll",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // Lower quality for smaller file size
                base64: true, // Enable base64 encoding
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                // Store as data URI for sharing across devices
                const dataUri = `data:${asset.type || "image/jpeg"};base64,${
                  asset.base64
                }`;
                setCustomImageUri(dataUri);
              }
            },
          },
          {
            text: "Take Photo",
            onPress: async () => {
              const cameraPermission =
                await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.granted === false) {
                Alert.alert(
                  "Permission Required",
                  "Permission to access camera is required!"
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3, // Lower quality for smaller file size
                base64: true, // Enable base64 encoding
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                // Store as data URI for sharing across devices
                const dataUri = `data:${asset.type || "image/jpeg"};base64,${
                  asset.base64
                }`;
                setCustomImageUri(dataUri);
              }
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const renderAvatarSelection = () => (
    <View style={styles.avatarContainer}>
      <Text style={styles.avatarTitle}>Choose Your Avatar (Optional)</Text>

      {/* Custom Image Option */}
      <TouchableOpacity
        style={[
          styles.customImageButton,
          customImageUri && styles.customImageButtonSelected,
        ]}
        onPress={pickImage}
      >
        {customImageUri ? (
          <Image source={{ uri: customImageUri }} style={styles.customImage} />
        ) : (
          <View style={styles.customImagePlaceholder}>
            <Text style={styles.customImageIcon}>📷</Text>
            <Text style={styles.customImageText}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.avatarSubtext}>
        {customImageUri
          ? "Tap to change photo"
          : "Tap to add a custom photo, or leave blank to use your initial"}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={["#1a1a2e", "#16213e", "#0f3460"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Join Game</Text>
          <Text style={styles.subtitle}>Enter a game code to join</Text>
        </View>

        {renderAvatarSelection()}

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
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    justifyContent: "center",
    flexGrow: 1,
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
  avatarContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  avatarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "center",
  },
  avatarSubtext: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  customImageButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2a2a3e",
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderWidth: 2,
    borderColor: "transparent",
    alignSelf: "center",
    marginBottom: 15,
  },
  customImageButtonSelected: {
    borderColor: "#4ecdc4",
    backgroundColor: "#3a3a4e",
  },
  customImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  customImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  customImageIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  customImageText: {
    fontSize: 10,
    color: "#ccc",
    fontWeight: "500",
  },
});
