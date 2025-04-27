import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import { Camera as LucideCamera,Upload, X } from "lucide-react-native"; 
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, Modal } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { addTreeToHistory } from "../../History";
import Icon from "react-native-vector-icons/MaterialIcons"; // Kept only for modal close button

type RootStackParamList = {
  Camera: undefined;
  TreeInformation: { treeId: string };
};

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [alignmentError, setAlignmentError] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePicture() {
    setImageUri(null);
    setAlignmentError(false);

    if (!cameraRef.current) {
      console.warn("Camera reference is null, retrying...");
      return;
    }

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (!photo.base64) throw new Error("Base64 conversion failed.");

      const { width, height } = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { base64: true }
      );

      if (width < 640 || height < 480) {
        setAlignmentError(true);
        Alert.alert("Camera Alignment", "Please align the camera properly to capture a clear image.");
        return;
      }

      setImageUri(photo.uri);

      const compressedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { base64: true }
      );

      if (!compressedImage.base64) throw new Error("Compressed image missing base64.");
      await sendToAI(compressedImage.base64);
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "Failed to capture image.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "You need to enable access to your gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setImageUri(selectedImage.uri);

      try {
        setLoading(true);
        const compressedImage = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 640 } }],
          { base64: true }
        );

        if (!compressedImage.base64) throw new Error("Compressed image missing base64.");
        await sendToAI(compressedImage.base64);
      } catch (error) {
        console.error("Upload error:", error);
        Alert.alert("Error", "Failed to process image.");
      } finally {
        setLoading(false);
      }
    }
  }

  const treeIdMap: { [key: string]: string } = {
    narra: "1",
    banaba: "2",
    ipil: "3",
    kamagong: "4",
    talisay: "5",
  };

  async function sendToAI(base64Image: string) {
    try {
      const response = await axios.post(
        "https://detect.roboflow.com/natreee/13",
        base64Image,
        {
          params: { api_key: "AbTTWufj54wj07u2ALrz" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const predictions = response.data?.predictions || [];
      const confidenceThreshold = 0.90;
      const knownTreeClasses = ["narra", "ipil", "banaba", "kamagong", "talisay","unknown"];
      const bestPrediction = predictions.find((prediction: any) =>
        prediction.confidence >= confidenceThreshold && knownTreeClasses.includes(prediction.class.toLowerCase())
      );

      if (bestPrediction) {
        const treeName = bestPrediction.class.toLowerCase();
        const treeId = treeIdMap[treeName];
        const sciNameMap: { [key: string]: string } = {
          narra: "Pterocarpus indicus",
          ipil: "Intsia bijuga",
          banaba: "Lagerstroemia speciosa",
          kamagong: "Diospyros philippinensis",
          talisay: "Terminalia catappa",
        };
        const sciName = sciNameMap[treeName];

        setAiResponse(treeName.charAt(0).toUpperCase() + treeName.slice(1));
        setConfidence(bestPrediction.confidence);
        setModalVisible(true);
        (Camera as any).currentTreeId = treeId;

        await addTreeToHistory({ treeId, tree_name: treeName, sci_name: sciName });
      } else {
        setAiResponse("Could not identify the tree. Please try a clearer image or a known tree.");
        setConfidence(null);
        setModalVisible(true);
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Failed to send image to AI model.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.topInstruction}>Make sure to align the leaf properly</Text>

      <View style={styles.imageWrapper}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {loading && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}
          </>
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        )}

        <View style={styles.overlay}>
          <View style={styles.squareContainer}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>

        {alignmentError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Please align the camera properly!</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={loading}>
            <LucideCamera size={32} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={loading}>
          <Upload size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            {/* Top Bar - always occupies same height */}
            <View style={styles.modalTopBar}>
              {/* Always reserve space for the header text */}
              <Text style={styles.modalTopText}>
                {aiResponse && aiResponse.toUpperCase() !== "UNKNOWN"
                  ? "Image captured is identified\nas native tree"
                  : ""}
              </Text>
              <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}>
                <Icon name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {aiResponse && (
                <>
                  {/* Tree Name - Always show */}
                  <Text style={styles.treeName}>{aiResponse.toUpperCase()}</Text>

                  {/* Content depending if known or unknown */}
                  {aiResponse.toUpperCase() === "UNKNOWN" ? (
                    <Text style={styles.modalText}>
                      Couldn't identify tree. Please try a clearer image or a known tree.
                    </Text>
                  ) : (
                    <>
                      {/* Scientific Name */}
                      <Text style={styles.sciName}>
                        {(() => {
                          const treeName = aiResponse.toLowerCase();
                          const sciNameMap: { [key: string]: string } = {
                            narra: "Pterocarpus indicus",
                            ipil: "Intsia bijuga",
                            banaba: "Lagerstroemia speciosa",
                            kamagong: "Diospyros philippinensis",
                            talisay: "Terminalia catappa",
                          };
                          return sciNameMap[treeName] ? `"${sciNameMap[treeName]}"` : "";
                        })()}
                      </Text>
                      {/* Confidence */}
                      {confidence !== null && (
                        <Text style={styles.confidenceText}>
                          Confidence: {(confidence * 100).toFixed(2)}%
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}

              {/* View button only if NOT UNKNOWN */}
              {aiResponse && aiResponse.toUpperCase() !== "UNKNOWN" && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate("TreeInformation", { treeId: (Camera as any).currentTreeId });
                  }}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Styles remain unchanged — continue using your existing `StyleSheet.create({...})`


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black", marginTop:-80 },
  message: { textAlign: "center", paddingBottom: 10, color: "white" },
 imageWrapper: {
  width: "100%",
  height: "65%",
  justifyContent: "flex-start", // move content to top
  marginTop: 0,
  alignItems: "center",
  borderRadius: 10,
  overflow: "hidden",
},

  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  camera: { flex: 1,width: "100%", height: "100%" },
  controlsContainer: { width: "100%", position: "absolute", bottom: 50, alignItems: "center" },
  captureButtonContainer: { justifyContent: "center", alignItems: "center" },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "gray",
  },
  uploadButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "gray",
    position: "absolute",
    left: "25%",
    bottom: 15,
  },
  buttonText: { color: "white", fontSize: 16 },
  permissionButton: { padding: 10, backgroundColor: "#739E57", borderRadius: 5 },
  banner: { marginBottom: 20, color: "white" },
  loadingOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "white", fontSize: 20, fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    width: "80%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalTopBar: {
    backgroundColor: "#3D6B41",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTopText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
  },
  closeIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 2,
    padding: 4,
  },
  modalBody: {
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  treeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3D6B41",
    marginTop: 4,
    marginBottom: 2,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  sciName: {
    fontSize: 15,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#3D6B41",
    marginBottom: 6,
    textAlign: "center",
    opacity: 0.7,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#56945c",
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: "#3D6B41",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 36,
    marginTop: 6,
    alignSelf: "center",
  },
  viewButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  errorOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: "white",
    fontWeight: "bold",
  },
  modalText: {
    fontSize: 16,
    color: "black",
    marginBottom: 10,
    textAlign: "center",
  },
  topInstruction: {
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 10,
    color: "white", // or "white" depending on your app theme
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  
  squareContainer: {
    width: 250, // Or whatever size you want the square to be
    height: 400,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: "white",
    borderTopLeftRadius: 25,   // <-- make tip rounded
  },
  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: "white",
    borderTopRightRadius: 25,   // <-- make tip rounded
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: "white",
    borderBottomLeftRadius: 25,  // <-- make tip rounded
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: "white",
    borderBottomRightRadius: 25,  // <-- make tip rounded
  },
  
});
