// PROFESSIONAL APP.TSX - Built for 100K+ users with strict navigation
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GameProvider } from "./src/contexts/GameContext";

// Import all screens
import LandingScreen from "./src/screens/LandingScreen";
import CreateGameScreen from "./src/screens/CreateGameScreen";
import JoinGameScreen from "./src/screens/JoinGameScreen";
import LobbyScreen from "./src/screens/LobbyScreen";
import CategorySelectionScreen from "./src/screens/CategorySelectionScreen";
import WaitingForCategoryScreen from "./src/screens/WaitingForCategoryScreen";
import QuestionIntroScreen from "./src/screens/QuestionIntroScreen";
import QuestionScreen from "./src/screens/QuestionScreen";
import RoundScoreboardScreen from "./src/screens/RoundScoreboardScreen";

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
          <Stack.Screen name="QuestionIntro" component={QuestionIntroScreen} />
          <Stack.Screen name="Question" component={QuestionScreen} />
          <Stack.Screen
            name="RoundScoreboard"
            component={RoundScoreboardScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}
