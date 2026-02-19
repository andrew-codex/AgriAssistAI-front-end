import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import { Image } from "expo-image";

const { width: screenWidth } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
} from "../../styles/theme";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { logError } from "../../utils/errorHandler";
import { formatTimeRemaining } from "../../utils/rateLimitHelpers";

const UploadDiagnosisScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { token, rateLimit, updateRateLimit } = useContext(AuthContext);

  const [diagnosisMode, setDiagnosisMode] = useState("image");
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropType, setCropType] = useState("");
  const [notes, setNotes] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);

  const diagnosisModes = [
    {
      id: "image",
      label: "Image",
      icon: "camera",
      description: "Upload a photo",
    },
    {
      id: "text",
      label: "Describe",
      icon: "chatbubble-ellipses",
      description: "Text only",
    },
    { id: "both", label: "Both", icon: "images", description: "Image + Text" },
  ];

  const cropTypes = [
    { id: "rice", label: "Rice" },
    { id: "corn", label: "Corn" },
    { id: "tomato", label: "Tomato" },
    { id: "eggplant", label: "Eggplant" },
    { id: "banana", label: "Banana" },
    { id: "wheat", label: "Wheat" },
    { id: "potato", label: "Potato" },
    { id: "other", label: "Other" },
  ];

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos.",
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Gallery permission is needed to select photos.",
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log("Selected image URI:", uri);
        setSelectedImage(uri);
      }
    } catch (err) {
      logError("Open Camera", err);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handlePickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log("Selected image URI:", uri);
        setSelectedImage(uri);
      }
    } catch (err) {
      logError("Open Gallery", err);
      Alert.alert("Error", "Failed to open gallery. Please try again.");
    }
  };

  const handleAnalyzeCrop = async () => {
    if (diagnosisMode === "image" && !selectedImage) {
      Alert.alert("Missing Image", "Please select or take a photo.");
      return;
    }
    if (diagnosisMode === "text" && !problemDescription.trim()) {
      Alert.alert(
        "Missing Description",
        "Please describe the problem you are experiencing.",
      );
      return;
    }
    if (
      diagnosisMode === "both" &&
      (!selectedImage || !problemDescription.trim())
    ) {
      Alert.alert(
        "Missing Information",
        "Please provide both an image and description.",
      );
      return;
    }
    if (!cropType) {
      Alert.alert("Missing Crop Type", "Please select a crop type.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      if (
        selectedImage &&
        (diagnosisMode === "image" || diagnosisMode === "both")
      ) {
        const imageUri = selectedImage;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("image", {
          uri:
            Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri,
          name: filename || "crop_image.jpg",
          type: type,
        });
      }

      formData.append("crop_type", cropType);
      formData.append("diagnosis_mode", diagnosisMode);
      formData.append("status", "pending_review");

      if (problemDescription.trim()) {
        formData.append("description", problemDescription.trim());
      }

      if (notes.trim()) {
        formData.append("notes", notes.trim());
      }

      const response = await api.post("/diagnosis", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        const detection = response.data.data;

        // Update rate limit info if present
        if (response.data.rate_limit) {
          updateRateLimit(response.data.rate_limit);
        }

        navigation.navigate("DiagnosisResult", {
          result: detection,
          imageUri: selectedImage,
        });

        handleReset();
      }
    } catch (err) {
      // Handle rate limit exceeded (429)
      if (err.response?.status === 429) {
        const errorData = err.response.data;
        setRateLimitError({
          message: errorData.message || "Daily diagnosis limit reached",
          limit: errorData.limit || 5,
          remaining: errorData.remaining || 0,
          retryAfterSeconds: errorData.retry_after_seconds,
          retryAfterHuman: errorData.retry_after_human,
        });

        // Update context with error state
        if (
          errorData.limit !== undefined &&
          errorData.remaining !== undefined
        ) {
          updateRateLimit({
            limit: errorData.limit,
            remaining: errorData.remaining,
            retry_after_seconds: errorData.retry_after_seconds,
          });
        }

        setShowRateLimitModal(true);
      } else {
        // Handle other errors
        const defaultErrorMessage =
          diagnosisMode === "text"
            ? "Failed to analyze description. Please try again."
            : diagnosisMode === "both"
              ? "Failed to analyze image and description. Please try again."
              : "Failed to analyze image. Please try again.";
        const errorMessage = err.response?.data?.message || defaultErrorMessage;
        Alert.alert("Analysis Failed", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCropType("");
    setNotes("");
    setProblemDescription("");
  };

  const isFormValid = () => {
    if (!cropType) return false;
    if (diagnosisMode === "image") return !!selectedImage;
    if (diagnosisMode === "text") return !!problemDescription.trim();
    if (diagnosisMode === "both")
      return !!selectedImage && !!problemDescription.trim();
    return false;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Diagnosis</Text>
          <Text style={styles.headerSubtitle}>
            {diagnosisMode === "text"
              ? "Describe your crop problem"
              : diagnosisMode === "both"
                ? "Upload photo and describe issue"
                : "Upload a photo to analyze"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Rate Limit Info Banner */}
      {rateLimit.remaining !== null &&
        rateLimit.remaining < rateLimit.limit && (
          <View style={styles.rateLimitBanner}>
            <Ionicons name="information-circle" size={20} color="#1976D2" />
            <Text style={styles.rateLimitText}>
              {rateLimit.remaining > 0
                ? `${rateLimit.remaining}/${rateLimit.limit} diagnoses remaining today`
                : "Daily limit reached"}
            </Text>
          </View>
        )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.modeSection}>
          <Text style={styles.modeSectionTitle}>
            How would you like to diagnose?
          </Text>
          <View style={styles.modeContainer}>
            {diagnosisModes.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeButton,
                  diagnosisMode === mode.id && styles.modeButtonActive,
                ]}
                onPress={() => setDiagnosisMode(mode.id)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.modeIconContainer,
                    diagnosisMode === mode.id && styles.modeIconContainerActive,
                  ]}>
                  <Ionicons
                    name={mode.icon}
                    size={24}
                    color={diagnosisMode === mode.id ? "#FFF" : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.modeLabel,
                    diagnosisMode === mode.id && styles.modeLabelActive,
                  ]}>
                  {mode.label}
                </Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {(diagnosisMode === "image" || diagnosisMode === "both") && (
          <>
            <View style={styles.imagePickerSection}>
              {selectedImage ? (
                <>
                  <Image
                    source={selectedImage}
                    style={{
                      width: "100%",
                      height: 220,
                      borderRadius: 12,
                      backgroundColor: "#ccc",
                    }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 26,
                      backgroundColor: "#fff",
                      borderRadius: 14,
                    }}
                    onPress={() => setSelectedImage(null)}>
                    <Ionicons name="close-circle" size={28} color="#F44336" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.uploadIconContainer}>
                    <Ionicons
                      name="camera-outline"
                      size={40}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.uploadTitle}>Tap to take a photo</Text>
                  <Text style={styles.uploadSubtitle}>
                    or upload from gallery
                  </Text>
                </View>
              )}
            </View>

            {selectedImage && (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.primary,
                  marginBottom: 8,
                }}>
                Image selected
              </Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={20} color={colors.text} />
                <Text style={styles.pickerButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handlePickFromGallery}
                activeOpacity={0.7}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.pickerButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {(diagnosisMode === "text" || diagnosisMode === "both") && (
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Describe the Problem *</Text>
            </View>

            <TextInput
              style={styles.problemInput}
              placeholder="Describe what you're observing with your crop...&#10;&#10;Examples:&#10;• Yellow spots appearing on leaves&#10;• Leaves are wilting despite watering&#10;• Small insects on the underside of leaves&#10;• Brown patches spreading on stems"
              placeholderTextColor={colors.textSecondary}
              value={problemDescription}
              onChangeText={setProblemDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {problemDescription.length}/500 characters
            </Text>
          </View>
        )}

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Crop Type</Text>
          </View>

          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCropPicker(!showCropPicker)}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.dropdownText,
                !cropType && styles.dropdownPlaceholder,
              ]}>
              {cropType
                ? cropTypes.find((c) => c.id === cropType)?.label
                : "Select crop type..."}
            </Text>
            <Ionicons
              name={showCropPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCropPicker && (
            <View style={styles.dropdownOptions}>
              {cropTypes.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.dropdownOption,
                    cropType === crop.id && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setCropType(crop.id);
                    setShowCropPicker(false);
                  }}>
                  <MaterialCommunityIcons
                    name={crop.icon}
                    size={20}
                    color={
                      cropType === crop.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      cropType === crop.id && styles.dropdownOptionTextSelected,
                    ]}>
                    {crop.label}
                  </Text>
                  {cropType === crop.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Describe any symptoms or observations..."
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!isFormValid() || isLoading) && styles.analyzeButtonDisabled,
          ]}
          onPress={handleAnalyzeCrop}
          disabled={!isFormValid() || isLoading}
          activeOpacity={0.8}>
          <MaterialCommunityIcons
            name="leaf-circle"
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.analyzeButtonText}>
            {diagnosisMode === "text" ? "Get Diagnosis" : "Analyze Crop"}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>
            {diagnosisMode === "text" ? "💡 Description Tips" : "📸 Photo Tips"}
          </Text>
          {diagnosisMode === "text" ? (
            <>
              <Text style={styles.tipText}>
                • Be specific about symptoms you observe
              </Text>
              <Text style={styles.tipText}>
                • Mention when the problem started
              </Text>
              <Text style={styles.tipText}>
                • Describe the affected parts (leaves, stem, roots)
              </Text>
              <Text style={styles.tipText}>
                • Include any recent changes (weather, watering)
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.tipText}>• Take clear, well-lit photos</Text>
              <Text style={styles.tipText}>
                • Focus on affected areas of the plant
              </Text>
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full-screen Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {diagnosisMode === "text"
                ? "Analyzing description..."
                : "Analyzing image..."}
            </Text>
            <Text style={styles.loadingSubtext}>
              Please wait, this may take a few moments
            </Text>
          </View>
        </View>
      )}

      {/* Rate Limit Exceeded Modal */}
      <Modal
        visible={showRateLimitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRateLimitModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.rateLimitModalCard}>
            <View style={styles.rateLimitModalIcon}>
              <Ionicons name="time-outline" size={48} color="#FF9800" />
            </View>

            <Text style={styles.rateLimitModalTitle}>Daily Limit Reached</Text>

            <Text style={styles.rateLimitModalMessage}>
              {rateLimitError?.message ||
                "You have reached your daily diagnosis limit of 5 submissions."}
            </Text>

            {rateLimitError?.retryAfterSeconds && (
              <View style={styles.rateLimitTimeBox}>
                <Ionicons name="refresh-outline" size={20} color="#EF6C00" />
                <Text style={styles.rateLimitTimeText}>
                  Resets in{" "}
                  {formatTimeRemaining(rateLimitError.retryAfterSeconds)}
                </Text>
              </View>
            )}

            <Text style={styles.rateLimitSuggestion}>
              Need immediate help? Contact a DA Worker for expert assistance.
            </Text>

            <View style={styles.rateLimitModalButtons}>
              <TouchableOpacity
                style={styles.rateLimitContactButton}
                onPress={() => {
                  setShowRateLimitModal(false);
                  navigation.navigate("Support");
                }}
                activeOpacity={0.8}>
                <Text style={styles.rateLimitContactButtonText}>
                  Contact DA Support
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rateLimitCloseButton}
                onPress={() => setShowRateLimitModal(false)}
                activeOpacity={0.8}>
                <Text style={styles.rateLimitCloseButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#F8F9FA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  modeSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  modeSectionTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  modeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "#F0F7F0",
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  modeIconContainerActive: {
    backgroundColor: colors.primary,
  },
  modeLabel: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginTop: 4,
  },
  modeLabelActive: {
    color: colors.primary,
  },
  modeDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  imagePickerSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  uploadPlaceholder: {
    backgroundColor: "#F0F7F0",
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  imagePreviewContainer: {
    width: screenWidth - spacing.lg * 2,
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#D0D0D0",
  },
  imagePreview: {
    width: screenWidth - spacing.lg * 2,
    height: 220,
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 2,
    zIndex: 10,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.light,
  },
  pickerButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: "500",
    color: colors.text,
    marginLeft: spacing.sm,
  },

  inputSection: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.xs,
  },

  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    fontSize: fonts.sizes.md,
    color: colors.text,
  },
  dropdownPlaceholder: {
    color: colors.textSecondary,
  },
  dropdownOptions: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownOptionSelected: {
    backgroundColor: "#E8F5E9",
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },

  problemInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.text,
    minHeight: 150,
    lineHeight: 22,
  },
  charCount: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },

  notesInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.text,
    minHeight: 80,
  },

  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
    ...shadows.medium,
  },
  analyzeButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  analyzeButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  resultContainer: {
    marginTop: spacing.xl,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  pendingReviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  pendingReviewText: {
    fontSize: fonts.sizes.sm,
    color: "#F57C00",
    marginLeft: spacing.xs,
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.light,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  resultLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  categoryBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: "#1976D2",
    textTransform: "capitalize",
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  confidenceContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  confidenceLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  confidenceBarBg: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
    textAlign: "right",
  },

  solutionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.light,
  },
  organicCard: {
    borderLeftColor: "#4CAF50",
  },
  chemicalCard: {
    borderLeftColor: "#FF9800",
  },
  preventionCard: {
    borderLeftColor: "#2196F3",
  },
  solutionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  solutionText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  tipsSection: {
    backgroundColor: "#E8F5E9",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  tipsTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: fonts.sizes.sm,
    color: "#2E7D32",
    marginBottom: 4,
    lineHeight: 20,
  },

  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  resetButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: spacing.sm,
  },

  fallbackContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  fallbackIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  fallbackTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: "#F57C00",
    marginBottom: spacing.sm,
  },
  fallbackText: {
    fontSize: fonts.sizes.sm,
    color: "#795548",
    textAlign: "center",
    lineHeight: 20,
  },

  
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingCard: {
    backgroundColor: "#FFF",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    minWidth: 200,
    ...shadows.medium,
  },
  loadingText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },


  rateLimitBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  rateLimitText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: "#1565C0",
    fontWeight: "500",
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  rateLimitModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.medium,
  },
  rateLimitModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  rateLimitModalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  rateLimitModalMessage: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  rateLimitTimeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  rateLimitTimeText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: "#EF6C00",
  },
  rateLimitSuggestion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  rateLimitModalButtons: {
    width: "100%",
    gap: spacing.sm,
  },
  rateLimitContactButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  rateLimitContactButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  rateLimitCloseButton: {
    backgroundColor: "#F5F5F5",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  rateLimitCloseButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
});

export default UploadDiagnosisScreen;
