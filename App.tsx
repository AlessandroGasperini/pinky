// PROFESSIONAL APP.TSX - Built for 100K+ users with strict navigation
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GameProvider } from "./src/contexts/GameContext";

// Import Core screens
import LandingScreen from "./src/screens/core/LandingScreen";
import CreateGameScreen from "./src/screens/core/CreateGameScreen";
import JoinGameScreen from "./src/screens/core/JoinGameScreen";
import LobbyScreen from "./src/screens/core/LobbyScreen";

// Import Gameplay screens
import CategorySelectionScreen from "./src/screens/gameplay/CategorySelectionScreen";
import WaitingForCategoryScreen from "./src/screens/gameplay/WaitingForCategoryScreen";
import QuestionIntroScreen from "./src/screens/gameplay/QuestionIntroScreen";
import QuestionScreen from "./src/screens/gameplay/QuestionScreen";

// Import Results screens
import RoundScoreboardScreen from "./src/screens/results/RoundScoreboardScreen";

// Import Imposter Game screens
import ImposterLoadingScreen from "./src/screens/games/ImposterGame/ImposterLoadingScreen";
import ImposterGameScreen from "./src/screens/games/ImposterGame/ImposterGameScreen";
import ImposterVotingScreen from "./src/screens/games/ImposterGame/ImposterVotingScreen";
import ImposterResultsScreen from "./src/screens/games/ImposterGame/ImposterResultsScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false, // Disable swipe back for strict navigation
            animationEnabled: true,
          }}
        >
          {/* Landing Flow */}
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="CreateGame" component={CreateGameScreen} />
          <Stack.Screen name="JoinGame" component={JoinGameScreen} />

          {/* Game Flow - Strict Navigation Order */}
          <Stack.Screen name="Lobby" component={LobbyScreen} />
          <Stack.Screen
            name="CategorySelection"
            component={CategorySelectionScreen}
          />
          <Stack.Screen
            name="WaitingForCategory"
            component={WaitingForCategoryScreen}
          />

          {/* Legacy Question Flow */}
          <Stack.Screen name="QuestionIntro" component={QuestionIntroScreen} />
          <Stack.Screen name="Question" component={QuestionScreen} />

          {/* Imposter Game Flow */}
          <Stack.Screen
            name="ImposterLoading"
            component={ImposterLoadingScreen}
          />
          <Stack.Screen name="ImposterGame" component={ImposterGameScreen} />
          <Stack.Screen
            name="ImposterVoting"
            component={ImposterVotingScreen}
          />
          <Stack.Screen
            name="ImposterResults"
            component={ImposterResultsScreen}
          />

          {/* Results */}
          <Stack.Screen
            name="RoundScoreboard"
            component={RoundScoreboardScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}
