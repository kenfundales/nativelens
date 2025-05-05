import React from "react";
import { View, StyleSheet, Text, ImageBackground } from "react-native";
import Identify from "./components/home/Identify";
import History from "./components/home/History";
import TreeLibrary from "./components/home/TreeLibrary";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const HomeScreen = () => {
  return (
    <ImageBackground
      source={require("./assets/images/homescreen-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header with Text only, no dark overlay */}
      <View style={styles.header}>
        {/* Remove the darkOverlay view here */}

        {/* Text block */}
        <View style={styles.overlayTextWrapper}>
          <Text style={styles.overlayText}>NATIVE</Text>
          <Text style={styles.overlayText}>LENS</Text>
          <Text style={styles.overlayTagline}>
            Identify and Discover Native Trees in the Philippines
          </Text> 
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Identify />
        <History />
        <TreeLibrary />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#F4F1E9",
  },
  header: {
    width: wp("100%"),
    height: hp("35%"),
    overflow: "hidden",
  },
  overlayTextWrapper: {
    width: wp("100%"),
    height: hp("50%"),
    marginTop: hp("5%"),
    marginLeft: wp("5%"),
    zIndex: 2,
  },
  overlayText: {
    fontFamily: "LeagueSpartan-ExtraBold",
    fontSize: 50,
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: "left",
    letterSpacing: -1,
  },
  overlayTagline: {
    fontFamily: "LeagueSpartan-Light",
    fontSize: 16,
    color: "white",
    marginTop: hp("2%"),
    marginBottom: hp("10%"),
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textAlign: "left",
  },
  buttonsContainer: {
    flex: 1,
    marginTop: hp("2%"),
    paddingHorizontal: hp("6%"),
    gap: 20,
  },
});

export default HomeScreen;
