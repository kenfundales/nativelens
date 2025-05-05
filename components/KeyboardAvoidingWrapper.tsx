import React from "react";
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  View,
  StyleSheet,
} from "react-native";

const KeyboardAvoidingWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback
        onPress={Keyboard.dismiss}
        accessible={false} // Ensures other interactive elements (buttons, inputs) still work
      >
        <View style={styles.innerContainer}>{children}</View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});

export default KeyboardAvoidingWrapper;
