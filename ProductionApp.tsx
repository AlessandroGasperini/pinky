import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { ProductionGameProvider } from "./src/contexts/ProductionGameContext";

// Production Screens
import ProductionHomeScreen from "./src/screens/ProductionHomeScreen";
import ProductionLobbyScreen from "./src/screens/ProductionLobbyScreen";
import ProductionCategorySelectionScreen from "./src/screens/ProductionCategorySelectionScreen";
import ProductionWaitingForCategoryScreen from "./src/screens/ProductionWaitingForCategoryScreen";
import ProductionQuestionScreen from "./src/screens/ProductionQuestionScreen";
import ProductionResultsScreen from "./src/screens/ProductionResultsScreen";

const Stack = createStackNavigator();

export default function ProductionApp() {
  return (
    <ProductionGameProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: "#1a1a2e" },
            gestureEnabled: false, // Disable swipe gestures for stability
          }}
        >
          <Stack.Screen name="Home" component={ProductionHomeScreen} />
          <Stack.Screen name="Lobby" component={ProductionLobbyScreen} />
          <Stack.Screen
            name="CategorySelection"
            component={ProductionCategorySelectionScreen}
          />
          <Stack.Screen
            name="WaitingForCategory"
            component={ProductionWaitingForCategoryScreen}
          />
          <Stack.Screen name="Question" component={ProductionQuestionScreen} />
          <Stack.Screen name="Results" component={ProductionResultsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ProductionGameProvider>
  );
}

