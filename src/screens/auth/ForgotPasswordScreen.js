import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from "react-native";
import InputField from "../../components/InputField";
import ButtonPrimary from "../../components/ButtonPrimary";
import { colors, fonts, spacing } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { forgotPasswordRequest } from "../../services/api";
import { getErrorMessage, logError } from "../../utils/errorHandler";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPasswordRequest(email);
      navigation.navigate("ResetPassword", { email: email });

 
      Alert.alert(
        "OTP Sent",
        "An OTP has been sent to your email. Please check your inbox."
      );
    } catch (error) {
      logError("ForgotPassword", error);
      if (__DEV__)
        console.debug("Forgot password full error:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      const userMessage = getErrorMessage(
        error,
        "Failed to send OTP. Please try again."
      );
      const serverData = error.response?.data;
      if (serverData?.errors?.email) {
        const joined = Array.isArray(serverData.errors.email)
          ? serverData.errors.email.join("\n")
          : String(serverData.errors.email);
        const lowered = joined.toLowerCase();
        if (
          lowered.includes("exists") ||
          lowered.includes("not found") ||
          lowered.includes("invalid")
        ) {
          Alert.alert(
            "Error",
            "This email is not registered. Please check and try again."
          );
        } else {
          Alert.alert("Error", userMessage);
        }
      } else {
        Alert.alert("Error", userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>
      <View style={styles.content}>
        <Ionicons
          name="mail-outline"
          size={60}
          color={colors.primary}
          style={styles.icon}
        />
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you an OTP to reset your
          password.
        </Text>
        <InputField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          editable={!loading}
        />
        <ButtonPrimary
          title={loading ? "Sending OTP..." : "Send OTP"}
          onPress={handleSubmit}
          disabled={!email || loading}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 40,
    paddingBottom: spacing.lg,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: "700",
    color: colors.text,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  icon: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  input: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  button: {
    width: "100%",
    marginBottom: spacing.md,
  },
});

export default ForgotPasswordScreen;
