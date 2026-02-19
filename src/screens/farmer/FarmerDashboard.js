import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { colors, fonts, spacing, borderRadius, shadows } from '../../styles/theme';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { useRefresh } from '../../hooks/useRefresh';
import { getErrorMessage, logError } from '../../utils/errorHandler';
import { getStorageUrl } from '../../config/config';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }
  return dateStr;
};
const formatCategory = (raw) => {
  if (!raw) return 'Unknown';
  const formattedCategory = String(raw).replace(/_/g, ' ').trim();
  return formattedCategory
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatStatus = (status) => {
  const statusLower = String(status || '').toLowerCase();
  if (statusLower === 'completed') return 'Reviewed';
  if (statusLower === 'pending_review') return 'Pending Review';
  return formatCategory(status);
};

const getStatusStyle = (status) => {
  const statusLower = String(status).toLowerCase();
  if (statusLower === 'resolved' || statusLower === 'completed')
    return { bg: '#E8F5E9', text: '#2E7D32' };
  if (statusLower === 'pending' || statusLower === 'pending_review')
    return { bg: '#FFF8E1', text: '#EF6C00' };
  if (statusLower === 'failed')
    return { bg: '#FFEBEE', text: '#D32F2F' };
  return { bg: '#ECEFF1', text: '#546E7A' };
};

const FarmerDashboard = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const { refreshing, onRefresh } = useRefresh(async () => {
    await Promise.all([fetchWeather(), fetchRecentActivity()]);
  });

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    let location = null;

    try {
      // Try to get location, but don't fail if it's not available
      const isAvailable = await Location.hasServicesEnabledAsync();

      if (isAvailable) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          try {
            const locationResult = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeout: 10000,
            });
            location = locationResult.coords;

            // Try to get city name
            try {
              const [address] = await Location.reverseGeocodeAsync({
                latitude: location.latitude,
                longitude: location.longitude
              });
              if (address) {
                setLocationName(address.city || address.subregion || address.region || 'Your Location');
              }
            } catch (geocodeError) {
              console.log('Geocoding failed, continuing with weather fetch');
            }
          } catch (locationError) {
            console.log('Location fetch failed, will use fallback:', locationError.message);
          }
        }
      }
    } catch (error) {
      console.log('Location services error, using fallback:', error.message);
    }

    // Fetch weather with or without location
    try {
      const params = location
        ? { latitude: location.latitude, longitude: location.longitude }
        : {}; // Backend should use IP-based location or default

      const response = await api.get('/weather', { params });

      if (response.data && response.data.success) {
        setWeather(response.data.data);
        if (response.data.data.city) {
          setLocationName(response.data.data.city);
        } else if (!location) {
          setLocationName('Default Location');
        }
      } else {
        setWeather({
          error: 'Weather data temporarily unavailable',
          details: 'Tap to retry'
        });
      }
    } catch (error) {
      logError('Weather Fetch', error);
      setWeather({
        error: 'Unable to fetch weather',
        details: 'Check your internet connection. Tap to retry.'
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    setRecentLoading(true);
    try {
      const response = await api.get('/recent-activities');
      if (response.data.success) {
        setRecentActivity(response.data.data);
      } else {
        setRecentActivity([]);
      }
    } catch (error) {
      logError('Fetch Recent Activity', error);
      setRecentActivity([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
    fetchWeather();
    fetchRecentActivity();
  }, [fetchWeather, fetchRecentActivity]);

  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: { name: 'sunny', color: '#FFD54F' },
      Clouds: { name: 'cloudy', color: '#90A4AE' },
      Rain: { name: 'rainy', color: '#64B5F6' },
      Drizzle: { name: 'rainy-outline', color: '#81D4FA' },
      Thunderstorm: { name: 'thunderstorm', color: '#7E57C2' },
      Snow: { name: 'snow', color: '#E1F5FE' },
      Mist: { name: 'water', color: '#B0BEC5' },
      Fog: { name: 'water', color: '#B0BEC5' },
      Haze: { name: 'water', color: '#BCAAA4' },
    };
    return icons[condition] || { name: 'partly-sunny', color: '#FFD54F' };
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const quickActions = [
    {
      id: 1,
      title: 'AI Diagnosis',
      subtitle: 'Scan your crops',
      iconName: 'camera',
      iconType: 'Feather',
      bgColor: '#E8F5E9',
      iconBg: '#4CAF50',
      route: 'Diagnose',
      isTab: true,
    },
    {
      id: 2,
      title: 'My Reports',
      subtitle: 'View history',
      iconName: 'file-text',
      iconType: 'Feather',
      bgColor: '#FFF3E0',
      iconBg: '#FF9800',
      route: 'Reports',
      isTab: true,
    },
    {
      id: 3,
      title: 'DA Support',
      subtitle: 'Chat with experts',
      iconName: 'message-circle',
      iconType: 'Feather',
      bgColor: '#E3F2FD',
      iconBg: '#2196F3',
      route: 'Support',
      isTab: true,
    },
  ];

  const handleQuickAction = (action) => {
    navigation.navigate(action.route);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: (insets.bottom || 0) + spacing.md }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
 
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'F'}
              </Text>
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{(user?.name || 'Farmer').toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutIconButton}>
              <Ionicons name="log-out-outline" size={20} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>

 
        <TouchableOpacity style={styles.weatherCard} onPress={fetchWeather} activeOpacity={0.8}>
          {weatherLoading ? (
            <View style={styles.weatherLoadingContainer}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.weatherLoadingText}>Loading...</Text>
            </View>
          ) : weather?.error ? (
            <View style={styles.weatherContent}>
              <Text style={styles.weatherTemp}>Weather Unavailable</Text>
              <Text style={styles.weatherTapText}>Tap to retry</Text>
            </View>
          ) : (
            <>
              <View style={styles.weatherContent}>
                <View style={styles.weatherLocationRow}>
                  <Ionicons name="location-sharp" size={14} color={colors.white} />
                  <Text style={styles.weatherLocation}>{locationName}</Text>
                </View>
                <Text style={styles.weatherTemp}>
                  {weather?.temp}°C - {weather?.condition}
                </Text>
                <Text style={styles.weatherSubtext}>
                  {weather?.farming_tip || 'Monitor your crops today'}
                </Text>
                <View style={styles.weatherExtraInfo}>
                  <View style={styles.weatherExtraItem}>
                    <Ionicons name="water-outline" size={14} color={colors.white} />
                    <Text style={styles.weatherExtraText}>{weather?.humidity}%</Text>
                  </View>
                  <View style={styles.weatherExtraItem}>
                    <Feather name="wind" size={14} color={colors.white} />
                    <Text style={styles.weatherExtraText}>{weather?.wind_speed} m/s</Text>
                  </View>
                </View>
              </View>
              <View style={styles.weatherIconContainer}>
                <Ionicons
                  name={getWeatherIcon(weather?.condition).name}
                  size={55}
                  color={getWeatherIcon(weather?.condition).color}
                  style={styles.weatherIcon}
                />
              </View>
            </>
          )}
        </TouchableOpacity>


        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.bgColor }]}
                activeOpacity={0.7}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.iconBg }]}>
                  <Feather name={action.iconName} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Reports')} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentLoading ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.emptyStateText}>
                  Loading recent activities...
                </Text>
              </View>
            ) : recentActivity.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No recent activities found.</Text>
              </View>
            ) : (
              recentActivity.slice(0, 5).map((activity) => {
                const statusStyle = getStatusStyle(activity.status);
                const imageUrl = getStorageUrl(activity.image_url || activity.image_path);
                return (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityIconContainer}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.activityImage}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="leaf"
                          size={22}
                          color={colors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{formatCategory(activity.category)}</Text>
                      <Text style={styles.activityMeta}>{activity.issue}</Text>
                      <View style={styles.activityMetaRow}>
                        {activity.confidence ? (
                          <Text style={styles.activityMetaChip}>
                            Confidence: {activity.confidence}
                          </Text>
                        ) : null}
                        <Text style={styles.activityMetaChip}>{formatDate(activity.date)}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {formatStatus(activity.status)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTextContainer: { justifyContent: 'center' },
  welcomeText: { fontSize: fonts.sizes.sm, color: colors.textSecondary },
  userName: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Weather card styles
  weatherCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },
  weatherContent: { flex: 1 },
  weatherLabel: {
    fontSize: fonts.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  weatherTemp: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  weatherSubtext: { fontSize: fonts.sizes.sm, color: 'rgba(255,255,255,0.9)' },
  weatherIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherIcon: { fontSize: 55 },
  weatherLoadingContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  weatherLoadingText: { color: colors.white, marginLeft: spacing.sm, fontSize: fonts.sizes.sm },
  weatherDetailsText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fonts.sizes.xs,
    marginTop: spacing.xs,
    fontStyle: 'italic'
  },
  weatherTapText: { color: 'rgba(255,255,255,0.7)', fontSize: fonts.sizes.xs, marginTop: spacing.xs },
  weatherLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  weatherLocation: { fontSize: fonts.sizes.xs, color: 'rgba(255,255,255,0.8)', marginLeft: 4 },
  weatherExtraInfo: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.md },
  weatherExtraItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weatherExtraText: { fontSize: fonts.sizes.xs, color: 'rgba(255,255,255,0.8)' },

  sectionContainer: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  viewAllText: { fontSize: fonts.sizes.sm, color: colors.primary, fontWeight: '500' },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  actionIconContainer: {
    width: 45,
    height: 45,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionTitle: { fontSize: fonts.sizes.md, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  actionSubtitle: { fontSize: fonts.sizes.sm, color: colors.textSecondary },

  activityList: { marginTop: -spacing.sm },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.light,
    minHeight: 66,
    gap: 10,
  },
  activityIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: '#F3F7F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  activityImage: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  activityContent: { flex: 1, justifyContent: 'center' },
  activityTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
    letterSpacing: 0.15,
  },
  activityMeta: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: 0 },
  activityMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 3, marginBottom: 0 },
  activityMetaChip: {
    backgroundColor: '#F4F5F7',
    color: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: fonts.sizes.xs,
    marginRight: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: fonts.sizes.xs, fontWeight: '600' },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default FarmerDashboard;