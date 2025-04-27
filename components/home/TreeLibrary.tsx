import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";

const TreeLibrary = () => {
  const navigation = useNavigation();  // Get navigation object

  return (
    <TouchableOpacity style={styles.cardButton} onPress={() => navigation.navigate('TreeLibrary')}>
      <View style={styles.cardContent}>
        {/* Icon on the left */}
        <MaterialCommunityIcons name="magnify" size={40} color="#6A8E4E" style={styles.cardIcon} />

        {/* Texts */}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>TREE LIBRARY</Text>
          <Text style={styles.cardSubtitle}>Browse all available native tree species</Text>
        </View>
    
        {/* Arrow on the right */}
        <Feather name="arrow-right" size={24} color="#6A8E4E" style={styles.arrowIcon} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardButton: {
    width: wp("90%"),
    height: hp("18%"),
    backgroundColor: "white",
    borderTopLeftRadius: 30,  
    borderBottomLeftRadius: 30, 
    borderTopRightRadius: 0,   
    borderBottomRightRadius: 0,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIcon: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "PTSerif-Bold",
    fontWeight: "600",
    fontSize: 24,
    color: "#274C2A",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontFamily: "PTSerif-Regular",
    fontSize: 15,
    color: "#6A8E4E",
  },
  arrowIcon: {
    marginLeft: 10,
  },
});

export default TreeLibrary;
