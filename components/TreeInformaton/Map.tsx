import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { fetchTreeLocations } from "../../services/api";
import { useNavigation, NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  MapScreen: { treeId: string };
};

interface MapProps {
  treeId: string;
}

const Map: React.FC<MapProps> = ({ treeId }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getTreeLocations = async () => {
      if (!treeId) {
        console.log("treeId is undefined in Map component");
        setError("No tree ID provided.");
        return;
      }
      try {
        console.log("Fetching locations for treeId in Map:", treeId);
        const locationData = await fetchTreeLocations(treeId);
        console.log("Tree Locations Received in Map:", locationData);
        if (locationData && Array.isArray(locationData) && locationData.length > 0) {
          setLocations(locationData);
          console.log("Locations set in Map:", locationData);
        } else {
          setError("No locations found for this tree.");
        }
      } catch (err: any) {
        console.error("Error fetching tree locations in Map:", err.message);
        setError("Failed to load tree locations.");
      }
    };
    getTreeLocations();
  }, [treeId]);

  const initialRegion = {
    latitude: 14.594,
    longitude: 120.9816,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        scrollEnabled={false}
      >
        {locations.length > 0 && locations.map((location, index) => {
          console.log(`Rendering Marker ${index + 1} in Map:`, location);
          return (
            <Marker
              key={index.toString()}
              coordinate={{
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
              }}
              title={location.name || `Tree Location ${index + 1}`}
              description={location.description || "A native tree location"}
            />
          );
        })}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </MapView>
      <TouchableOpacity
        style={styles.touchableOverlay}
        onPress={() => navigation.navigate("MapScreen", { treeId })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    marginTop: 10,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  touchableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  errorText: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "red",
    fontSize: 14,
  },
});

export default Map;