import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, StyleSheet, Modal, Image, Alert } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { addTreeToHistory } from "../../History";
import Icon from "react-native-vector-icons/MaterialIcons";

// Define the navigation stack param list
type RootStackParamList = {
  Camera: undefined;
  TreeInformationWA: { treeId: string };
};

const Identify = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [treeId, setTreeId] = useState<string | null>(null);

  // Debug loading state changes
  useEffect(() => {
    console.log("Loading state changed:", loading);
  }, [loading]);

  // Tree data mappings from Camera.tsx
  const treeIdMap: { [key: string]: string } = {
    narra: "1",
    banaba: "2",
    ipil: "3",
    kamagong: "4",
    talisay: "5",
  };

  const sciNameMap: { [key: string]: string } = {
    narra: "Pterocarpus indicus",
    ipil: "Intsia bijuga",
    banaba: "Lagerstroemia speciosa",
    kamagong: "Diospyros philippinensis",
    talisay: "Terminalia catappa",
  };

  // Send image to AI model
  async function sendToAI(base64Image: string) {
    try {
      console.log("Base64 image length:", base64Image.length);
      console.log("Base64 starts with:", base64Image.substring(0, 50));

      if (!base64Image) {
        throw new Error("Base64 image data is empty.");
      }

      const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
      console.log("Cleaned base64 length:", cleanBase64.length);

      const response = await axios.post(
        "https://detect.roboflow.com/natreee/15",
        cleanBase64,
        {
          params: { api_key: "AbTTWufj54wj07u2ALrz" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 60000,
        }
      );
      return response;
    } catch (error: any) {
      console.error("API Error Details:", {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : null,
      });
      throw new Error(`Failed to send image to AI model: ${error.message}`);
    }
  }

  // Process AI response
  async function processAI(base64Image: string) {
    try {
      console.log("Starting AI processing...");
      const response = await sendToAI(base64Image);
      const predictions = response.data?.predictions || [];
      const confidenceThreshold = 0.90;
      const knownTreeClasses = ["narra", "ipil", "banaba", "kamagong", "talisay", "unknown"];

      const bestPrediction = predictions.find((prediction: any) =>
        prediction.confidence >= confidenceThreshold && knownTreeClasses.includes(prediction.class.toLowerCase())
      );

      if (bestPrediction) {
        const treeName = bestPrediction.class.toLowerCase();
        setAiResponse(treeName.charAt(0).toUpperCase() + treeName.slice(1));
        setConfidence(bestPrediction.confidence);

        if (treeName !== "unknown") {
          const newTreeId = treeIdMap[treeName];
          setTreeId(newTreeId);
          await addTreeToHistory({
            treeId: newTreeId,
            tree_name: treeName,
            sci_name: sciNameMap[treeName],
            locationTagged: false,
          });
          return newTreeId;
        }
      } else {
        setAiResponse("Unknown");
        setConfidence(null);
      }
    } catch (error: any) {
      console.error("API Error in processAI:", error.message);
      Alert.alert(
        "Error",
        `Failed to identify the tree: ${error.message}. Please check your internet connection or try a different image.`
      );
    }
    return null;
  }

  // Handle Capture option
  const handleCapture = () => {
    console.log("Capture option selected");
    setModalVisible(false);
    navigation.navigate("Camera");
  };

  // Handle Upload option
  const handleUpload = async () => {
    console.log("Upload option selected");
    setModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access gallery is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const compressedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 640 } }],
          { base64: true }
        );

        setImageUri(compressedImage.uri);
        setBase64Image(compressedImage.base64);
        setCropModalVisible(true);
        console.log("Crop Preview Modal opened");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("An error occurred while accessing the gallery.");
    }
  };

  // Handle Confirm Upload
  const handleConfirmUpload = async () => {
    if (!base64Image) {
      alert("No image selected for upload.");
      setCropModalVisible(false);
      return;
    }

    console.log("Confirm Upload pressed, setting loading to true");
    setCropModalVisible(false);
    setLoading(true);
    setResultModalVisible(true);
    try {
      const newTreeId = await processAI(base64Image);
      if (newTreeId) {
        setTreeId(newTreeId);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to identify the tree. Please try again.");
    } finally {
      // Extended delay to ensure loading overlay is visible
      setTimeout(() => {
        console.log("Setting loading to false");
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.cardButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.cardContent}>
          <MaterialCommunityIcons name="scan-helper" size={40} color="#6A8E4E" style={styles.cardIcon} />
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>IDENTIFY{"\n"}NATIVE TREE</Text>
            <Text style={styles.cardSubtitle}>Identify a native tree through scanning its leaf</Text>
          </View>
          <Feather name="arrow-right" size={24} color="#6A8E4E" style={styles.arrowIcon} />
        </View>
      </TouchableOpacity>

      {/* Modal for choosing Capture or Upload */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose an Option</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCapture}>
              <Text style={styles.modalButtonText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleUpload}>
              <Text style={styles.modalButtonText}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Crop Preview Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={cropModalVisible}
        onRequestClose={() => setCropModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Preview Cropped Image</Text>
            <View style={styles.imageWrapper}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              )}
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleConfirmUpload}>
              <Text style={styles.modalButtonText}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setCropModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Result Modal */}
      <Modal visible={resultModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopBar}>
              {aiResponse && aiResponse.toUpperCase() !== "UNKNOWN" ? (
                <Text style={styles.modalTopText}>Image uploaded is identified{'\n'}as native tree</Text>
              ) : (
                <Text style={styles.modalTopText}></Text>
              )}
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => {
                  setResultModalVisible(false);
                  setImageUri(null);
                  setBase64Image(null);
                  setAiResponse(null);
                  setConfidence(null);
                  setTreeId(null);
                  console.log("AI Result Modal closed");
                }}
              >
                <Icon name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {loading && (
                <View style={styles.modalLoadingOverlay}>
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
              {!loading && aiResponse && (
                <>
                  <Text style={styles.treeName}>{aiResponse.toUpperCase()}</Text>
                  {aiResponse.toUpperCase() === "UNKNOWN" ? (
                    <Text style={styles.modalSubText}>
                      Could not identify the tree. Please try a clearer image or a known tree.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.sciName}>
                        {sciNameMap[aiResponse.toLowerCase()] ? `"${sciNameMap[aiResponse.toLowerCase()]}"` : ""}
                      </Text>
                      {confidence !== null && (
                        <Text style={styles.confidenceText}>
                          Confidence: {(confidence * 100).toFixed(2)}%
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}

              {!loading && aiResponse && aiResponse.toUpperCase() !== "UNKNOWN" && treeId && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setResultModalVisible(false);
                    setImageUri(null);
                    setBase64Image(null);
                    setAiResponse(null);
                    setConfidence(null);
                    navigation.navigate("TreeInformationWA", { treeId });
                    setTreeId(null);
                    console.log("Navigating to TreeInformationWA");
                  }}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    zIndex: 1,
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
    fontFamily: "LeagueSpartan-Bold",
    fontWeight: "600",
    fontSize: 24,
    color: "#274C2A",
    marginBottom: 5,
  },
  cardSubtitle: {
    fontFamily: "LeagueSpartan-Regular",
    fontSize: 15,
    color: "#6A8E4E",
  },
  arrowIcon: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: wp("80%"),
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 5,
    zIndex: 1001,
  },
  modalTitle: {
    fontFamily: "LeagueSpartan-Bold",
    fontSize: 20,
    color: "#274C2A",
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#6A8E4E",
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  modalButtonText: {
    fontFamily: "LeagueSpartan-Regular",
    fontSize: 16,
    color: "white",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  cancelButtonText: {
    color: "#274C2A",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    width: wp("80%"),
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1001,
    position: "relative",
  },
  modalTopBar: {
    backgroundColor: "#3D6B41",
    paddingVertical: 10,
    paddingHorizontal: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTopText: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    fontFamily: "LeagueSpartan-Regular",
    flex: 1,
  },
  modalBody: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    minHeight: hp("20%"),
  },
  imageWrapper: {
    width: wp("60%"),
    height: hp("20%"),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    zIndex: 1002,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    zIndex: 1003,
  },
  modalLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(235, 235, 235, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1004,
  },
  loadingText: {
    color: "black",
    fontSize: 20,
    fontFamily: "LeagueSpartan-Light",
  },
  treeName: {
    fontSize: 22,
    color: "#3D6B41",
    marginTop: 20,
    marginBottom: 2,
    textAlign: "center",
    fontFamily: "LeagueSpartan-Bold",
  },
  sciName: {
    fontSize: 15,
    fontFamily: "PTSerif-Italic",
    color: "#3D6B41",
    marginBottom: 6,
    textAlign: "center",
    opacity: 0.7,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: "LeagueSpartan-Light",
    color: "#56945c",
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 12,
  },
  modalSubText: {
    fontSize: 16,
    fontFamily: "LeagueSpartan-Regular",
    color: "black",
    marginBottom: 10,
    textAlign: "center",
  },
  closeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 1005,
    padding: 4,
  },
  viewButton: {
    marginTop: 20,
    backgroundColor: "#739E57",
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 20,
    borderRadius: 10,
  },
  viewButtonText: {
    fontFamily: "LeagueSpartan-Light",
    color: "white",
    fontSize: 16,
  },
});

export default Identify;