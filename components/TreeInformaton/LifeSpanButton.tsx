import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, ActivityIndicator, ViewStyle } from "react-native";
import { fetchTreeDetails } from "../../services/api";
import { ChevronDown } from "lucide-react-native";

interface LifespanButtonProps {
  treeId: string;
  style?: ViewStyle; // Accept style from parent
}

const LifespanButton: React.FC<LifespanButtonProps> = ({ treeId, style }) => {
  const [open, setOpen] = useState(false);
  const [lifespan, setLifespan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getLifespan = async () => {
      if (!open || !treeId) return;

      setLoading(true);
      setError(null);
      try {
        const treeData = await fetchTreeDetails(treeId);
        if (treeData?.lifespan) {
          setLifespan(treeData.lifespan);
        } else {
          setLifespan("No lifespan data available.");
        }
      } catch (err) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    getLifespan();
  }, [open, treeId]);

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
          open && styles.dropdownButtonOpen, // Conditionally remove bottom radius
        ]}
      >
        <Image source={require("../../assets/icons/lifespan-icon.png")} style={styles.iconPosition} />

        <Text style={styles.dropdownText}>Lifespan</Text>

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
            {lifespan}
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
    width: 35,
    height: 35,
  },
  chevronPosition: {
    position: "absolute",
    right: 20,
  },
  dropdownText: {
    fontSize: 18,
    fontFamily: "LeagueSpartan-Bold",
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
    fontSize: 16,
    fontFamily: "LeagueSpartan-Regular",
    color: "white",
    textAlign: "justify",
  },
});
export default LifespanButton;
