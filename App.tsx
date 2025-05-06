import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigator/StackNav";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { fetchTreeDetails } from "./services/api"; // Importing the fetchTreeDetails API function

export default function App() {
  const [fontsLoaded] = useFonts({
    "PTSerif-Regular": require("./assets/fonts/PTSerif-Regular.ttf"),
    "PTSerif-Bold": require("./assets/fonts/PTSerif-Bold.ttf"),
    "PTSerif-Italic": require("./assets/fonts/PTSerif-Italic.ttf"),
    "Poppins-Italic": require("./assets/fonts/Poppins-Italic.ttf"),
    "LeagueSpartan-Bold": require("./assets/fonts/LeagueSpartan-Bold.ttf"),
    "LeagueSpartan-SemiBold": require("./assets/fonts/LeagueSpartan-SemiBold.ttf"),
    "LeagueSpartan-ExtraBold": require("./assets/fonts/LeagueSpartan-ExtraBold.ttf"),
    "LeagueSpartan-Regular": require("./assets/fonts/LeagueSpartan-Regular.ttf"),
    "LeagueSpartan-Black": require("./assets/fonts/LeagueSpartan-Black.ttf"),
    "LeagueSpartan-Medium": require("./assets/fonts/LeagueSpartan-Medium.ttf"),
    "LeagueSpartan-Light": require("./assets/fonts/LeagueSpartan-Light.ttf"),
    "LeagueSpartan-Thin": require("./assets/fonts/LeagueSpartan-Thin.ttf"),
  });

  const [isReady, setIsReady] = useState(false);
  const [trees, setTrees] = useState([]);

  useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
        // Fetch the first tree (replace `treeId` with an actual tree ID)
        const treeId = "1"; // Example ID, replace with dynamic data as needed
        const tree = await fetchTreeDetails(treeId); // Fetch tree details using the correct function
        if (tree) setTrees([tree]); // Set the tree data into state
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!fontsLoaded || !isReady) {
    return <Text>Loading...</Text>;
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
