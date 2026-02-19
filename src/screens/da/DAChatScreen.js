import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, fonts, spacing, borderRadius } from '../../styles/theme';
import messageService from '../../services/messageService';
import { AuthContext } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRefresh } from '../../hooks/useRefresh';
import { USER_TYPES } from '../../utils/constants';

const DAChatScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { refreshing, onRefresh } = useRefresh(async () => {
    await loadConversations();
  });

  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messageService.getConversations();
      
      if (response.data.success) {
        setConversations(response.data.data);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = (conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Delete conversation with ${conversation.other_user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from local state immediately for better UX
              setConversations(prev => 
                prev.filter(c => 
                  !(c.other_user.id === conversation.other_user.id && 
                    c.detection?.id === conversation.detection?.id)
                )
              );

              // Call API to delete messages
              await messageService.deleteConversation(
                conversation.other_user.id,
                conversation.detection?.id
              );
            } catch (error) {
              console.error('Error deleting conversation:', error);
              // Reload conversations if delete failed
              loadConversations();
            }
          }
        }
      ]
    );
  };

  const renderRightActions = (conversation) => (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteButton, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity
          style={styles.deleteContent}
          onPress={() => handleDeleteConversation(conversation)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      userId: conversation.other_user.id,
      userName: conversation.other_user.name,
      userRole: USER_TYPES.FARMER,
      detectionId: conversation.detection?.id || null
    });
  };

  const renderConversationItem = ({ item }) => (
    <Swipeable
      renderRightActions={renderRightActions(item)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
      <View style={styles.avatarContainer}>
        <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.farmerName}>{item.other_user.name}</Text>
          {item.last_message?.created_at && (
            <Text style={styles.timeText}>
              {new Date(item.last_message.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          )}
        </View>

        {item.last_message?.content && (
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.last_message.is_mine ? 'You: ' : ''}{item.last_message.content}
          </Text>
        )}

        {item.detection && (
          <View style={styles.detectionBadge}>
            <MaterialCommunityIcons name="leaf" size={12} color="#4CAF50" />
            <Text style={styles.detectionText}>
              {item.detection.crop_name || item.detection.disease_name || `Case #${item.detection.id}`}
            </Text>
          </View>
        )}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Farmers' conversations</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => `${item.other_user.id}_${item.detection?.id || 'general'}_${index}`}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Farmers will appear here when they send you messages
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fonts.sizes.md,
    color: '#FFF',
    opacity: 0.9,
  },
  listContent: {
    padding: spacing.md,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  farmerName: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  timeText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  lastMessage: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  detectionText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginBottom: spacing.sm,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  deleteContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  deleteText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default DAChatScreen;
