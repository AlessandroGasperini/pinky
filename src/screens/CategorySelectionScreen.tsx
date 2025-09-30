// PROFESSIONAL CATEGORY SELECTION SCREEN - Bulletproof navigation
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../contexts/GameContext";
import { navigationManager } from "../services/navigationManager";

export default function CategorySelectionScreen() {
  const navigation = useNavigation();
  const { state, selectCategory, navigateToCorrectScreen } = useGame();
  const [isSelecting, setIsSelecting] = useState(false);

  // BULLETPROOF VALIDATION - Only stay if state is category_selection and user is chooser
  useEffect(() => {
    if (!state.currentGame || !state.currentPlayer) {
      console.log(
        "🎯 [CategorySelection] No game or player, redirecting to landing"
      );
      navigation.navigate("Landing" as never);
      return;
    }

    // If not in category_selection state, navigate to correct screen
    if (state.currentGame.current_state !== "category_selection") {
      console.log(
        "🎯 [CategorySelection] State changed, navigating to correct screen"
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

    // If user is not the category chooser, navigate to waiting screen
    if (state.currentGame.category_chooser_id !== state.currentPlayer.id) {
      console.log(
        "🎯 [CategorySelection] Not category chooser, navigating to waiting"
      );
      navigateToCorrectScreen(
        navigation,
        "category_selection",
        state.currentGame.category_chooser_id,
        state.currentPlayer.id,
        state.currentPlayer.is_host
      );
      return;
    }

    console.log(
      "🎯 [CategorySelection] Staying in CategorySelection - correct state and user"
    );
  }, [
    state.currentGame?.current_state,
    state.currentGame?.category_chooser_id,
    state.currentPlayer,
  ]);

  const handleCategorySelect = async (categoryId: string) => {
    if (isSelecting) return;

    try {
      setIsSelecting(true);
      console.log("🎯 [CategorySelection] Selecting category:", categoryId);
      await selectCategory(categoryId);
      console.log("✅ [CategorySelection] Category selected successfully");
    } catch (error) {
      console.error("❌ [CategorySelection] Category selection error:", error);
      Alert.alert("Error", "Failed to select category. Please try again.");
    } finally {
      setIsSelecting(false);
    }
  };

  const getCategoryDisplayName = (categoryName: string) => {
    switch (categoryName) {
      case "simple":
        return "Simple Questions";
      case "never_have_i_ever":
        return "Never Have I Ever";
      default:
        return categoryName;
    }
  };

  const getCategoryEmoji = (categoryName: string) => {
    switch (categoryName) {
      case "simple":
        return "🤔";
      case "never_have_i_ever":
        return "🙊";
      default:
        return "❓";
    }
  };

  const getCategoryDescription = (categoryName: string) => {
    switch (categoryName) {
      case "simple":
        return "Easy questions to get you thinking";
      case "never_have_i_ever":
        return "Confess your secrets or stay quiet";
      default:
        return "Choose this category";
    }
  };

  if (!state.currentGame || !state.currentPlayer) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active game</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Category</Text>
          <Text style={styles.subtitle}>
            You've been selected to choose the category for this round
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          {state.categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                isSelecting && styles.categoryButtonDisabled,
              ]}
              onPress={() => handleCategorySelect(category.id)}
              disabled={isSelecting}
            >
              <Text style={styles.categoryEmoji}>
                {getCategoryEmoji(category.name)}
              </Text>
              <Text style={styles.categoryName}>
                {getCategoryDisplayName(category.name)}
              </Text>
              <Text style={styles.categoryDescription}>
                {getCategoryDescription(category.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isSelecting && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Selecting category...</Text>
          </View>
        )}
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
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  categoriesContainer: {
    flex: 1,
    justifyContent: "center",
  },
  categoryButton: {
    backgroundColor: "#333",
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryButtonDisabled: {
    opacity: 0.6,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  categoryDescription: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#4CAF50",
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
