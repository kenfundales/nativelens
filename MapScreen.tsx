import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image as RNImage,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { fetchTreeLocations } from "./services/api";
import BottomNavBar from "./components/bottomNavBar";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import * as Location from "expo-location";
import axios from "axios";

type RootStackParamList = {
  MapScreen: { treeId: string; fromCamera?: boolean };
};

const MapScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "MapScreen">>();
  const treeId = route.params?.treeId;
  const fromCamera = route.params?.fromCamera; // Get fromCamera from route params

  const mapRef = useRef<MapView | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [addingError, setAddingError] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const initialRegion: Region = {
    latitude: 12.8797,
    longitude: 121.774,
    latitudeDelta: 12.0,
    longitudeDelta: 12.0, 
  };

  const [region, setRegion] = useState<Region>(initialRegion);

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
      const apiKey = "AIzaSyA_kdnKlO3iMBmcaidkomXf19qpueQ1aPI"; // Use environment variable in production
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const components = data.results[0].address_components;

        let barangay = "";
        let city = "";
        let region = "";

        for (const comp of components) {
          if (comp.types.includes("sublocality_level_1") || comp.types.includes("neighborhood")) {
            barangay = comp.long_name;
          }
          if (comp.types.includes("locality")) {
            city = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            region = comp.long_name;
          }
        }

        const parts = [barangay, city, region].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Address not found";
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

      const address = await getAddressFromCoordinates(latitude, longitude);
      setCurrentAddress(address);

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

      const address = await getAddressFromCoordinates(userLocation.latitude, userLocation.longitude);

      setLocations((prev) => [...prev, { ...response.data, address }]);
      setUserLocation(null);
      setCurrentAddress(null);
      setIsAddingLocation(false);
      setAddingError(null);
      alert("Location saved successfully!");
    } catch (err) {
      console.error("Error saving location:", err);
      setAddingError("Failed to save location.");
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    const isZoomedOut = newRegion.latitudeDelta > 20 || newRegion.longitudeDelta > 20;

    if (isZoomedOut && mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 800);
    }

    setRegion(newRegion);
  };

  const handleMapPress = () => {
    if (isAddingLocation) {
      setIsAddingLocation(false);
      setUserLocation(null);
      setCurrentAddress(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleMapPress}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
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
                style={{ width: wp('5%'), height: hp('5%'), resizeMode: "contain" }}
              />
            </Marker>
          ))}
        </MapView>
      </TouchableWithoutFeedback>

      {!isAddingLocation && fromCamera && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
          <Text style={styles.buttonText}>Add Location</Text>
        </TouchableOpacity>
      )}

      {isAddingLocation && userLocation && (
        <View style={styles.locationCard}>
          <View style={styles.locationHeaderContainer}>
            <Text style={styles.locationHeaderText}>Your current location</Text>
          </View>
          <View style={styles.locationContent}>
            {currentAddress && (
              <Text style={styles.locationName}>{currentAddress}</Text>
            )}
            <Text style={styles.locationCoords}>
              Latitude: {userLocation.latitude.toFixed(5)}{"\n"}
              Longitude: {userLocation.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity style={styles.saveLocationButton} onPress={handleSaveLocation}>
              <Text style={styles.saveLocationText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {addingError && (
        <Text style={{ position: "absolute", bottom: 180, color: "red", paddingHorizontal: 20 }}>
          {addingError}
        </Text>
      )}
     

      {/* Top Left Panel: List of Locations */}
    
        <View style={styles.topRightPanel}>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.locationListTitle}>Prominent Tree Locations</Text>
          </TouchableOpacity>

          {isExpanded && (
            locations.length > 0 ? (
              <ScrollView style={styles.scrollList}>
                {locations.map((loc, idx) => (
                  <View key={idx.toString()} style={styles.locationItem}>
                    <Text style={styles.locationText}>🌳 {loc.address || "Unknown Area"}</Text>
                    <Text style={styles.coordsTextSmall}>
                      Lat: {Number(loc.latitude).toFixed(5)}, Lng: {Number(loc.longitude).toFixed(5)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noLocationsText}>No locations available.</Text>
            )
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
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  addButton: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    elevation: 5,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  locationCard: {
    position: "absolute",
    width: "50%",
    height: hp("30%"),
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
  },
  locationHeaderContainer: {
    backgroundColor: "#5A7D4E",
    padding: 12,
  },
  locationHeaderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  locationContent: {
    padding: 16,
    alignItems: "center",
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5A7D4E",
    marginBottom: 4,
    textAlign: "center",
  },
  locationCoords: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  saveLocationButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    elevation: 5,
    alignItems: "center",
    minWidth: 140,
  },
  saveLocationText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  topRightPanel: {
    position: "absolute",
    top: 55,
    right: 10,
    width: wp("50%"),
    maxHeight: hp("40%"),
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    padding: 10,
    textAlign: "center",
    paddingBottom: 10,
  },
  locationListTitle: {
    textAlign: "center",
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#5A7D4E",
  },
  scrollList: {
    maxHeight: hp("35%"),
  },
  locationItem: {
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  coordsTextSmall: {
    fontSize: 12,
    color: "gray",
  },
  noLocationsText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
  },
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});

export default MapScreen;