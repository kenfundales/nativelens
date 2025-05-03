import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem("treeHistory");
      setHistory([]);
    } catch (e) {
      console.error("Failed to clear history:", e);
      Alert.alert("Error", "Failed to clear history.");
    }
  };

  const deleteSingleHistoryItem = async (treeIdToDelete: string) => {
    try {
      const newHistory = history.filter(item => item.treeId !== treeIdToDelete);
      setHistory(newHistory);
      await AsyncStorage.setItem("treeHistory", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to delete item from history:", e);
      Alert.alert("Error", "Failed to delete item.");
    }
  };

  const confirmDeleteItem = (treeId: string) => {
    Alert.alert(
      "Delete History Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSingleHistoryItem(treeId) },
      ]
    );
  };

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: clearHistory },
      ]
    );
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
          {history.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={confirmClearHistory}>
              <Ionicons name="trash-outline" size={28} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerText}>HISTORY</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {history.length > 0 ? (
          history
            .filter(tree => tree.tree_name?.trim().toLowerCase() !== "unknown")
            .map((tree, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handleCardPress(tree.treeId)}
                onLongPress={() => confirmDeleteItem(tree.treeId)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Image
                      source={getTreeImage(tree.tree_name)}
                      style={styles.leafIcon}
                    />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>
                      {capitalizeFirstLetter(tree.tree_name)}
                    </Text>
                    <Text style={styles.cardSubtitle}>"{tree.sci_name}"</Text>
                  </View>

                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>></Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
        ) : (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryText}>No history available</Text>
          </View>
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
    height: 250,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  curvedBackgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  clearButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 20,
  },
  headerTitleContainer: {
    marginTop: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontFamily: 'LeagueSpartan-ExtraBold',
    fontWeight: "700",
    fontSize: 40,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 2,
  },
  scrollContainer: {
    paddingTop: 250,
    paddingBottom: 20,
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
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    marginLeft: 40,
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  leafIcon: {
    width: 90,
    height: 90,
    resizeMode: "cover",
    marginLeft: 50,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 50,
  },
  cardTitle: {
    fontFamily: 'LeagueSpartan-ExtraBold',
    fontWeight: "700",
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
  noHistoryContainer: {
    marginTop: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noHistoryText: {
    fontFamily: "PTSerif-Bold",
    fontSize: 18,
    color: "#264D32",
    textAlign: "center",
  },
});

export default History;
