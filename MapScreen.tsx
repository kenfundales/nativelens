import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image as RNImage,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { fetchTreeLocations } from "./services/api";
import * as Location from "expo-location";
import axios from "axios";

type RootStackParamList = {
  MapScreen: { treeId: string };
};

const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "MapScreen">>();
  const treeId = route.params?.treeId;

  const mapRef = useRef<MapView | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [addingError, setAddingError] = useState<string | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 12.8797,
    longitude: 121.774,
    latitudeDelta: 12.0,
    longitudeDelta: 12.0,
  });

  useEffect(() => {
    const getTreeLocations = async () => {
      if (!treeId) {
        setError("No tree ID provided.");
        return;
      }
      try {
        const locationData = await fetchTreeLocations(treeId);
        if (Array.isArray(locationData) && locationData.length > 0) {
          const locationsWithAddresses = await Promise.all(
            locationData.map(async (location) => {
              const address = await getAddressFromCoordinates(location.latitude, location.longitude);
              return { ...location, address };
            })
          );
          setLocations(locationsWithAddresses);
        } else {
          setError("No locations found for this tree.");
        }
      } catch (err: any) {
        console.error("Error fetching tree locations:", err.message);
        setError("Failed to load tree locations.");
      }
    };
    getTreeLocations();
  }, [treeId]);

  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    try {
      const apiKey = "AIzaSyA_kdnKlO3iMBmcaidkomXf19qpueQ1aPI";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        return data.results[0]?.formatted_address || "Address not found";
      } else {
        return "Address not found";
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return "Error fetching address";
    }
  };

  const handleAddLocation = async () => {
    try {
      setAddingError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setAddingError("Permission to access location was denied.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({ latitude, longitude });
      setIsAddingLocation(true);
    } catch (err) {
      console.error("Error getting location:", err);
      setAddingError("Failed to get your current location.");
    }
  };

  const handleSaveLocation = async () => {
    if (!userLocation || !treeId) return;

    const locationExists = locations.some(
      (loc) =>
        Number(loc.latitude).toFixed(5) === userLocation.latitude.toFixed(5) &&
        Number(loc.longitude).toFixed(5) === userLocation.longitude.toFixed(5)
    );

    if (locationExists) {
      alert("This location already exists in the database.");
      return;
    }

    try {
      const response = await axios.post("http://13.211.144.239:5000/locations", {
        tree_id: treeId,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });

      setLocations((prev) => [...prev, response.data]);
      setUserLocation(null);
      setIsAddingLocation(false);
      setAddingError(null);
      alert("Location saved successfully!");
    } catch (err) {
      console.error("Error saving location:", err);
      setAddingError("Failed to save location.");
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    const philippinesBounds = {
      latitudeMin: 5.0,
      latitudeMax: 20.0,
      longitudeMin: 115.0,
      longitudeMax: 130.0,
    };

    let { latitude, longitude, latitudeDelta, longitudeDelta } = newRegion;

    // Clamp latitude and longitude within Philippine boundaries
    const clampedLatitude = Math.min(Math.max(latitude, philippinesBounds.latitudeMin), philippinesBounds.latitudeMax);
    const clampedLongitude = Math.min(Math.max(longitude, philippinesBounds.longitudeMin), philippinesBounds.longitudeMax);

    const isOutOfBounds = latitude !== clampedLatitude || longitude !== clampedLongitude;

    if (isOutOfBounds && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: clampedLatitude,
          longitude: clampedLongitude,
          latitudeDelta,
          longitudeDelta,
        },
        800 // Smoothness duration in milliseconds
      );
    }

    setRegion({
      latitude: clampedLatitude,
      longitude: clampedLongitude,
      latitudeDelta,
      longitudeDelta,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        onRegionChangeComplete={handleRegionChange}
        zoomEnabled={true}
        minZoomLevel={5}
        maxZoomLevel={20}
        provider="google"
      >
        {locations.map((location, index) => (
          <Marker
            key={index.toString()}
            coordinate={{
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
            }}
            title={`Tree Location ${index + 1}`}
            description={location.address || "A native tree location"}
          >
            <RNImage
              source={require("./assets/icons/treemarker.png")}
              style={{ width: 24, height: 24, resizeMode: "contain" }}
            />
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>

      {!isAddingLocation && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
          <Text style={styles.buttonText}>Add Location</Text>
        </TouchableOpacity>
      )}

      {isAddingLocation && userLocation && (
        <View style={styles.saveContainer}>
          <Text style={styles.coordsText}>
            Latitude: {userLocation.latitude.toFixed(5)}{"\n"}
            Longitude: {userLocation.longitude.toFixed(5)}
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
            <Text style={styles.buttonText}>Save Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {addingError && (
        <Text style={{ position: "absolute", bottom: 180, color: "red", paddingHorizontal: 20 }}>
          {addingError}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 5,
  },
  closeText: { fontSize: 16, fontWeight: "bold" },
  addButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    elevation: 5,
  },
  saveContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    elevation: 5,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  coordsText: { fontSize: 14, color: "black" },
});

export default MapScreen;
