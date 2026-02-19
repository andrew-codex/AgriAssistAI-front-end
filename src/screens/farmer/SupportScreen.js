import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, fonts, spacing, borderRadius } from '../../styles/theme';
import api from '../../services/api';
import messageService from '../../services/messageService';
import { useRefresh } from '../../hooks/useRefresh';

const SupportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [daWorkers, setDaWorkers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { refreshing, onRefresh } = useRefresh(async () => {
    await loadData();
  });

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
     
      const [conversationsRes, workersRes] = await Promise.all([
        messageService.getConversations(),
        api.get('/da-workers')
      ]);
      
 
      if (conversationsRes.data.success) {
        setConversations(conversationsRes.data.data);
      } else {
        setConversations([]);
      }
      
    
      if (workersRes.data.success) {
        const allWorkers = workersRes.data.data;
        const conversationUserIds = conversationsRes.data.data.map(c => c.other_user.id);
        const newWorkers = allWorkers.filter(w => !conversationUserIds.includes(w.id));
        setDaWorkers(newWorkers);
      } else {
        setDaWorkers([]);
      }
    } catch (error) {
      Alert.alert(
        'Connection Issue', 
        'Unable to connect to server.',
        [{ text: 'OK' }]
      );
      setDaWorkers([]);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = (worker) => {
    Alert.alert(
      'Start Chat',
      `Do you want to start a chat with ${worker.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start Chat',
          onPress: () => {
            navigation.navigate('Chat', {
              userId: worker.id,
              userName: worker.name,
              userRole: 'DA_workers',
              detectionId: null 
            });
          }
        }
      ]
    );
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      userId: conversation.other_user.id,
      userName: conversation.other_user.name,
      userRole: 'DA_workers',
      detectionId: conversation.detection?.id || null
    });
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
              // Remove from local state immediately
              setConversations(prev => 
                prev.filter(c => 
                  !(c.other_user.id === conversation.other_user.id && 
                    c.detection?.id === conversation.detection?.id)
                )
              );

              // Call API to delete
              await messageService.deleteConversation(
                conversation.other_user.id,
                conversation.detection?.id
              );
            } catch (error) {
              console.error('Error deleting conversation:', error);
              // Reload on error
              loadData();
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

  const renderWorkerCard = (worker) => (
    <TouchableOpacity
      key={worker.id}
      style={styles.workerCard}
      onPress={() => handleSelectWorker(worker)}
    >
      <View style={styles.workerAvatar}>
        <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.workerInfo}>
        <Text style={styles.workerName}>{worker.name}</Text>
        <Text style={styles.workerEmail}>{worker.email}</Text>
        <Text style={styles.workerLocation}>{worker.address}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderConversationCard = (conversation) => (
    <Swipeable
      key={`${conversation.other_user.id}_${conversation.detection?.id || 'general'}`}
      renderRightActions={renderRightActions(conversation)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(conversation)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationAvatar}>
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.conversationName}>{conversation.other_user.name}</Text>
            {conversation.last_message?.created_at && (
              <Text style={styles.timeText}>
                {new Date(conversation.last_message.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            )}
          </View>

          {conversation.last_message?.content && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {conversation.last_message.is_mine ? 'You: ' : ''}{conversation.last_message.content}
            </Text>
          )}

          {conversation.detection && (
            <View style={styles.detectionBadge}>
              <MaterialCommunityIcons name="leaf" size={12} color="#4CAF50" />
              <Text style={styles.detectionText}>
                {conversation.detection.crop_name || conversation.detection.disease_name || `Case #${conversation.detection.id}`}
              </Text>
            </View>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>DA Support</Text>
        <Text style={styles.subtitle}>Connect with Development Advisors</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Choose a Development Advisor to get expert help with your crop issues, 
            farming techniques, and general agricultural questions.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {conversations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Active Conversations</Text>
                <View style={styles.conversationsContainer}>
                  {conversations.map(renderConversationCard)}
                </View>
              </>
            )}

            {daWorkers.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, conversations.length > 0 && { marginTop: spacing.lg }]}>
                  Start New Conversation
                </Text>
                <View style={styles.workersContainer}>
                  {daWorkers.map(renderWorkerCard)}
                </View>
              </>
            )}

            {conversations.length === 0 && daWorkers.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-off" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No advisors available</Text>
                <Text style={styles.emptySubtext}>Please try again later</Text>
              </View>
            )}
          </>
        )}


      </ScrollView>
    </View>
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
  content: {
    flex: 1,
     padding: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  workersContainer: {
    marginBottom: spacing.lg,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  workerEmail: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  workerLocation: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  helpTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  helpText: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 18,
    marginLeft: spacing.sm,
  },
  conversationsContainer: {
    marginBottom: spacing.md,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
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
    marginBottom: 4,
  },
  conversationName: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  timeText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  lastMessage: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  detectionText: {
    fontSize: fonts.sizes.xs,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  deleteContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteText: {
    color: '#FFF',
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SupportScreen;