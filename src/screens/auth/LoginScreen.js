import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
} from "../../styles/theme";
import InputField from "../../components/InputField";
import ButtonPrimary from "../../components/ButtonPrimary";
import { AuthContext } from "../../context/AuthContext";
import { getErrorMessage, logError } from "../../utils/errorHandler";

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [userType, setUserType] = useState("farmers");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password, userType);
    } catch (error) {
      logError('Login', error);
      const errorMessage = getErrorMessage(error, 'Login failed. Please try again.');
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="leaf" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.logoText}>AgriAssist AI</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  userType === "farmers" && styles.toggleButtonActive,
                ]}
                onPress={() => setUserType("farmers")}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.toggleText,
                    userType === "farmers" && styles.toggleTextActive,
                  ]}>
                  Farmer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  userType === "DA_workers" && styles.toggleButtonActive,
                ]}
                onPress={() => setUserType("DA_workers")}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.toggleText,
                    userType === "DA_workers" && styles.toggleTextActive,
                  ]}>
                  DA Worker
                </Text>
              </TouchableOpacity>
            </View>

            <InputField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: null });
                }
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: null });
                }
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <ButtonPrimary
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.signInButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
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
    backgroundColor: colors.backgroundGradientStart,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.backgroundGradientStart,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    ...shadows.medium,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "700",
    color: colors.primary,
  },
  formSection: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    ...shadows.light,
  },
  welcomeText: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.grayLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    ...shadows.light,
  },
  toggleIcon: {
    marginRight: spacing.xs,
  },
  toggleText: {
    fontSize: fonts.sizes.md,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  forgotPasswordText: {
    fontSize: fonts.sizes.md,
    color: colors.primary,
    fontWeight: "500",
  },
  signInButton: {
    marginBottom: spacing.lg,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: fonts.sizes.md,
    color: colors.primary,
    fontWeight: "600",
  },
});

export default LoginScreen;
