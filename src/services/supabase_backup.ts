// PROFESSIONAL SUPABASE SERVICE - Built for 100K+ users
import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const SUPABASE_URL = "https://plkhagsxdwhczswrsqig.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsa2hhZ3N4ZHdoY3pzd3JzcWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTgzNTcsImV4cCI6MjA3Mzg5NDM1N30.jKzp-1_nNFR1_Wg7mb6AtRfdhT0yHfYSitfnV4fIloY";

// Create Supabase client with professional configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Professional error handling
export class SupabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = "SupabaseError";
  }
}

// Professional retry wrapper
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 [Supabase] ${operationName} - Attempt ${attempt}/${maxRetries}`
      );
      const result = await operation();
      console.log(`✅ [Supabase] ${operationName} - Success`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `❌ [Supabase] ${operationName} failed (attempt ${attempt}):`,
        error
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ [Supabase] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new SupabaseError(
    `${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`,
    "RETRY_EXHAUSTED",
    lastError
  );
};

// Professional database operations
export const db = {
  // Games
  async createGame(gameData: any) {
    return withRetry(async () => {
      try {
        // Try to use the new create_game_with_questions function
        const { data: gameId, error: gameError } = await supabase.rpc(
          "create_game_with_questions",
          {
            p_code: gameData.code,
            p_host_id: gameData.host_id,
            p_host_name: gameData.host_name,
            p_length: gameData.game_length,
          }
        );

        if (gameError) throw gameError;

        // Get the created game with questions
        const { data: game, error: fetchError } = await supabase
          .from("games")
          .select("*")
          .eq("id", gameId)
          .single();

        if (fetchError) throw fetchError;

        return game;
      } catch (error) {
        // Fallback to old method if function doesn't exist
        console.log(
          "⚠️ [Supabase] create_game_with_questions function not found, using fallback"
        );

        // Create a simple game object with only the required fields
        const simpleGameData = {
          code: gameData.code,
          game_length: gameData.game_length,
          status: gameData.status || "waiting",
          current_state: gameData.current_state || "waiting",
          max_players: gameData.max_players || 8,
        };

        console.log("🔄 [Supabase] Inserting game with data:", simpleGameData);

        const { data: game, error: gameError } = await supabase
          .from("games")
          .insert(simpleGameData)
          .select()
          .single();

        if (gameError) {
          console.error("❌ [Supabase] Game insert error:", gameError);
          throw gameError;
        }

        console.log(
          "✅ [Supabase] Game created successfully with fallback method"
        );
        return game;
      }
    }, "Create Game with Questions");
  },

  async getGameByCode(code: string) {
    return withRetry(
      () => supabase.from("games").select("*").eq("code", code).single(),
      "Get Game By Code"
    );
  },

  async updateGame(gameId: string, updates: any) {
    return withRetry(
      () => supabase.from("games").update(updates).eq("id", gameId).select(),
      "Update Game"
    );
  },

  // Players
  async createPlayer(playerData: any) {
    return withRetry(
      () => supabase.from("players").insert(playerData).select().single(),
      "Create Player"
    );
  },

  async getPlayersByGame(gameId: string) {
    return withRetry(
      () =>
        supabase
          .from("players")
          .select("*")
          .eq("game_id", gameId)
          .eq("is_active", true)
          .order("created_at"),
      "Get Players By Game"
    );
  },

  // Questions
  async getQuestionsByCategory(categoryId: string, limit: number) {
    return withRetry(
      () => supabase.from("questions").select("*").limit(limit),
      "Get Questions By Category"
    );
  },

  async getQuestionById(questionId: string) {
    return withRetry(
      () =>
        supabase.from("questions").select("*").eq("id", questionId).single(),
      "Get Question By ID"
    );
  },

  // Categories
  async getCategories() {
    return withRetry(
      () => supabase.from("categories").select("*").order("name"),
      "Get Categories"
    );
  },

  // Player Answers
  async submitAnswer(answerData: any) {
    return withRetry(
      () => supabase.from("player_answers").insert(answerData),
      "Submit Answer"
    );
  },

  async getPlayerAnswers(gameId: string, questionId: string) {
    return withRetry(
      () =>
        supabase
          .from("player_answers")
          .select(
            `
        *,
        players!inner(name)
      `
          )
          .eq("game_id", gameId)
          .eq("question_id", questionId)
          .order("created_at"),
      "Get Player Answers"
    );
  },

  async getPlayerScores(gameId: string) {
    return withRetry(
      () =>
        supabase
          .from("player_answers")
          .select("player_id, points_earned")
          .eq("game_id", gameId),
      "Get Player Scores"
    );
  },

  // Update game state
  updateGameState: async (gameId: string, newState: string) => {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from("games")
        .update({ current_state: newState })
        .eq("id", gameId)
        .select();

      if (error) throw error;
      return data;
    }, "Update Game State");
  },

  // Get current question from questions array
  getCurrentQuestion: async (gameId: string) => {
    return withRetry(async () => {
      const { data, error } = await supabase.rpc("get_current_question", {
        p_game_id: gameId,
      });

      if (error) throw error;
      return data;
    }, "Get Current Question");
  },

  // Move to next question
  moveToNextQuestion: async (gameId: string) => {
    return withRetry(async () => {
      const { data, error } = await supabase.rpc("move_to_next_question", {
        p_game_id: gameId,
      });

      if (error) throw error;
      return data;
    }, "Move to Next Question");
  },

  // Fetch questions for a game
  fetchGameQuestions: async (gameId: string, gameLength: number) => {
    return withRetry(async () => {
      const { data, error } = await supabase.rpc("fetch_game_questions", {
        p_game_id: gameId,
        p_game_length: gameLength,
      });

      if (error) throw error;
      return data;
    }, "Fetch Game Questions");
  },

  // Manually fetch questions for existing game (for testing)
  fetchQuestionsForGame: async (gameId: string) => {
    return withRetry(async () => {
      // Get game length first
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("game_length")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;

      // Fetch questions
      const { data, error } = await supabase.rpc("fetch_game_questions", {
        p_game_id: gameId,
        p_game_length: game.game_length,
      });

      if (error) throw error;
      return data;
    }, "Fetch Questions for Game");
  },
};
