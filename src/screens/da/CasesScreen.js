import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
 Platform,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../styles/theme';
import { diagnosisService } from '../../services/diagnosisService';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from "expo-navigation-bar";
import { getStorageUrl } from '../../config/config';

const CasesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all'); 
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCases();
    }, [activeTab])
  );

    useEffect(() => {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("hidden");
        NavigationBar.setBehaviorAsync("overlay-swipe");
      }
    }, []);

  const fetchCases = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      
      let response;
      switch (activeTab) {
        case 'pending_review':
          response = await diagnosisService.getPendingCases();
          break;
        case 'completed':
          response = await diagnosisService.getReviewedCases();
          break;
        default:
          response = await diagnosisService.getAllCases();
      }
      
     
      const casesData = response.data?.data || response.data || [];
      setCases(casesData);
    } catch (error) {
      logError('Fetch Cases', error);
      const errorMessage = getErrorMessage(error, 'Failed to load cases');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCases(true);
  };

  const handleCasePress = (caseItem) => {
    navigation.navigate('CaseDetail', { caseId: caseItem.id });
  };

  const renderTabButton = (tab, label, icon) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}>
        <Ionicons
          name={icon}
          size={18}
          color={isActive ? colors.white : colors.textSecondary}
        />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderCaseCard = ({ item }) => {
    const isReviewed = item.status === 'completed';
    const statusColor = isReviewed ? '#4CAF50' : '#FF9800';
    
   
    const imageUrl = getStorageUrl(item.image_url) || getStorageUrl(item.image_path);
    
    return (
      <TouchableOpacity
        style={styles.caseCard}
        onPress={() => handleCasePress(item)}
        activeOpacity={0.7}>
        <View style={styles.caseImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.caseImage} />
          ) : (
            <View style={styles.caseImagePlaceholder}>
              <Ionicons name="leaf" size={32} color={colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.caseInfo}>
          <View style={styles.caseHeader}>
            <Text style={styles.farmerName} numberOfLines={1}>
              {item.farmer?.name || 'Unknown Farmer'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusColor}20` },
              ]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {isReviewed ? 'Reviewed' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.caseDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="bug-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.specific_issue || 'Unknown Disease'}
              </Text>
            </View>
          </View>

          <View style={styles.caseFooter}>
            <View style={styles.confidenceContainer}>
              <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.confidenceText}>
                {item.confidence_score ? `${item.confidence_score}%` : 'N/A'}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {item.created_at ? formatTimeAgo(item.created_at) : 'Just now'}
            </Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyText}>No cases found</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'pending_review'
          ? 'All cases have been reviewed'
          : activeTab === 'completed'
          ? 'No reviewed cases yet'
          : 'No cases available'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>All Cases</Text>
        <Text style={styles.headerSubtitle}>
          {cases.length} {activeTab === 'all' ? 'total' : activeTab === 'pending_review' ? 'pending' : activeTab === 'completed' ? 'reviewed' : activeTab} case{cases.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('all', 'All Cases', 'grid-outline')}
        {renderTabButton('pending_review', 'Pending', 'time-outline')}
        {renderTabButton('completed', 'Reviewed', 'checkmark-circle-outline')}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cases...</Text>
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
    gap: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  caseCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  caseImageContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  caseImage: {
    width: '100%',
    height: '100%',
  },
  caseImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  farmerName: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
  },
  caseDetails: {
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.xs,
  },
  detailText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timeText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default CasesScreen;
