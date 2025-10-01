// PROFESSIONAL TYPES - Built for scalability and type safety

export interface Category {
  id: string;
  name: string;
  description?: string;
  timeout_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  question_text: string;
  correct_answer?: string;
  type: "true_false" | "multiple_choice";
  points: number;
  difficulty: "easy" | "medium" | "hard";
  timeout_seconds: number;
  is_active: boolean;
  created_at: string;
}

export interface Word {
  id: string;
  word: string;
  category_id: string;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // Emoji or image URL
  is_host: boolean;
  game_id: string;
  is_active: boolean;
  last_seen: string;
  created_at: string;
}

export interface Game {
  id: string;
  code: string;
  status: "waiting" | "playing" | "finished";
  game_length: number;
  current_state:
    | "waiting"
    | "category_selection"
    | "game_intro"
    | "game_playing"
    | "game_voting"
    | "game_results"
    | "round_scoreboard";
  current_category_id?: string;
  current_question_id?: string;
  category_chooser_id?: string;
  question_number: number;
  current_round: number;
  round_questions?: Question[];
  max_players: number;
  // Game-specific data
  game_data?: {
    imposter_id?: string;
    words?: string[];
    votes?: Record<string, string>; // player_id -> voted_for_player_id
  };
  created_at: string;
  updated_at: string;
}

export interface PlayerAnswer {
  id: string;
  player_id: string;
  game_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
  created_at: string;
}

export interface GameState {
  currentGame: Game | null;
  currentPlayer: Player | null;
  players: Player[];
  categories: Category[];
  currentQuestion: Question | null;
  loading: boolean;
  error: string | null;
  connectionStatus: "connected" | "disconnected" | "connecting";
}

export type GameAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_GAME"; payload: Game }
  | { type: "SET_PLAYER"; payload: Player }
  | { type: "SET_PLAYERS"; payload: Player[] }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_CURRENT_QUESTION"; payload: Question | null }
  | { type: "UPDATE_GAME_STATE"; payload: Partial<Game> }
  | {
      type: "SET_CONNECTION_STATUS";
      payload: "connected" | "disconnected" | "connecting";
    }
  | { type: "RESET" };

export interface GameContextType {
  state: GameState;
  createGame: (
    gameLength: number,
    playerName: string,
    avatar?: string
  ) => Promise<string>;
  joinGame: (
    gameCode: string,
    playerName: string,
    avatar?: string
  ) => Promise<void>;
  leaveGame: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  startRound: () => Promise<void>;
  selectCategory: (categoryId: string) => Promise<void>;
  submitAnswer: (answer: string, isCorrect: boolean) => Promise<void>;
  moveToRoundScoreboard: () => Promise<void>;
  returnToLobby: () => Promise<void>;
  getPlayerScores: () => Promise<{ [playerId: string]: number }>;
  isHost: () => boolean;
  navigateToCorrectScreen: (
    navigation: any,
    gameState?: string,
    categoryChooserId?: string,
    currentPlayerId?: string,
    isHost?: boolean
  ) => void;
  // Imposter game functions
  startImposterGame: (categoryId: string) => Promise<void>;
  startQuestionGame: (categoryId: string) => Promise<void>;
}

// Navigation flow types for strict routing
export type NavigationFlow =
  | "landing"
  | "create_game"
  | "join_game"
  | "lobby"
  | "category_selection"
  | "waiting_for_category"
  | "question_intro"
  | "question"
  | "round_scoreboard";

export interface NavigationState {
  currentFlow: NavigationFlow;
  canNavigate: boolean;
  lastNavigation: number;
}
