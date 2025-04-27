import React, { useRef, useEffect, useState } from "react";
import { Animated, View, StyleSheet, Image, Text } from "react-native";
import GrowthNeedsButton from "./components/TreeInformaton/GrowthNeedsButton";
import GrowthPeriod from "./components/TreeInformaton/GrowthPeriodButton";
import LifeSpanButton from "./components/TreeInformaton/LifeSpanButton";
import BottomNavBar from "./components/bottomNavBar";
import Map from "./components/TreeInformaton/Map";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { fetchTreeDetails } from "./services/api";
import { useRoute } from "@react-navigation/native";
import { RouteProp } from "@react-navigation/native";

type RootStackParamList = {
  TreeInformation: { treeId: string };
};

const TreeInformation = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const route = useRoute<RouteProp<RootStackParamList, "TreeInformation">>();
  const [tree, setTree] = useState<any>(null);
  const treeId = route.params?.treeId;

  useEffect(() => {
    const getTreeData = async () => {
      if (!treeId) {
        console.log("treeId is undefined in TreeInformation - route.params:", route.params);
        return;
      }
      try {
        console.log("Fetching tree data with treeId:", treeId);
        const treeData = await fetchTreeDetails(treeId);
        console.log("Fetched Tree Data:", treeData);
        setTree(treeData);
      } catch (error) {
        console.error("Error fetching tree data:", error);
      }
    };
    getTreeData();
  }, [treeId]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, hp("20%")],
    outputRange: [hp("35%"), hp("20%")],
    extrapolate: "clamp",
  });

  const contentTranslateY = scrollY.interpolate({
    inputRange: [0, hp("20%")],
    outputRange: [0, -hp("10%")],
    extrapolate: "clamp",
  });

  // 🌳 Dynamic image mapping based on tree_name
  const getTreeImage = (treeName: string | undefined) => {
    if (!treeName) {
      return require("./assets/images/narra-bg.png"); // Default image if name is undefined
    }

    const name = treeName.toLowerCase();

    if (name.includes("narra")) {
      return require("./assets/images/narratree.png");
    } else if (name.includes("banaba")) {
      return require("./assets/images/banabatree.png");
    } else if (name.includes("kamagong")) {
      return require("./assets/images/kamagongtree.png");
    } else if (name.includes("ipil")) {
      return require("./assets/images/ipiltree.png");
    } else if (name.includes("talisay")) {
      return require("./assets/images/talisaytree.png");
    }
    // ➡️ Add more trees as needed

    return require("./assets/images/narra-bg.png"); // fallback
  };

  return (
    <View style={styles.mainContainer}>
      <Animated.View style={[styles.imageContainer, { height: headerHeight }]}>
        {tree ? (
          <Image source={getTreeImage(tree.tree_name)} style={styles.image} />
        ) : (
          <Image source={require("./assets/images/narra-bg.png")} style={styles.image} />
        )}
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Animated.View style={[styles.contentWrapper, { transform: [{ translateY: contentTranslateY }] }]}>
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{tree ? tree.tree_name : "Loading..."}</Text>
            <Text style={styles.scientificName}>{tree ? tree.sci_name : ""}</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.description}>
                {tree ? tree.description : "No description available"}
              </Text>
            </View>
          </View>

          {/* Pass treeId explicitly */}
          <View style={styles.buttonContainer}>
            <GrowthNeedsButton treeId={treeId} />
            <LifeSpanButton treeId={treeId} />
            <GrowthPeriod treeId={treeId} />
            <Map treeId={treeId} />
          </View>
        </Animated.View>
      </Animated.ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
  },
  imageContainer: {
    width: wp("100%"),
    height: hp("50%"),
    position: "absolute",
    top: 0,
    backgroundColor: "#264D32",
    zIndex: 0,
  },
  image: {
    width: "100%",
    height: "150%",
    top: -160,
    resizeMode: "cover",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentWrapper: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: hp("10%"),
    alignItems: "center",
    position: "relative",
    marginTop: hp("30%"),
    zIndex: 1,
  },
  infoContainer: {
    width: "95%",
    alignItems: "flex-start",
    marginTop: 5,
    marginBottom: 20,
  },
  title: {
    fontFamily: "PTSerif-Regular",
    fontSize: 24,
    color: "#3d3d3d",
    textAlign: "left",
    width: "100%",
  },
  scientificName: {
    fontFamily: "PTSerif-Italic",
    color: "#6d8f69",
    marginBottom: 10,
    textAlign: "left",
    width: "100%",
  },
  descriptionBox: {
    paddingTop: 15,
    borderRadius: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  description: {
    fontFamily: "PTSerif-Regular",
    color: "#6d8f69",
    fontSize: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});

export default TreeInformation;
