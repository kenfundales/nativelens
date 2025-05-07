import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import { Camera as LucideCamera, Upload } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, Modal, ScrollView } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { addTreeToHistory } from "../../History";
import Icon from "react-native-vector-icons/MaterialIcons";
import LeafOverlay from "../../assets/images/leaf-transparent.png"; 
import { Animated } from "react-native";




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
  const [guidelineModalVisible, setGuidelineModalVisible] = useState(true);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [alignmentError, setAlignmentError] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [flash, setFlash] = useState<"off" | "on">("off");
  const leafOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(leafOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    },10000);
  
    return () => clearTimeout(timer);
  }, []);
  

  useEffect(() => {
    requestPermission();
  }, []);

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

  const toggleFlash = () => {
    if (!cameraRef.current) {
      Alert.alert("Error", "Camera not ready");
      return;
    }
    const newFlashMode = flash === "off" ? "on" : "off";
    setFlash(newFlashMode);
  };

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

      const compressedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { base64: true }
      );

      if (compressedImage.width < 640 || compressedImage.height < 480) {
        setAlignmentError(true);
        Alert.alert("Camera Alignment", "Please align the camera properly to capture a clear image.");
        return;
      }

      setImageUri(photo.uri);
      await sendToAI(compressedImage.base64!);
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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setImageUri(selectedImage.uri);

      try {
        setLoading(true);
        const compressedImage = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: 720 } }],
          { base64: true }
        );
        await sendToAI(compressedImage.base64!);
      } catch (error) {
        console.error("Upload error:", error);
        Alert.alert("Error", "Failed to process image.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function sendToAI(base64Image: string) {
    try {
      const response = await axios.post(
        "https://detect.roboflow.com/natreee/15",
        base64Image,
        {
          params: { api_key: "AbTTWufj54wj07u2ALrz" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

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
        setModalVisible(true);

        if (treeName !== "unknown") {
          const treeId = treeIdMap[treeName];
          (Camera as any).currentTreeId = treeId;
          await addTreeToHistory({
            treeId,
            tree_name: treeName,
            sci_name: sciNameMap[treeName],
          });
        }
      } else {
        setAiResponse("Unknown");
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
      <View style={styles.topInstructionContainer}>
        <Text style={styles.topInstruction}>
          Make sure to align the leaf properly
        </Text>
      </View>

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
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            flash={flash}
          />
        )}

      <View style={styles.overlay}>
        <View style={styles.squareContainer}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        <Animated.Image
            source={require("../../assets/images/leaf-transparent.png")}
            style={[styles.leafOverlay, { opacity: leafOpacity }]}
            resizeMode="contain"
          />
      </View>


        {alignmentError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Please align the camera properly!</Text>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.captureButtonContainer}>
          {/* <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={loading}>
            <Upload size={24} color="black" />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={loading}>
            <LucideCamera size={32} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Icon name={flash === "on" ? "flash-on" : "flash-off"} size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* GUIDELINE MODAL */}
      <Modal visible={guidelineModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.guidelineCard}>
            <Text style={styles.modalTText}>BEFORE CAPTURING A LEAF</Text>
            <ScrollView style={{ marginTop: 10 }}>
              <Text style={styles.modalText}>• Ensure proper lighting for leaf visibility.</Text>
              <Text style={styles.modalText}>• Center the leaf within the frame.</Text>
              <Text style={styles.modalText}>• Use camera or gallery to upload an image.</Text>
              <Text style={styles.modalText}>• Avoid blurry or cluttered backgrounds.</Text>
              <Text style={styles.modalBText}>• Focus on a single leaf — avoid multiple leaves in the frame.</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => setGuidelineModalVisible(false)}
            >
              <Text style={styles.viewButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI RESULT MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopBar}>
              {aiResponse && aiResponse.toUpperCase() !== "UNKNOWN" ? (
                <Text style={styles.modalTopText}>Image captured is identified{'\n'}as native tree</Text>
              ) : (
                <Text style={styles.modalTopText}></Text>
              )}
              <TouchableOpacity style={styles.closeIcon} onPress={() => {
                setModalVisible(false);
                setImageUri(null);
              }}>
                <Icon name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {aiResponse && (
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

              {aiResponse && aiResponse.toUpperCase() !== "UNKNOWN" && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => {
                    setModalVisible(false);
                    setImageUri(null);
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

// Styling
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" },
  message: { 
    textAlign: "center", 
    paddingBottom: 10, 
    color: "white" 
},
  permissionButton: { 
    padding: 10, 
    backgroundColor: "#739E57",
     borderRadius: 5 
    },
  buttonText: { 
    color: "white", 
    fontSize: 16
   },
  imageWrapper: { 
    width: "100%", 
    height: "60%", 
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 10, 
    overflow: "hidden",
    marginBottom: 60,
  },
  imagePreview: {
     width: "100%",
    height: "100%",
    resizeMode: "cover"
       },
  camera: { 
    flex: 1,
     width: "100%", 
     height: "100%"
     },
  controlsContainer: { 
    width: "100%", 
    alignItems: "center"
     },
  captureButtonContainer: {
    flexDirection: "row", // <--- Add this to arrange children in a row
    justifyContent: "space-around", // or "space-between" or "center"
    alignItems: "center",
    paddingLeft: 60,
  },
  captureButton: { 
    width: 90,
     height: 90, 
     justifyContent: "center", 
     alignItems: "center", 
     backgroundColor: "white", 
     borderRadius: 100, borderWidth: 2,
    borderColor: "gray",
    marginLeft: 30, // optional for spacing
    marginRight: 30, // optional for spacing
   },
  uploadButton: { 
    width: 60, height: 60, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "white", 
    borderRadius: 50, 
    borderWidth: 2, 
    borderColor: "gray", 
    },
  flashButton: { 
    width: 60, height: 60, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "white", 
    borderRadius: 50, 
    borderWidth: 2, 
    borderColor: "gray", 
    },
  loadingOverlay: { 
    position: "absolute",
     width: "100%",
      height: "100%", 
      backgroundColor: "rgba(0, 0, 0, 0.6)", 
      justifyContent: "center", 
      alignItems: "center" 
    },
  loadingText: {
    color: "white", 
    fontSize: 20,
    fontFamily: "LeagueSpartan-Light",
    },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  squareContainer: { 
    width: 250, 
    height: 400, 
    position: "relative" },
  cornerTopLeft: { 
    position: "absolute",
    top: 0, 
    left: 0, 
    width: 50, 
    height: 50, 
    borderTopWidth: 5, 
    borderLeftWidth: 5, 
    borderColor: "white", 
    borderTopLeftRadius: 25 
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
     borderTopRightRadius: 25 
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
    borderBottomLeftRadius: 25
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
     borderBottomRightRadius: 25 
  },
  errorOverlay: { 
    position: "absolute", 
    top: 10, 
    left: 10, 
    backgroundColor: "rgba(255, 0, 0, 0.6)", 
    padding: 10, 
    borderRadius: 5 
  },
  errorText: { 
    color: "white", 
    fontWeight: "bold" 
  },
  topInstructionContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  topInstruction: {
    fontSize:  18,
    fontFamily: "LeagueSpartan-Bold",
    color: "white",
    textAlign: "center",
  },
  modalCard: { width: "80%", borderRadius: 18, overflow: "hidden", backgroundColor: "white", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
  modalTopBar: { backgroundColor: "#3D6B41", paddingVertical: 10, paddingHorizontal: 35, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalBody: { alignItems: "center", paddingVertical: 18, paddingHorizontal: 12, backgroundColor: "rgba(255,255,255,0.85)" },
  treeName: { fontSize: 22, color: "#3D6B41", marginTop: 4, marginBottom: 2, textAlign: "center", fontFamily: "LeagueSpartan-Bold", },
  sciName: { fontSize: 15, fontFamily: "PTSerif-Italic", color: "#3D6B41", marginBottom: 6, textAlign: "center", opacity: 0.7 },
  confidenceText: { fontSize: 14,fontFamily: "LeagueSpartan-Light", color: "#56945c", textAlign: "center", opacity: 0.8, marginBottom: 12 },
  modalSubText: { fontSize: 16, fontFamily: "LeagueSpartan-Regular",color: "black", marginBottom: 10, textAlign: "center" },
  closeIcon: { position: "absolute", right: 12, top: 12, zIndex: 2, padding: 4 },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  guidelineCard: {
    width: "90%",
    backgroundColor: "#2e2e2e",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTopText: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
    fontFamily: "LeagueSpartan-Regular",
    flex: 1,
  },
  modalTText: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "LeagueSpartan-Bold",
  },
  modalText: {
    fontFamily: "LeagueSpartan-Regular",
    fontSize: 15,
    color: "white",
    marginBottom: 8,
  },
  modalBText: {
    fontSize: 15,
    fontFamily: "LeagueSpartan-Bold",
    color: "white",
    marginBottom: 8,
  },
  viewButton: {
    marginTop: 20,
    backgroundColor: "#739E57",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  viewButtonText: {
    fontFamily: "LeagueSpartan-Light",
    color: "white",
    fontSize: 16,
  },
  leafOverlay: {
    width: 400,
    height: 500,
    position: "absolute",
    opacity: 0.3,
    zIndex: 1,
  },
  
});