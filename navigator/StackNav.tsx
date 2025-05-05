import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../HomeScreen";
import SplashScreen from "../SplashScreen";
import TreeInformation from "../TreeInformation";
import TreeInformationWA from "../TreeInformationWA";
import TreeLibrary from "../TreeLibrary";
import TreeLibraryWA from "../TreeLibraryWA";
import History from "../History";
import MapScreen from "../MapScreen";
import MapScreenWA from "../MapScreenWA";
import Camera from "../components/home/Camera";

type RootStackParamList = {
  SplashScreen: undefined;
  HomeScreen: undefined;
  TreeInformation: undefined;
  TreeInformationWA: undefined;
  TreeLibrary: undefined;
  TreeLibraryWA: undefined;
  History: undefined;
  MapScreen: undefined;
  MapScreenWA: undefined;
  Camera: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="TreeInformation" component={TreeInformation} />
      <Stack.Screen name="TreeInformationWA" component={TreeInformationWA} />
      <Stack.Screen name="TreeLibrary" component={TreeLibrary} />
      <Stack.Screen name="TreeLibraryWA" component={TreeLibraryWA} />
      <Stack.Screen name="History" component={History} />
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="MapScreenWA" component={MapScreenWA} />
      <Stack.Screen name="Camera" component={Camera} />

    </Stack.Navigator>
  );
}
