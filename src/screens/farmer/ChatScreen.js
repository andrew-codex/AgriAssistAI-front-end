import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  SafeAreaView,
  Modal,
  Dimensions,
  Keyboard,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../../styles/theme";
import messageService from "../../services/messageService";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../context/AuthContext";
import { getStorageUrl } from "../../config/config";
import { USER_TYPES } from "../../utils/constants";
import { useRefresh } from "../../hooks/useRefresh";

const ChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const { userId, userName, userRole, detectionId } = route.params || {};

  // All hooks must be declared before any early return (Rules of Hooks)
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const flatListRef = useRef(null);

  const { refreshing, onRefresh } = useRefresh(async () => {
    if (userId && userName) {
      await loadMessages();
    }
  });

  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const scrollToEndAfterUpdate = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const isDAWorker = user?.role === USER_TYPES.DA_WORKER;

  // Early return for missing params — placed AFTER all hooks
  if (!route.params || (!userId && !userName)) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="message-circle"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.errorTitle}>Support Chat</Text>
          <Text style={styles.errorMessage}>
            {isDAWorker
              ? "To start a conversation, please select a user from the appropriate section."
              : "To chat with a DA Worker, please go to your diagnosis results and select 'Send to DA'."}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (!userId || !userName) {
      if (__DEV__) {
        console.error("Missing required params:", {
          userId,
          userName,
          detectionId,
        });
        console.error("route.params:", route.params);
      }
      return;
    }

    navigation.setOptions({
      title: "",
      headerStyle: {
        backgroundColor: colors.primary,
        elevation: 4,
        shadowOpacity: 0.3,
      },
      headerTintColor: "#FFF",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      ),
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons name="account" size={24} color="#FFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName || "Chat"}</Text>
            <Text style={styles.headerStatus}>
              {userRole === USER_TYPES.DA_WORKER
                ? "Development Advisor"
                : "Farmer"}
            </Text>
          </View>
        </View>
      ),
    });
    loadMessages();
  }, [navigation, userName, userId]);

  // H5: Poll for new messages every 15 seconds
  useEffect(() => {
    if (!userId || !userName) return;
    const interval = setInterval(() => {
      loadMessages(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [userId, userName, detectionId]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const response = await messageService.getConversation(
        userId,
        detectionId
      );

      if (__DEV__) console.log("Messages loaded:", response.data);

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        const formattedMessages = response.data.data.map((msg) => {
          let imageUrl = null;
          if (msg.image_url) {
            imageUrl = getStorageUrl(msg.image_url);
            if (__DEV__) console.log(
              "[ChatScreen] RAW image_url from API:",
              JSON.stringify(msg.image_url),
              "=> resolved:",
              imageUrl
            );
          }

          return {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            sender: {
              id: msg.sender_id,
              name: msg.sender_id === user?.id ? "You" : userName,
            },
            is_mine: msg.sender_id === user?.id,
            is_read: msg.is_read,
            image_url: imageUrl,
          };
        });
        setMessages(formattedMessages);

        // M9: Mark unread received messages as read
        const unreadReceived = response.data.data.filter(
          (msg) => msg.sender_id !== user?.id && !msg.is_read
        );
        for (const msg of unreadReceived) {
          try {
            await messageService.markAsRead(msg.id);
          } catch (e) {
            // Silently fail — non-critical
          }
        }
      } else {
        // H6: Show empty state instead of auto-sending an initial message
        setMessages([]);
      }

      scrollToEndAfterUpdate();
    } catch (error) {
      logError("Load Messages", error);
      if (!silent) {
        const errorMessage = getErrorMessage(
          error,
          "Unable to load chat history."
        );
        Alert.alert("Connection Error", errorMessage);
      }

      if (!silent) setMessages([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    let tempMsg = null;

    try {
      setSendingMessage(true);

      tempMsg = {
        id: generateMessageId(),
        content: messageText,
        created_at: new Date().toISOString(),
        sender: { id: user?.id, name: "You" },
        is_mine: true,
      };

      setMessages((prev) => [...prev, tempMsg]);
      setNewMessage("");


      const response = await messageService.sendMessage(
        userId,
        messageText,
        detectionId || null
      );

      if (response.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMsg.id
              ? {
                  ...response.data.data,
                  sender: { id: response.data.data.sender_id, name: "You" },
                  is_mine: true,
                }
              : msg
          )
        );
      } else {
        logError("Send Message Response", new Error("Failed response"));
        Alert.alert("Error", "Failed to send message. Please try again.");
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMsg.id));
      }

      scrollToEndAfterUpdate();
    } catch (error) {
      logError("Send Message", error);
      const errorMessage = getErrorMessage(error, "Failed to send message.");
      Alert.alert("Error", errorMessage);

      if (tempMsg) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMsg.id));
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        sendImageMessage(result.assets[0]);
      }
    } catch (error) {
      if (__DEV__) console.error("Image picker error:", error);
      logError("Pick Image", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const sendImageMessage = async (imageAsset) => {
    try {
      setSendingMessage(true);

      const tempImageMsg = {
        id: generateMessageId(),
        content: "[Image]",
        image_url: imageAsset.uri,
        created_at: new Date().toISOString(),
        sender: { id: user?.id, name: "You" },
        is_mine: true,
      };

      setMessages((prev) => [...prev, tempImageMsg]);

      const imageFile = {
        uri: imageAsset.uri,
        type: "image/jpeg",
        name: `image_${Date.now()}.jpg`,
      };

      const response = await messageService.sendMessage(
        userId,
        "[Image]",
        detectionId || null,
        imageFile
      );

      if (__DEV__) console.log("Image upload response:", response.data);

      if (response.data.success) {
        let imageUrl = imageAsset.uri;
        if (response.data.data.image_url) {
          imageUrl = getStorageUrl(response.data.data.image_url);
          if (__DEV__) console.log("Constructed image URL:", imageUrl);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempImageMsg.id
              ? {
                  ...response.data.data,
                  sender: { id: response.data.data.sender_id, name: "You" },
                  is_mine: true,
                  image_url: imageUrl,
                }
              : msg
          )
        );
      } else {
        logError("Send Image Response", new Error("Failed response"));
        Alert.alert("Error", "Failed to send image. Please try again.");

        setMessages((prev) => prev.filter((msg) => msg.id !== tempImageMsg.id));
      }

      scrollToEndAfterUpdate();
    } catch (error) {
      logError("Send Image", error);
      const errorMessage = getErrorMessage(error, "Failed to send image.");
      Alert.alert("Error", errorMessage);

      setMessages((prev) => prev.filter((msg) => msg.id !== tempImageMsg.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageWrapper,
        item.is_mine ? styles.myMessageWrapper : styles.otherMessageWrapper,
      ]}>
      <View
        style={[
          styles.messageContainer,
          item.is_mine ? styles.myMessage : styles.otherMessage,
        ]}>
        {!item.is_mine && !item.is_read && (
          <View style={styles.unreadIndicator} />
        )}
        {!item.is_mine && (
          <Text style={styles.senderName}>{item.sender.name}</Text>
        )}

        {item.image_url && (
          <TouchableOpacity onPress={() => setPreviewImage(item.image_url)}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.messageImage}
            />
          </TouchableOpacity>
        )}

        {item.content && item.content !== "[Image]" && (
          <Text
            style={[
              styles.messageText,
              item.is_mine ? styles.myMessageText : styles.otherMessageText,
            ]}>
            {item.content}
          </Text>
        )}

        <Text
          style={[
            styles.messageTime,
            item.is_mine ? styles.myMessageTime : styles.otherMessageTime,
          ]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyConversation}>
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={48}
                  color={colors.grayLight || "#ccc"}
                />
                <Text style={styles.emptyConversationTitle}>
                  Start the conversation!
                </Text>
                <Text style={styles.emptyConversationText}>
                  Send a message below to begin chatting with {userName}.
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </View>

      <View
        style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[
            styles.imageButton,
            sendingMessage && styles.imageButtonDisabled,
          ]}
          onPress={pickImage}
          disabled={sendingMessage}>
          <MaterialCommunityIcons
            name="camera"
            size={24}
            color={sendingMessage ? "#CCC" : colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
            editable={!sendingMessage}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sendingMessage}>
          {sendingMessage ? (
            <MaterialCommunityIcons name="loading" size={20} color="#FFF" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={!newMessage.trim() ? "#999" : "#FFF"}
            />
          )}
        </TouchableOpacity>
      </View>

      
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={() => setPreviewImage(null)}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setPreviewImage(null)}>
                <Ionicons name="close" size={30} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: previewImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#FFF",
    fontSize: fonts.sizes.md,
    fontWeight: "600",
  },
  headerStatus: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: fonts.sizes.xs,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyConversation: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyConversationTitle: {
    fontSize: fonts.lg,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyConversationText: {
    fontSize: fonts.sm,
    color: colors.textLight || "#888",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  messageWrapper: {
    marginVertical: spacing.xs,
  },
  myMessageWrapper: {
    alignItems: "flex-end",
  },
  otherMessageWrapper: {
    alignItems: "flex-start",
  },
  messageContainer: {
    maxWidth: "80%",
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    position: "relative",
  },
  unreadIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F44336",
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  otherMessage: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: borderRadius.xs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderName: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  messageText: {
    fontSize: fonts.sizes.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFF",
  },
  otherMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  imageButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "#F3F4F6",
  },
  imageButtonDisabled: {
    backgroundColor: "#F9FAFB",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  textInput: {
    fontSize: fonts.sizes.md,
    maxHeight: 100,
    minHeight: 40,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    marginLeft: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    width: 44,
    height: 44,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  modalCloseArea: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: spacing.sm,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "600",
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: fonts.sizes.md,
    fontWeight: "600",
  },
});

export default ChatScreen;
