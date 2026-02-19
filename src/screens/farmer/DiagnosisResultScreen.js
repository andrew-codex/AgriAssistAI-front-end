import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,


} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../styles/theme';



const DiagnosisResultScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { result, imageUri } = route.params || {};

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const formatText = (text) => {
    if (!text) return 'N/A';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

 
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'disease': return 'bug-outline';
      case 'pest': return 'bug';
      case 'nutrient_deficiency': return 'leaf-outline';
      case 'healthy': return 'checkmark-circle';
      default: return 'help-circle-outline';
    }
  };


  const handleShare = async () => {
    try {
      await Share.share({
        message: `Crop Diagnosis Result\n\n` +
          `Issue: ${result?.specific_issue || 'N/A'}\n` +
          `Category: ${result?.category || 'Unknown'}\n` +
          `Severity: ${result?.severity_level || 'Unknown'}\n` +
          `Confidence: ${result?.confidence_score || 0}%\n\n` +
          `Solution: ${result?.solution || 'Consult an expert'}\n\n` +
          `- AgriAssist AI`,
      });
    } catch (error) {
      if (__DEV__) console.error('Share error:', error);
    }
  };

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.errorText}>No diagnosis data available</Text>
          <TouchableOpacity 
            style={styles.backButtonLarge}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
    
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnosis Result</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image 
              source={imageUri}
              style={styles.cropImage}
              contentFit="cover"
            />
            <View style={styles.imageOverlay}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: result.status === 'completed' ? '#4CAF50' : '#FF9800' }
              ]}>
                <Ionicons 
                  name={result.status === 'completed' ? 'checkmark-circle' : 'time-outline'} 
                  size={14} 
                  color="#FFF" 
                />
                <Text style={styles.statusText}>
                  {result.status === 'completed' ? 'Analyzed' : 'Pending Review'}
                </Text>
              </View>
            </View>
          </View>
        )}

    
        <View style={styles.mainCard}>
         
          <View style={styles.issueHeader}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: `${getSeverityColor(result.severity_level)}15` }
            ]}>
              <Ionicons 
                name={getCategoryIcon(result.category)} 
                size={28} 
                color={getSeverityColor(result.severity_level)} 
              />
            </View>
            <View style={styles.issueInfo}>
              <Text style={styles.categoryLabel}>{formatText(result.category).toUpperCase()}</Text>
              <Text style={styles.issueTitle}>{result.issue || 'Analysis Required'}</Text>
            </View>
          </View>

         
          <View style={styles.statsRow}>
       
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { borderColor: colors.primary }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {result.confidence_score || 0}%
                </Text>
              </View>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>

         
            <View style={styles.statItem}>
              <View style={[
                styles.statCircle, 
                { borderColor: getSeverityColor(result.severity_level) }
              ]}>
                <Ionicons 
                  name="warning" 
                  size={24} 
                  color={getSeverityColor(result.severity_level)} 
                />
              </View>
              <Text style={styles.statLabel}>
                {formatText(result.severity_level)}
              </Text>
            </View>

         
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { borderColor: '#9E9E9E' }]}>
                <Ionicons name="calendar-outline" size={24} color="#9E9E9E" />
              </View>
              <Text style={styles.statLabel}>
                {result?.date || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {result.status === 'pending_review' && (
          <View style={styles.pendingBanner}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.pendingText}>
              This diagnosis has been reported and is pending review by a DA worker.
            </Text>
          </View>
        )}

        
        {result.solution && (
          <View style={styles.solutionCard}>
            <View style={styles.solutionHeader}>
              <View style={[styles.solutionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="bulb" size={20} color="#2196F3" />
              </View>
              <Text style={styles.solutionTitle}>Recommended Solution</Text>
            </View>
            <Text style={styles.solutionText}>{result.solution}</Text>
          </View>
        )}

        
        {result.organic_solution && (
          <View style={styles.solutionCard}>
            <View style={styles.solutionHeader}>
              <View style={[styles.solutionIcon, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="leaf" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.solutionTitle}>Organic Solution</Text>
            </View>
            <Text style={styles.solutionText}>{result.organic_solution}</Text>
          </View>
        )}

  
        {result.chemical_solution && (
          <View style={styles.solutionCard}>
            <View style={styles.solutionHeader}>
              <View style={[styles.solutionIcon, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="flask" size={20} color="#FF9800" />
              </View>
              <Text style={styles.solutionTitle}>Chemical Solution</Text>
            </View>
            <Text style={styles.solutionText}>{result.chemical_solution}</Text>
          </View>
        )}

   
        {result.prevention_tips && (
          <View style={styles.solutionCard}>
            <View style={styles.solutionHeader}>
              <View style={[styles.solutionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#9C27B0" />
              </View>
              <Text style={styles.solutionTitle}>Prevention Tips</Text>
            </View>
            <Text style={styles.solutionText}>{result.prevention_tips}</Text>
          </View>
        )}

      
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.newDiagnosisButton}
            onPress={() => navigation.navigate('UploadDiagnosis')}
          >
            <Ionicons name="camera" size={20} color="#FFF" />
            <Text style={styles.newDiagnosisText}>New Diagnosis</Text>
          </TouchableOpacity>

          <View 
            style={[
              styles.viewHistoryButton,
              styles.reportedButton
            ]}
            accessibilityLabel="Diagnosis has been reported to DA workers"
            accessibilityRole="text"
          >
            <MaterialCommunityIcons 
              name="check-circle" 
              size={20} 
              color="#4CAF50" 
            />
            <Text style={[
              styles.viewHistoryText,
              styles.reportedText
            ]}>
              Reported
            </Text>
          </View>
        </View>

  
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#F8F9FA',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButtonLarge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  cropImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  imageOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  issueInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
  solutionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  solutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  solutionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  solutionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  newDiagnosisButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  newDiagnosisText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  viewHistoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  viewHistoryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  reportedButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  reportedText: {
    color: '#4CAF50',
  },
});

export default DiagnosisResultScreen;
