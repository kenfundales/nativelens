import React, { useState } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, Dimensions, TouchableOpacity, Image, ImageBackground } from "react-native";
import BottomNavBar from "./components/bottomNavBar";
import { useNavigation, NavigationProp } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  TreeLibrary: undefined;
  TreeInformation: { treeId: string };
};

const treeData = [
  { treeId: "2", name: "Banaba", scientificName: "Lagerstroemia speciosa", image: require("./assets/images/banaba.jpg") },
  { treeId: "3", name: "Ipil", scientificName: "Intsia bijuga", image: require("./assets/images/ipil.jpg") },
  { treeId: "4", name: "Kamagong", scientificName: "Diospyros philippinensis", image: require("./assets/images/kamagong.jpg") },
  { treeId: "1", name: "Narra", scientificName: "Pterocarpus indicus", image: require("./assets/images/narra.jpg") },
  { treeId: "5", name: "Talisay", scientificName: "Terminalia catappa", image: require("./assets/images/talisay.jpg") },
];

const TreeLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const filteredData = treeData.filter(tree =>
    tree.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tree.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTreePress = (treeId: string) => {
    navigation.navigate("TreeInformation", { treeId });
  };

  return (
    <View style={styles.container}>
      {/* Top Background with Background Image */}
      <ImageBackground
        source={require("./assets/images/homescreen-background.png")} // <-- add your header background image here
        style={styles.topBackground}
        resizeMode="cover"
      >
        <Text style={styles.title}>TREE</Text>
        <Text style={styles.title}>LIBRARY</Text>
      </ImageBackground>

      {/* Curved White Area */}
      <View style={styles.curvedWhiteArea}>
      </View>

      {/* Tree List */}
      <View style={styles.listContainer}>
  {/* Search Bar Floating Above */}
  <TextInput
    style={styles.searchBar}
    placeholder="Search"
    placeholderTextColor="#999"
    value={searchQuery}
    onChangeText={setSearchQuery}
  />

  {/* Tree List */}
  {filteredData.length === 0 ? (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>No results found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.treeId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleTreePress(item.treeId)}
            >
              <Image
                source={item.image}
                style={styles.imageBackground}
                resizeMode="cover"
              />
              <View style={styles.textContainer}>
                <Text style={styles.treeName}>{item.name}</Text>
                <Text style={styles.scientificName}>"{item.scientificName}"</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingTop: 70, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>


      {/* Bottom Nav */}
      <View style={styles.bottomNavContainer}>
        <BottomNavBar />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E9F0E5",
  },
  topBackground: {
    height: 280,
    alignItems: "center",
    paddingTop:70,
  },
  title: {
    fontFamily: "PTSerif-Bold",
    fontSize: 32,
    color: "white",
    letterSpacing: 1,
  },
  curvedWhiteArea: {
    backgroundColor: "#E9F0E5",
    borderTopRightRadius: 50,
    paddingTop: 20,
    alignItems: "center",
    marginTop: -45,
  },
  searchBar: {
    position: "absolute",
    top: 15,
    alignSelf: "center",
    backgroundColor: "#fff",
    width: "85%",
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 30,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#E9F0E5",
    marginTop: -50,
    borderTopRightRadius: 50,
    overflow: "hidden",
  },
  
  noResultsContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  noResultsText: {
    fontFamily: "PTSerif-Regular",
    fontSize: 18,
    color: "#264D32",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A9C5A0",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 2,
    zIndex:1,
  },
  imageBackground: {
    width: 90,
    height: 90,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  treeName: {
    fontFamily: "PTSerif-Bold",
    fontSize: 19,
    color: "#264D32",
  },
  scientificName: {
    fontFamily: "PTSerif-Italic",
    fontSize: 14,
    color: "#3D6B43",
    marginTop: 2,
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingBottom: 10,
  },
});

export default TreeLibrary;