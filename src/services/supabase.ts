// SIMPLE SUPABASE SERVICE - Guaranteed to work
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://plkhagsxdwhczswrsqig.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2hhZ3N4ZHdoY3pzd3JzcWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTgzNTcsImV4cCI6MjA3Mzg5NDM1N30.jKzp-1_nNFR1_Wg7mb6AtRfdhT0yHfYSitfnV4fIloY";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple database operations - no retry, no complex error handling
export const db = {
  // Games
  async createGame(gameData: any) {
    console.log("🎮 [DB] Creating game with data:", gameData);

    try {
      // Try to use the questions array function first
      const { data: gameId, error: gameError } = await supabase.rpc(
        "create_game_with_questions_array",
        {
          p_code: gameData.code,
          p_game_length: gameData.game_length,
        }
      );

      if (gameError) throw gameError;

      // Get the created game with questions array
      const { data: game, error: fetchError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (fetchError) throw fetchError;

      console.log("✅ [DB] Game created with questions array:", game);
      return game;
    } catch (error) {
      console.log("🔄 [DB] RPC failed, using fallback method");

      // Fallback: create game without questions array initially
      const { data: game, error: insertError } = await supabase
        .from("games")
        .insert(gameData)
        .select()
        .single();

      if (insertError) {
        console.error("❌ [DB] Game creation error:", insertError);
        throw new Error(`Failed to create game: ${insertError.message}`);
      }

      console.log("✅ [DB] Game created successfully:", game);
      return game;
    }
  },

  async getGameByCode(code: string) {
    console.log("🎮 [DB] Getting game by code:", code);

    const { data: game, error } = await supabase
      .from("games")
      .select("*")
      .eq("code", code)
      .single();

    if (error) {
      console.error("❌ [DB] Get game error:", error);
      throw new Error(`Failed to get game: ${error.message}`);
    }

    console.log("✅ [DB] Game found:", game);
    return game;
  },

  // Players
  async createPlayer(playerData: any) {
    console.log("👤 [DB] Creating player with data:", playerData);

    const { data: player, error } = await supabase
      .from("players")
      .insert(playerData)
      .select()
      .single();

    if (error) {
      console.error("❌ [DB] Player creation error:", error);
      throw new Error(`Failed to create player: ${error.message}`);
    }

    console.log("✅ [DB] Player created successfully:", player);
    return player;
  },

  async getPlayersByGame(gameId: string) {
    console.log("👥 [DB] Getting players for game:", gameId);

    const { data: players, error } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at");

    if (error) {
      console.error("❌ [DB] Get players error:", error);
      throw new Error(`Failed to get players: ${error.message}`);
    }

    console.log("✅ [DB] Players found:", players?.length || 0);
    return players;
  },

  // Categories
  async getCategories() {
    console.log("📂 [DB] Getting categories");

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("❌ [DB] Get categories error:", error);
      throw new Error(`Failed to get categories: ${error.message}`);
    }

    console.log("✅ [DB] Categories found:", categories?.length || 0);
    return categories;
  },

  // Questions
  async getQuestionsByCategory(categoryId: string, limit: number) {
    console.log(
      "❓ [DB] Getting questions for category:",
      categoryId,
      "limit:",
      limit
    );

    const { data: questions, error } = await supabase
      .from("questions")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .limit(limit);

    if (error) {
      console.error("❌ [DB] Get questions error:", error);
      throw new Error(`Failed to get questions: ${error.message}`);
    }

    console.log(
      "✅ [DB] Questions found for category:",
      questions?.length || 0
    );
    return questions;
  },

  async getQuestionById(questionId: string) {
    console.log("❓ [DB] Getting question by ID:", questionId);

    const { data: question, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (error) {
      console.error("❌ [DB] Get question error:", error);
      throw new Error(`Failed to get question: ${error.message}`);
    }

    console.log("✅ [DB] Question found:", question);
    return question;
  },

  async getQuestionForRound(
    gameId: string,
    selectedCategory: string,
    round: number
  ) {
    console.log("❓ [DB] Getting question for round:", {
      gameId,
      selectedCategory,
      round,
    });

    const { data: question, error } = await supabase.rpc(
      "get_question_for_round",
      {
        p_game_id: gameId,
        p_selected_category: selectedCategory,
        p_round: round,
      }
    );

    if (error) {
      console.error("❌ [DB] Get question for round error:", error);
      throw new Error(`Failed to get question for round: ${error.message}`);
    }

    console.log("✅ [DB] Question for round found:", question);
    return question;
  },

  // Player Answers
  async submitAnswer(answerData: any) {
    console.log("💾 [DB] Submitting answer:", answerData);

    const { data: answer, error } = await supabase
      .from("player_answers")
      .insert(answerData)
      .select()
      .single();

    if (error) {
      console.error("❌ [DB] Submit answer error:", error);
      throw new Error(`Failed to submit answer: ${error.message}`);
    }

    console.log("✅ [DB] Answer submitted successfully:", answer);
    return answer;
  },

  async getAnswersByGame(gameId: string) {
    console.log("💾 [DB] Getting answers for game:", gameId);

    const { data: answers, error } = await supabase
      .from("player_answers")
      .select(
        `
        *,
        players!inner(name)
      `
      )
      .eq("game_id", gameId);

    if (error) {
      console.error("❌ [DB] Get answers error:", error);
      throw new Error(`Failed to get answers: ${error.message}`);
    }

    console.log("✅ [DB] Answers found:", answers?.length || 0);
    return answers;
  },

  async getPlayerScores(gameId: string) {
    console.log("💾 [DB] Getting player scores for game:", gameId);

    const { data: scores, error } = await supabase
      .from("player_answers")
      .select("player_id, points_earned")
      .eq("game_id", gameId);

    if (error) {
      console.error("❌ [DB] Get player scores error:", error);
      throw new Error(`Failed to get player scores: ${error.message}`);
    }

    console.log("✅ [DB] Player scores found:", scores?.length || 0);
    return scores;
  },

  // Game State Updates
  async updateGameState(gameId: string, newState: string) {
    console.log("🔄 [DB] Updating game state:", gameId, "to:", newState);

    const { data: game, error } = await supabase
      .from("games")
      .update({ current_state: newState })
      .eq("id", gameId)
      .select()
      .single();

    if (error) {
      console.error("❌ [DB] Update game state error:", error);
      throw new Error(`Failed to update game state: ${error.message}`);
    }

    console.log("✅ [DB] Game state updated successfully:", game);
    return game;
  },

  async updateGame(gameId: string, updates: any) {
    console.log("🔄 [DB] Updating game:", gameId, "with:", updates);

    const { data: game, error } = await supabase
      .from("games")
      .update(updates)
      .eq("id", gameId)
      .select()
      .single();

    if (error) {
      console.error("❌ [DB] Update game error:", error);
      throw new Error(`Failed to update game: ${error.message}`);
    }

    console.log("✅ [DB] Game updated successfully:", game);
    return game;
  },
};
