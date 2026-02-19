import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import InputField from "../../components/InputField";
import ButtonPrimary from "../../components/ButtonPrimary";
import { colors, fonts, spacing } from "../../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as api from "../../services/api";
import { getErrorMessage, logError } from "../../utils/errorHandler";

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params]);

  const validatePassword = () => {
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }
    if (password !== passwordConfirmation) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!email || !otp || !password || !passwordConfirmation) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      console.log("Reset password payload:", {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });
      const otpToSend = String(otp).trim();
      const response = await api.resetPasswordRequest(
        email,
        otpToSend,
        password,
        passwordConfirmation
      );
      Alert.alert("Success", "Your password has been reset successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      logError("ResetPassword", error);
      if (__DEV__)
        console.debug("Reset password full error:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      const userMessage = getErrorMessage(
        error,
        "Failed to reset password. Please try again."
      );
      Alert.alert("Error", userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Ionicons
              name="key-outline"
              size={60}
              color={colors.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>Enter OTP Code</Text>
            <Text style={styles.subtitle}>
              Please enter the 6-digit OTP code sent to your email and create a
              new password.
            </Text>

            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              editable={!loading && !route.params?.email}
            />

            <InputField
              label="OTP Code"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
              editable={!loading}
            />

            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              editable={!loading}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <InputField
              label="Confirm Password"
              placeholder="Confirm new password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              editable={!loading}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />

            <ButtonPrimary
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handleResetPassword}
              disabled={
                !email || !otp || !password || !passwordConfirmation || loading
              }
              style={styles.button}
            />

            <TouchableOpacity
              style={styles.resendLink}
              onPress={handleResendOtp}
              disabled={loading}>
              <Text style={styles.resendText}>
                Didn't receive OTP? Send again
              </Text>
            </TouchableOpacity>

            <View style={styles.otpInfo}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.otpInfoText}>OTP expires in 10 minutes</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginTop: spacing.lg,
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
    marginBottom: spacing.md,
  },
  button: {
    width: "100%",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  resendLink: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  resendText: {
    color: colors.primary,
    fontSize: fonts.sizes.md,
    textDecorationLine: "underline",
  },
  otpInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  otpInfoText: {
    color: colors.primary,
    fontSize: fonts.sizes.sm,
    marginLeft: spacing.xs,
  },
});

export default ResetPasswordScreen;
