import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { Feather } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Import your background image
const backgroundImage = require("./assets/images/homescreen-background.png"); // Update path if needed

const SplashScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Wrapper View to apply border radius correctly */}
      <View style={styles.imageWrapper}>
        <ImageBackground 
          source={backgroundImage} 
          style={styles.background} 
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.titleWrapper}>
              <Text style={styles.welcomeText}>WELCOME TO</Text>
              <Text style={styles.title}>NATIVE</Text>
              <Text style={styles.title}>LENS</Text>
              <Text style={styles.subtitle}>Native Tree App Identifier</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Button floating on top */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("HomeScreen")}
      >
        {/* L Shape Top Left */}
        <View style={styles.lShapeTopLeft} />
        {/* Reverse L Shape Bottom Left */}
        <View style={styles.lShapeBottomLeft} />

        <Text style={styles.buttonText}>GET STARTED</Text>
        <Feather name="arrow-right" size={24} color="#234F1E" style={styles.arrowIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Full white background
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'absolute',
    marginTop: 35,
    marginLeft: 35,
    top: 0,
    left: 0,
    width: '100%',
    height: '96.5%',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden', // <-- THIS removes the gray edges!!
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.2)', // optional slight dark tint
  },
  titleWrapper: {
    marginTop: hp('10%'),
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 25,
    letterSpacing: 1,
    marginBottom: 5,
    fontFamily: 'PTSerif-Regular',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 70,
    fontWeight: 'bold',
    fontFamily: 'PTSerif-Bold',
    lineHeight: 70,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: 10,
    fontFamily: 'PTSerif-Regular',
  },
  button: {
    position: 'absolute',
    bottom: hp('7%'),
    alignSelf: 'center',
    width: wp('85%'),
    height: hp('7%'),
    backgroundColor: 'white',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center', // center the text
    alignItems: 'center',     // center the text
    zIndex: 10, // important for absolutely positioning inside
  },
  buttonText: {
    color: '#234F1E',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PTSerif-Bold',
  },
  arrowIcon: {
    position: 'absolute',
    right: 20,   // Push arrow close to right edge
    top: '50%',
    transform: [{ translateY: -12 }], // center the arrow vertically (because size is 24)
  },
  lShapeTopLeft: {
    position: 'absolute',
    top: hp('6.3%'), // right at the top edge of button
    left: wp('0.2%'), // small negative to pull a bit to left
    width: wp('5%'),
    height: hp('2.5%'),
    borderTopWidth: hp('0.8%'),
    borderLeftWidth: hp('0.8%'),
    borderColor: 'white',
    borderTopLeftRadius: wp('4%'),
    zIndex: 11,
  },
  lShapeBottomLeft: {
    position: 'absolute',
    bottom: hp('6.2s%'), // right at bottom edge of button
    left: wp('0.2.5%'),
    width: wp('5%'),
    height: hp('2.5%'),
    borderBottomWidth: hp('0.8%'),
    borderLeftWidth: hp('0.8%'),
    borderColor: 'white',
    borderBottomLeftRadius: wp('4%'),
    zIndex: 11,
  },
  
});

export default SplashScreen;
