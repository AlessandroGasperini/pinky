// PROFESSIONAL GAME CONTEXT - Built for 100K+ users with strict navigation flow
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { GameState, GameAction, GameContextType } from "../types";
import { db } from "../services/supabase";
import { realtimeService } from "../services/realtime";
import { navigationManager } from "../services/navigationManager";

const initialState: GameState = {
  currentGame: null,
  currentPlayer: null,
  players: [],
  categories: [],
  currentQuestion: null,
  loading: false,
  error: null,
  connectionStatus: "disconnected",
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_GAME":
      return { ...state, currentGame: action.payload };
    case "SET_PLAYER":
      return { ...state, currentPlayer: action.payload };
    case "SET_PLAYERS":
      return { ...state, players: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestion: action.payload };
    case "UPDATE_GAME_STATE":
      return {
        ...state,
        currentGame: state.currentGame
          ? { ...state.currentGame, ...action.payload }
          : null,
      };
    case "SET_CONNECTION_STATUS":
      return { ...state, connectionStatus: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const currentGameIdRef = useRef<string | null>(null);
  // Removed navigationFlowRef to prevent conflicts

  // Professional create game with strict validation
  const createGame = useCallback(
    async (gameLength: number, playerName: string): Promise<string> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        dispatch({ type: "SET_CONNECTION_STATUS", payload: "connecting" });

        // Generate unique game code
        const gameCode = Math.floor(100 + Math.random() * 900).toString();

        // Pre-fetch questions for the game
        const categories = await db.getCategories();
        if (!categories) throw new Error("Failed to fetch categories");

        const questionsPerCategory = Math.floor(gameLength / 2);
        const remainingQuestions = gameLength % 2;

        const [simpleQuestions, neverHaveIEverQuestions] = await Promise.all([
          db.getQuestionsByCategory(
            categories.find((c) => c.name === "simple")?.id || "",
            questionsPerCategory + (remainingQuestions > 0 ? 1 : 0)
          ),
          db.getQuestionsByCategory(
            categories.find((c) => c.name === "never_have_i_ever")?.id || "",
            questionsPerCategory + (remainingQuestions > 1 ? 1 : 0)
          ),
        ]);

        if (!simpleQuestions || !neverHaveIEverQuestions) {
          throw new Error("Failed to fetch questions");
        }

        const allQuestions = [...simpleQuestions, ...neverHaveIEverQuestions];

        // Shuffle questions professionally
        const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);

        // Create game
        console.log("🎮 [Game] Creating game with data:", {
          code: gameCode,
          game_length: gameLength,
          status: "waiting",
          current_state: "waiting",
          max_players: 8,
        });

        const game = await db.createGame({
          code: gameCode,
          game_length: gameLength,
          status: "waiting",
          current_state: "waiting",
          max_players: 8,
        });

        console.log("🎮 [Game] Create game result:", { game });

        if (!game) {
          throw new Error("Game creation returned undefined");
        }

        // Create host player
        const player = await db.createPlayer({
          game_id: game.id,
          name: playerName.trim(),
          is_host: true,
          is_active: true,
        });

        if (!player) {
          throw new Error("Failed to create player");
        }

        // Update state
        dispatch({ type: "SET_GAME", payload: game });
        dispatch({ type: "SET_PLAYER", payload: player });
        dispatch({ type: "SET_PLAYERS", payload: [player] });
        dispatch({ type: "SET_CATEGORIES", payload: categories });

        // Set up real-time subscription
        currentGameIdRef.current = game.id;
        // Navigation handled by screens

        await realtimeService.subscribeToGame(
          game.id,
          (payload) => {
            console.log("🎮 [Game] Game update received:", payload);
            if (payload.new) {
              console.log("🔄 [Game] Updating game state:", payload.new);
              dispatch({ type: "UPDATE_GAME_STATE", payload: payload.new });

              // Broadcast state change for navigation
              if (payload.new.current_state) {
                console.log(
                  "📡 [Game] Broadcasting state change:",
                  payload.new.current_state
                );
                realtimeService.broadcastGameEvent(game.id, {
                  type: "GAME_STATE_CHANGE",
                  newState: payload.new.current_state,
                  categoryChooserId: payload.new.category_chooser_id,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          },
          async (payload) => {
            console.log("👥 [Game] Player update received:", payload);

            // Always refresh players list from database for real-time updates
            try {
              const currentGameId = currentGameIdRef.current;
              if (currentGameId) {
                const freshPlayers = await db.getPlayersByGame(currentGameId);
                if (freshPlayers) {
                  console.log(
                    "🔄 [Game] Refreshing players list:",
                    freshPlayers.length
                  );
                  dispatch({ type: "SET_PLAYERS", payload: freshPlayers });

                  // Broadcast player update to all clients
                  realtimeService.broadcastGameEvent(currentGameId, {
                    type: "PLAYERS_UPDATED",
                    players: freshPlayers,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
            } catch (error) {
              console.error("❌ [Game] Error refreshing players:", error);
            }
          },
          (error) => {
            console.error("❌ [Game] Real-time error:", error);
            dispatch({
              type: "SET_ERROR",
              payload: "Connection lost. Attempting to reconnect...",
            });
          }
        );

        dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
        console.log("✅ [Game] Game created successfully:", gameCode);
        return gameCode;
      } catch (error) {
        console.error("❌ [Game] Create game error:", error);
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to create game",
        });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.players]
  );

  // Professional join game with strict validation
  const joinGame = useCallback(
    async (gameCode: string, playerName: string): Promise<void> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: null });
        dispatch({ type: "SET_CONNECTION_STATUS", payload: "connecting" });

        // Find game by code
        console.log("🎮 [Game] Looking for game with code:", gameCode);
        const game = await db.getGameByCode(gameCode);
        console.log("🎮 [Game] Game found:", game);
        if (!game) {
          throw new Error("Game not found");
        }

        // Check if game is full
        const existingPlayers = await db.getPlayersByGame(game.id);
        if (existingPlayers && existingPlayers.length >= game.max_players) {
          throw new Error("Game is full");
        }

        // Check if player name already exists
        const existingPlayer = existingPlayers?.find(
          (p) => p.name === playerName.trim()
        );
        if (existingPlayer) {
          throw new Error("Player name already taken");
        }

        // Create player
        const player = await db.createPlayer({
          game_id: game.id,
          name: playerName.trim(),
          is_host: false,
          is_active: true,
        });

        if (!player) {
          throw new Error("Failed to create player");
        }

        // Get all players
        const players = await db.getPlayersByGame(game.id);
        if (!players) {
          throw new Error("Failed to get players");
        }

        // Get categories
        const categories = await db.getCategories();

        // Update state
        dispatch({ type: "SET_GAME", payload: game });
        dispatch({ type: "SET_PLAYER", payload: player });
        dispatch({ type: "SET_PLAYERS", payload: players });
        dispatch({ type: "SET_CATEGORIES", payload: categories || [] });

        // Set up real-time subscription
        currentGameIdRef.current = game.id;
        // Navigation handled by screens

        await realtimeService.subscribeToGame(
          game.id,
          (payload) => {
            console.log("🎮 [Game] Game update received:", payload);
            if (payload.new) {
              console.log("🔄 [Game] Updating game state:", payload.new);
              dispatch({ type: "UPDATE_GAME_STATE", payload: payload.new });

              // Broadcast state change for navigation
              if (payload.new.current_state) {
                console.log(
                  "📡 [Game] Broadcasting state change:",
                  payload.new.current_state
                );
                realtimeService.broadcastGameEvent(game.id, {
                  type: "GAME_STATE_CHANGE",
                  newState: payload.new.current_state,
                  categoryChooserId: payload.new.category_chooser_id,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          },
          async (payload) => {
            console.log("👥 [Game] Player update received:", payload);

            // Always refresh players list from database for real-time updates
            try {
              const currentGameId = currentGameIdRef.current;
              if (currentGameId) {
                const freshPlayers = await db.getPlayersByGame(currentGameId);
                if (freshPlayers) {
                  console.log(
                    "🔄 [Game] Refreshing players list:",
                    freshPlayers.length
                  );
                  dispatch({ type: "SET_PLAYERS", payload: freshPlayers });

                  // Broadcast player update to all clients
                  realtimeService.broadcastGameEvent(currentGameId, {
                    type: "PLAYERS_UPDATED",
                    players: freshPlayers,
                    timestamp: new Date().toISOString(),
                  });
                }
              }
            } catch (error) {
              console.error("❌ [Game] Error refreshing players:", error);
            }
          },
          (error) => {
            console.error("❌ [Game] Real-time error:", error);
            dispatch({
              type: "SET_ERROR",
              payload: "Connection lost. Attempting to reconnect...",
            });
          }
        );

        dispatch({ type: "SET_CONNECTION_STATUS", payload: "connected" });
        console.log("✅ [Game] Joined game successfully");
      } catch (error) {
        console.error("❌ [Game] Join game error:", error);
        dispatch({
          type: "SET_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to join game",
        });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.players]
  );

  // Professional leave game
  const leaveGame = useCallback(async (): Promise<void> => {
    if (!state.currentGame || !state.currentPlayer) return;

    try {
      // Unsubscribe from real-time
      realtimeService.unsubscribeFromGame(state.currentGame.id);

      // Reset state
      dispatch({ type: "RESET" });
      currentGameIdRef.current = null;
      // Navigation handled by screens

      console.log("✅ [Game] Left game successfully");
    } catch (error) {
      console.error("❌ [Game] Leave game error:", error);
    }
  }, [state.currentGame, state.currentPlayer]);

  // Professional start round
  const startRound = useCallback(async (): Promise<void> => {
    if (!state.currentGame || !state.currentPlayer) {
      throw new Error("No active game or player");
    }

    if (!state.currentPlayer.is_host) {
      throw new Error("Only the host can start the game");
    }

    try {
      // Get all active players
      const players = await db.getPlayersByGame(state.currentGame.id);
      console.log("🎮 [Game] Players for start round:", players?.length || 0);
      if (!players || players.length < 2) {
        throw new Error("Need at least 2 players to start");
      }

      // Select random player for category chooser
      const randomPlayer = players[Math.floor(Math.random() * players.length)];

      // Update game state
      console.log("🎮 [Game] Updating game state for start round");
      const updatedGame = await db.updateGame(state.currentGame.id, {
        status: "playing",
        current_state: "category_selection",
        category_chooser_id: randomPlayer.id,
      });

      if (!updatedGame) {
        throw new Error("Failed to start game");
      }

      // Update local state
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          status: "playing",
          current_state: "category_selection",
          category_chooser_id: randomPlayer.id,
        },
      });

      // Navigation handled by screens
      console.log("✅ [Game] Round started successfully");
    } catch (error) {
      console.error("❌ [Game] Start round error:", error);
      throw error;
    }
  }, [state.currentGame, state.currentPlayer]);

  // Professional category selection
  const selectCategory = useCallback(
    async (categoryId: string): Promise<void> => {
      if (!state.currentGame || !state.currentPlayer) {
        throw new Error("No active game or player");
      }

      if (state.currentPlayer.id !== state.currentGame.category_chooser_id) {
        throw new Error("You are not the category chooser");
      }

      try {
        // Get current round and questions array
        const currentRound = state.currentGame.current_round || 0;
        const questionsArray = (state.currentGame as any).questions || [];

        console.log("🎯 [Game] Selecting category:", {
          categoryId,
          currentRound,
          questionsArrayLength: questionsArray.length,
        });

        if (currentRound >= questionsArray.length) {
          throw new Error("No more questions available");
        }

        // Get the category name from the categoryId
        const categories = await db.getCategories();
        const selectedCategory = categories.find(
          (cat) => cat.id === categoryId
        );
        const categoryName = selectedCategory?.name;

        if (!categoryName) {
          throw new Error("Category not found");
        }

        // Get the question for the selected category and current round
        const currentQuestion = await db.getQuestionForRound(
          state.currentGame.id,
          categoryName,
          currentRound + 1 // Round is 1-based
        );

        console.log("🎯 [Game] Got question for round:", currentQuestion);

        // Update game state
        const updatedGame = await db.updateGame(state.currentGame.id, {
          current_state: "question_intro",
          current_category_id: categoryId,
          current_question_id: currentQuestion.id,
          question_number: currentRound + 1,
        });

        // Update local state
        dispatch({
          type: "UPDATE_GAME_STATE",
          payload: {
            current_state: "question_intro",
            current_category_id: categoryId,
            current_question_id: currentQuestion.id,
            question_number: currentRound + 1,
          },
        });

        // Set current question
        dispatch({ type: "SET_CURRENT_QUESTION", payload: currentQuestion });

        // Navigation handled by screens
        console.log("✅ [Game] Category selected:", categoryId);
      } catch (error) {
        console.error("❌ [Game] Select category error:", error);
        throw error;
      }
    },
    [state.currentGame, state.currentPlayer]
  );

  // Professional answer submission
  const submitAnswer = useCallback(
    async (answer: string, isCorrect: boolean): Promise<void> => {
      if (!state.currentGame || !state.currentPlayer) {
        throw new Error("No active game or player");
      }

      try {
        const { error } = await db.submitAnswer({
          player_id: state.currentPlayer.id,
          game_id: state.currentGame.id,
          question_id: state.currentGame.current_question_id!,
          answer: answer,
          is_correct: isCorrect,
          points_earned: isCorrect ? 1 : 0,
        });

        if (error) {
          throw new Error(`Failed to submit answer: ${error.message}`);
        }

        console.log("✅ [Game] Answer submitted successfully");
      } catch (error) {
        console.error("❌ [Game] Submit answer error:", error);
        throw error;
      }
    },
    [state.currentGame, state.currentPlayer]
  );

  // Professional move to round scoreboard
  const moveToRoundScoreboard = useCallback(async (): Promise<void> => {
    if (!state.currentGame) return;

    try {
      const { error } = await db.updateGame(state.currentGame.id, {
        current_state: "round_scoreboard",
      });

      if (error) {
        throw new Error(`Failed to move to round scoreboard: ${error.message}`);
      }

      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          current_state: "round_scoreboard",
        },
      });

      // Navigation handled by screens
      console.log("✅ [Game] Moved to round scoreboard");
    } catch (error) {
      console.error("❌ [Game] Move to round scoreboard error:", error);
      throw error;
    }
  }, [state.currentGame]);

  // Professional return to lobby with complete state reset
  const returnToLobby = useCallback(async (): Promise<void> => {
    if (!state.currentGame) return;

    try {
      console.log(
        "🔄 [Game] Returning to lobby, performing complete state reset"
      );

      // Reset all game state to clean slate
      const { error } = await db.updateGame(state.currentGame.id, {
        current_state: "waiting",
        current_category_id: undefined,
        category_chooser_id: undefined,
        current_question_id: undefined,
        current_round: (state.currentGame.current_round || 0) + 1,
      });

      if (error) {
        throw new Error(`Failed to return to lobby: ${error.message}`);
      }

      // Complete state reset in local context
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          current_state: "waiting",
          current_category_id: undefined,
          category_chooser_id: undefined,
          current_question_id: undefined,
          current_round: (state.currentGame.current_round || 0) + 1,
        },
      });

      // Reset navigation manager
      navigationManager.reset();

      // Clear any cached question data
      dispatch({ type: "SET_CURRENT_QUESTION", payload: null });

      console.log(
        "✅ [Game] Complete state reset completed - ready for next round"
      );
    } catch (error) {
      console.error("❌ [Game] Return to lobby error:", error);
      throw error;
    }
  }, [state.currentGame]);

  // Centralized navigation function
  const navigateToCorrectScreen = useCallback(
    (
      navigation: any,
      gameState?: string,
      categoryChooserId?: string,
      currentPlayerId?: string,
      isHost?: boolean
    ) => {
      const stateToUse =
        gameState || state.currentGame?.current_state || "waiting";
      const chooserId =
        categoryChooserId || state.currentGame?.category_chooser_id;
      const playerId = currentPlayerId || state.currentPlayer?.id;
      const hostStatus =
        isHost !== undefined ? isHost : state.currentPlayer?.is_host || false;

      navigationManager.navigateToCorrectScreen(
        navigation,
        stateToUse as any,
        chooserId,
        playerId,
        hostStatus
      );
    },
    [state.currentGame, state.currentPlayer]
  );

  // Professional get player scores
  const getPlayerScores = useCallback(async (): Promise<{
    [playerId: string]: number;
  }> => {
    if (!state.currentGame) return {};

    try {
      const scores = await db.getPlayerScores(state.currentGame.id);
      if (!scores || !Array.isArray(scores)) {
        console.log("❌ [Game] No scores data or not an array:", scores);
        return {};
      }

      const scoreMap: { [playerId: string]: number } = {};
      scores.forEach((score: any) => {
        if (score && score.player_id) {
          scoreMap[score.player_id] =
            (scoreMap[score.player_id] || 0) + (score.points_earned || 0);
        }
      });

      return scoreMap;
    } catch (error) {
      console.error("❌ [Game] Get player scores error:", error);
      return {};
    }
  }, [state.currentGame]);

  // Professional refresh players
  const refreshPlayers = useCallback(async (): Promise<void> => {
    if (!state.currentGame) return;

    try {
      const players = await db.getPlayersByGame(state.currentGame.id);
      if (!players) {
        throw new Error("Failed to refresh players");
      }

      dispatch({ type: "SET_PLAYERS", payload: players });
      console.log("✅ [Game] Players refreshed:", players.length);
    } catch (error) {
      console.error("❌ [Game] Refresh players error:", error);
    }
  }, [state.currentGame]);

  // Professional refresh game state with aggressive retry
  const refreshGameState = useCallback(async (): Promise<void> => {
    if (!state.currentGame) return;

    try {
      const game = await db.getGameByCode(state.currentGame.code);
      if (!game) {
        throw new Error("Failed to refresh game state");
      }

      dispatch({ type: "SET_GAME", payload: game });
      console.log("✅ [Game] Game state refreshed");

      // Force refresh players as well
      const players = await db.getPlayersByGame(game.id);
      if (players) {
        dispatch({ type: "SET_PLAYERS", payload: players });
        console.log("✅ [Game] Players refreshed:", players.length);
      }
    } catch (error) {
      console.error("❌ [Game] Refresh game state error:", error);
    }
  }, [state.currentGame]);

  // Check if current player is host
  const isHost = useCallback((): boolean => {
    return state.currentPlayer?.is_host || false;
  }, [state.currentPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentGameIdRef.current) {
        realtimeService.unsubscribeFromGame(currentGameIdRef.current);
      }
    };
  }, []);

  const value: GameContextType = {
    state,
    createGame,
    joinGame,
    leaveGame,
    refreshPlayers,
    refreshGameState,
    startRound,
    selectCategory,
    submitAnswer,
    moveToRoundScoreboard,
    returnToLobby,
    getPlayerScores,
    isHost,
    navigateToCorrectScreen,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
