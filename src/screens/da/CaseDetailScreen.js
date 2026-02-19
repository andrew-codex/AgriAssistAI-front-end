import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../../styles/theme';
import { diagnosisService } from '../../services/diagnosisService';
import ButtonPrimary from '../../components/ButtonPrimary';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { getStorageUrl } from '../../config/config';

const CaseDetailScreen = ({ route, navigation }) => {
  const { caseId } = route.params || {};
  const insets = useSafeAreaInsets();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  const fetchCaseDetails = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const response = await diagnosisService.getDiagnosisResult(caseId);
      // Handle nested response structure from backend
      const data = response.data?.data || response.data;
      if (__DEV__) console.log('Case Data:', data);
      setCaseData(data);
    } catch (error) {
      logError('Fetch Case Details', error);
      const errorMessage = getErrorMessage(error, 'Failed to load case details');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCaseDetails(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Validation Error', 'Please enter your review comments');
      return;
    }

    if (!recommendation.trim()) {
      Alert.alert('Validation Error', 'Please enter your recommendations');
      return;
    }

    Alert.alert(
      'Submit Review',
      'Are you sure you want to submit this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitting(true);
              await diagnosisService.submitReview(caseId, {
                review: reviewText,
                recommendation: recommendation,
              });
              Alert.alert('Success', 'Review submitted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              logError('Submit Review', error);
              const errorMessage = getErrorMessage(error, 'Failed to submit review');
              Alert.alert('Error', errorMessage);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Case not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isReviewed = caseData.status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isReviewed ? '#4CAF5020' : '#FF980020' },
            ]}>
            <Ionicons
              name={isReviewed ? 'checkmark-circle' : 'time'}
              size={16}
              color={isReviewed ? '#4CAF50' : '#FF9800'}
            />
            <Text
              style={[
                styles.statusText,
                { color: isReviewed ? '#4CAF50' : '#FF9800' },
              ]}>
              {isReviewed ? 'Reviewed' : 'Pending Review'}
            </Text>
          </View>
        </View>

        {/* Farmer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{caseData.farmer?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{caseData.farmer?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Diagnosis Image */}
        {getStorageUrl(caseData.image_url || caseData.image_path) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis Image</Text>
            <Image source={{ uri: getStorageUrl(caseData.image_url || caseData.image_path) }} style={styles.diagnosisImage} />
          </View>
        )}

        {/* Diagnosis Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="leaf-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>
                {caseData.category 
                  ? caseData.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="bug-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Disease:</Text>
              <Text style={styles.infoValue}>{caseData.disease || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Confidence:</Text>
              <Text style={styles.infoValue}>
                {caseData.confidence ? `${caseData.confidence}%` : 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Severity:</Text>
              <Text style={styles.infoValue}>{caseData.severity || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {caseData.created_at
                  ? new Date(caseData.created_at).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* AI Diagnosis */}
        {caseData.ai_diagnosis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Diagnosis</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{caseData.ai_diagnosis}</Text>
            </View>
          </View>
        )}

        {/* Treatment Suggestions */}
        {caseData.treatment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Suggestions</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{caseData.treatment}</Text>
            </View>
          </View>
        )}

        {/* Organic Solution */}
        {caseData.organic_solution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organic Solution</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{caseData.organic_solution}</Text>
            </View>
          </View>
        )}

        {/* Chemical Solution */}
        {caseData.chemical_solution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chemical Solution</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{caseData.chemical_solution}</Text>
            </View>
          </View>
        )}

        {/* Prevention Tips */}
        {caseData.prevention_tips && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prevention Tips</Text>
            <View style={styles.diagnosisCard}>
              <Text style={styles.diagnosisText}>{caseData.prevention_tips}</Text>
            </View>
          </View>
        )}

        {/* Existing Review (if reviewed) */}
        {isReviewed && caseData.review && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DA Review</Text>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>
                      {caseData.reviewer?.name || 'DA Worker'}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {caseData.reviewed_at
                        ? new Date(caseData.reviewed_at).toLocaleDateString()
                        : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{caseData.review}</Text>
              </View>
            </View>

            {caseData.recommendation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewText}>{caseData.recommendation}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Review Form (only if not reviewed) */}
        {!isReviewed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit Your Review</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Review Comments *</Text>
              <TextInput
                style={styles.textArea}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Enter your detailed review and analysis..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Recommendations *</Text>
              <TextInput
                style={styles.textArea}
                value={recommendation}
                onChangeText={setRecommendation}
                placeholder="Enter your recommendations for treatment..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <ButtonPrimary
              title="Submit Review"
              onPress={handleSubmitReview}
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerButton: {
    padding: spacing.sm,
    width: 40,
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    fontWeight: '500',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  diagnosisImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.grayLight,
  },
  diagnosisCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  diagnosisText: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 24,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reviewText: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 24,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fonts.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default CaseDetailScreen;
