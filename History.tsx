import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions, TouchableOpacity, Image, ImageBackground } from "react-native";
import BottomNavBar from "./components/bottomNavBar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  History: undefined;
  TreeInformation: { treeId: string };
};

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, "History">;
type TreeInformationScreenRouteProp = RouteProp<RootStackParamList, "TreeInformation">;

interface HistoryProps {
  navigation: HistoryScreenNavigationProp;
  route: TreeInformationScreenRouteProp;
}

const { width } = Dimensions.get("window");
const backgroundImage = require("./assets/images/homescreen-background.png");

// Tree images
const treeImages: { [key: string]: any } = {
  banaba: require("./assets/images/banaba.jpg"),
  narra: require("./assets/images/narra.jpg"),
  ipil: require("./assets/images/ipil.jpg"),
  talisay: require("./assets/images/talisay.jpg"),
  kamagong: require("./assets/images/kamagong.jpg"),
};

const defaultImage = require("./assets/images/narra.jpg");

const History: React.FC<HistoryProps> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<{ treeId: string; tree_name: string; sci_name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem("treeHistory");
        if (savedHistory !== null) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (e) {
        console.error("Failed to load history:", e);
        setError("Failed to load history.");
      }
    };
    loadHistory();
  }, [isFocused]);

  const handleCardPress = (treeId: string) => {
    navigation.navigate("TreeInformation", { treeId });
  };

  const getTreeImage = (treeName: string) => {
    return treeImages[treeName] || defaultImage;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={backgroundImage}
          style={styles.curvedBackground}
          imageStyle={styles.curvedBackgroundImage}
        >
          <Text style={styles.headerText}>HISTORY</Text>
        </ImageBackground>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {history.length > 0 ? (
          history
            .filter(tree => tree.tree_name?.trim().toLowerCase() !== "unknown") // <-- FILTER unknown
            .map((tree, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handleCardPress(tree.treeId)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={getTreeImage(tree.tree_name)}
                      style={styles.leafIcon}
                    />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{tree.tree_name}</Text>
                    <Text style={styles.cardSubtitle}>"{tree.sci_name}"</Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
        ) : (
          <Text>No history available.</Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <BottomNavBar />
    </SafeAreaView>
  );
};

// Function to add tree to history
export const addTreeToHistory = async (tree: { treeId: string; tree_name: string; sci_name: string }) => {
  try {
    const savedHistory = await AsyncStorage.getItem("treeHistory");
    const history = savedHistory ? JSON.parse(savedHistory) : [];

    if (history.some((item: { treeId: string }) => item.treeId === tree.treeId)) {
      return;
    }

    const newHistory = [tree, ...history].slice(0, 50);
    await AsyncStorage.setItem("treeHistory", JSON.stringify(newHistory));
  } catch (e) {
    console.error("Failed to add tree to history:", e);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9F0E5",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  curvedBackground: {
    height: 200,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  curvedBackgroundImage: {
    width: "100%",
    height: 190,
    resizeMode: "cover",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  headerText: {
    fontFamily: "PTSerif-Bold",
    fontSize: 40,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 2,
  },
  scrollContainer: {
    paddingTop: 155, 
    paddingBottom: -20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#A9C5A0",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginVertical: 10,
    marginLeft: -55,
    width: "100%",
    overflow: "hidden",
    flexDirection: "row",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    marginLeft: 60,
    width: 90,
    height: 90,
    overflow: "hidden",
  },
  leafIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textContainer: {
    flex: 1,
    paddingLeft: 20,
  },
  cardTitle: {
    fontFamily: "PTSerif-Bold",
    fontSize: 19,
    color: "#264D32",
  },
  cardSubtitle: {
    fontFamily: "PTSerif-Italic",
    fontSize: 14,
    color: "#678D58",
  },
  arrowContainer: {
    width: 60,
    alignItems: "center",
  },
  arrow: {
    fontSize: 24,
    color: "#3D6334",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
});

export default History;
