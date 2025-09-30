// CENTRALIZED NAVIGATION MANAGER - Bulletproof routing system
// This ensures only ONE screen can navigate at a time and follows strict order

import { NavigationProp } from "@react-navigation/native";

export type GameState =
  | "waiting"
  | "category_selection"
  | "question_intro"
  | "question"
  | "round_scoreboard";

export interface NavigationState {
  currentState: GameState;
  categoryChooserId?: string;
  currentPlayerId?: string;
  isHost: boolean;
  hasNavigated: boolean;
}

class NavigationManager {
  private static instance: NavigationManager;
  private navigationState: NavigationState = {
    currentState: "waiting",
    hasNavigated: false,
    isHost: false,
  };
  private navigationTimeout: NodeJS.Timeout | null = null;
  private isNavigating = false;

  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  // Update navigation state - only one source of truth
  updateState(newState: Partial<NavigationState>) {
    this.navigationState = { ...this.navigationState, ...newState };
    console.log("🧭 [NavigationManager] State updated:", this.navigationState);
  }

  // Get current navigation state
  getState(): NavigationState {
    return { ...this.navigationState };
  }

  // Clear navigation timeout
  clearTimeout() {
    if (this.navigationTimeout) {
      clearTimeout(this.navigationTimeout);
      this.navigationTimeout = null;
    }
  }

  // Reset navigation state
  reset() {
    this.clearTimeout();
    this.isNavigating = false;
    this.navigationState = {
      currentState: "waiting",
      hasNavigated: false,
      isHost: false,
    };
    console.log("🧭 [NavigationManager] Reset navigation state");
  }

  // Main navigation logic - STRICT ORDER ENFORCEMENT
  navigateToCorrectScreen(
    navigation: NavigationProp<any>,
    gameState: GameState,
    categoryChooserId?: string,
    currentPlayerId?: string,
    isHost: boolean = false
  ) {
    // Prevent multiple simultaneous navigations
    if (this.isNavigating) {
      console.log(
        "🧭 [NavigationManager] Navigation already in progress, skipping"
      );
      return;
    }

    // Clear any existing timeout
    this.clearTimeout();

    // Update internal state
    this.updateState({
      currentState: gameState,
      categoryChooserId,
      currentPlayerId,
      isHost,
      hasNavigated: false,
    });

    // Add delay to prevent race conditions
    this.navigationTimeout = setTimeout(() => {
      this.performNavigation(
        navigation,
        gameState,
        categoryChooserId,
        currentPlayerId,
        isHost
      );
    }, 300); // 300ms delay to ensure state is stable
  }

  private performNavigation(
    navigation: NavigationProp<any>,
    gameState: GameState,
    categoryChooserId?: string,
    currentPlayerId?: string,
    isHost: boolean = false
  ) {
    this.isNavigating = true;

    console.log("🧭 [NavigationManager] Performing navigation:", {
      gameState,
      categoryChooserId,
      currentPlayerId,
      isHost,
    });

    try {
      switch (gameState) {
        case "waiting":
          console.log("🧭 [NavigationManager] Navigating to Lobby");
          navigation.navigate("Lobby" as never);
          break;

        case "category_selection":
          if (categoryChooserId === currentPlayerId) {
            console.log(
              "🧭 [NavigationManager] Navigating to CategorySelection"
            );
            navigation.navigate("CategorySelection" as never);
          } else {
            console.log(
              "🧭 [NavigationManager] Navigating to WaitingForCategory"
            );
            navigation.navigate("WaitingForCategory" as never);
          }
          break;

        case "question_intro":
          console.log("🧭 [NavigationManager] Navigating to QuestionIntro");
          navigation.navigate("QuestionIntro" as never);
          break;

        case "question":
          console.log("🧭 [NavigationManager] Navigating to Question");
          navigation.navigate("Question" as never);
          break;

        case "round_scoreboard":
          console.log("🧭 [NavigationManager] Navigating to RoundScoreboard");
          navigation.navigate("RoundScoreboard" as never);
          break;

        default:
          console.warn("🧭 [NavigationManager] Unknown game state:", gameState);
          navigation.navigate("Lobby" as never);
      }

      // Mark as navigated
      this.updateState({ hasNavigated: true });
    } catch (error) {
      console.error("❌ [NavigationManager] Navigation error:", error);
    } finally {
      // Reset navigation flag after a short delay
      setTimeout(() => {
        this.isNavigating = false;
      }, 100);
    }
  }

  // Validate if current screen is correct for the state
  validateCurrentScreen(currentScreen: string, gameState: GameState): boolean {
    const expectedScreens = {
      waiting: ["Lobby"],
      category_selection: ["CategorySelection", "WaitingForCategory"],
      question_intro: ["QuestionIntro"],
      question: ["Question"],
      round_scoreboard: ["RoundScoreboard"],
    };

    const validScreens = expectedScreens[gameState] || ["Lobby"];
    const isValid = validScreens.includes(currentScreen);

    console.log("🧭 [NavigationManager] Screen validation:", {
      currentScreen,
      gameState,
      validScreens,
      isValid,
    });

    return isValid;
  }
}

export const navigationManager = NavigationManager.getInstance();
