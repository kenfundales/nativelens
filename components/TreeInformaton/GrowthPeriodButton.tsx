import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, ViewStyle } from "react-native";
import { fetchTreeDetails } from "../../services/api";
import { ChevronDown } from "lucide-react-native";

interface GrowthPeriodProps {
  treeId?: string;
  style?: ViewStyle; // Accept style from parent
}

const GrowthPeriod: React.FC<GrowthPeriodProps> = ({ treeId, style }) => {
  const [open, setOpen] = useState(false);
  const [growthPeriod, setGrowthPeriod] = useState<string | null>(null);
  const rotation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const getGrowthPeriod = async () => {
      if (!treeId) return;
      try {
        const data = await fetchTreeDetails(treeId);
        setGrowthPeriod(data?.growth_period || "No specific growth period listed.");
      } catch (error) {
        console.error("Failed to fetch growth period:", error);
        setGrowthPeriod("Failed to fetch growth period.");
      }
    };
    getGrowthPeriod();
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
      <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton}>
        <Image source={require("../../assets/icons/growth-period-icon.png")} style={styles.iconPosition} />

        <Text style={styles.dropdownText}>Growth Period</Text>

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
            {growthPeriod}
          </Text>
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
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center the text
    position: "relative", // Allow absolute positioning inside
  },
  iconPosition: {
    position: "absolute",
    left: 20,
    width: 24,
    height: 24,
  },
  chevronPosition: {
    position: "absolute",
    right: 20,
  },
  dropdownText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  dropdownContent: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    marginTop: 5,
    borderRadius: 10,
    width: "100%", 
    alignSelf: "center",
    elevation: 2,
  },
  contentText: {
    fontSize: 16,
    color: "#555",
  },
});

export default GrowthPeriod;
