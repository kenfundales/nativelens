import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  ViewStyle,
  Linking,
} from "react-native";
import { fetchTreeDetails } from "../../services/api";
import { ChevronDown } from "lucide-react-native";

interface GrowthNeedsButtonProps {
  treeId?: string;
  style?: ViewStyle;
}

const GrowthNeedsButton: React.FC<GrowthNeedsButtonProps> = ({ treeId, style }) => {
  const [open, setOpen] = useState(false);
  const [growthNeeds, setGrowthNeeds] = useState<{ text: string; source: string | null } | null>(null);
  const rotation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const getGrowthNeeds = async () => {
      if (!treeId) return;
      try {
        const data = await fetchTreeDetails(treeId);
        setGrowthNeeds({
          text: data?.growth_needs || "No specific growth needs listed.",
          source: data?.source_link || "Test",
        });
      } catch (error) {
        console.error("Failed to fetch growth needs:", error);
        setGrowthNeeds({
          text: "Failed to fetch growth needs.",
          source: null,
        });
      }
    };
    getGrowthNeeds();
  }, [treeId]);

  const toggleDropdown = () => {
    Animated.timing(rotation, {
      toValue: open ? 0 : 180,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  return (
    <View style={[styles.dropdownContainer, style]}>
      <TouchableOpacity
        onPress={toggleDropdown}
        style={[
          styles.dropdownButton,
          open && styles.dropdownButtonOpen,
        ]}
      >
        <Image
          source={require("../../assets/icons/growth-needs-icon.png")}
          style={styles.iconPosition}
        />

        <Text style={styles.dropdownText}>Growth Needs</Text>

        <Animated.View style={styles.chevronPosition}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          >
            <ChevronDown size={20} color="white" />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownContent}>
          <Text style={styles.contentText}>
            {growthNeeds?.text}
          </Text>
          {growthNeeds?.source && (
            <Text
              style={styles.sourceLink}
              onPress={() => Linking.openURL(growthNeeds.source!)}
            >
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginTop: 10,
    width: "100%",
    alignSelf: "center",
  },
  dropdownButton: {
    backgroundColor: "#264D32",
    padding: 15,
    borderRadius: 30,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  iconPosition: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
  },
  chevronPosition: {
    position: "absolute",
    right: 20,
  },
  dropdownText: {
    fontFamily: "LeagueSpartan-Bold",
    fontSize: 18,
    color: "white",
  },
  dropdownContent: {
    backgroundColor: "#264D32",
    paddingRight: 30,
    paddingLeft: 30,
    paddingBottom: 25,
    borderRadius: 30,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    width: "100%",
    alignSelf: "center",
    elevation: 2,
  },
  contentText: {
    fontFamily: "LeagueSpartan-Regular",
    fontSize: 16,
    color: "white",
    textAlign: "justify",
  },
  sourceLink: {
    color: "#A1D99B",
    fontSize: 10,
    marginTop: -15,
    fontFamily: "PTSerif-Italic",
    textDecorationLine: "underline",
  },
});

export default GrowthNeedsButton;
