import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as NavigationBar from "expo-navigation-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
} from "../../styles/theme";
import { AuthContext } from "../../context/AuthContext";
import { diagnosisService } from "../../services/diagnosisService";
import { getErrorMessage, logError } from "../../utils/errorHandler";
import { getStorageUrl } from "../../config/config";

const DADashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [allCases, setAllCases] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [stats, setStats] = useState({
    pending: 0,
    reviewed: 0,
    total: 0,
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  const fetchDashboardData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) setLoading(true);

        const response = await diagnosisService.getAllCases();

        const fetchedCases = response.data?.data || response.data || [];
        setAllCases(fetchedCases);

        applyFilters(fetchedCases, searchQuery, selectedFilter);

        const pending = fetchedCases.filter(
          (c) => c.status === "pending_review"
        ).length;
        const reviewed = fetchedCases.filter(
          (c) => c.status === "completed" && c.reviewer_id === user?.id
        ).length;

        setStats({
          pending,
          reviewed,
          total: fetchedCases.length,
        });
      } catch (error) {
        logError("Fetch Dashboard Data", error);
        const errorMessage = getErrorMessage(
          error,
          "Failed to load dashboard data"
        );
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const applyFilters = (casesData, search, filter) => {
    let filtered = [...casesData];

    if (filter === "pending") {
      filtered = filtered.filter((c) => c.status === "pending_review");
    } else if (filter === "completed") {
      filtered = filtered.filter((c) => c.status === "completed");
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          (c.farmer?.name || "").toLowerCase().includes(query) ||
          (c.disease || "").toLowerCase().includes(query) ||
          (c.category || "").toLowerCase().includes(query) ||
          (c.specific_issue || "").toLowerCase().includes(query)
      );
    }

    setCases(filtered.slice(0, 5));
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(allCases, text, selectedFilter);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    applyFilters(allCases, searchQuery, filter);
    setShowFilterModal(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleCasePress = (caseItem) => {
    navigation.navigate("CaseDetail", { caseId: caseItem.id });
  };

  const handleViewAllCases = () => {
    navigation.navigate("Cases");
  };

  const statsData = [
    {
      id: 1,
      label: "Pending",
      value: stats.pending,
      icon: "time-outline",
      color: "#FF9800",
    },
    {
      id: 2,
      label: "My Reviews",
      value: stats.reviewed,
      icon: "checkmark-circle-outline",
      color: "#4CAF50",
    },
    {
      id: 3,
      label: "Total Cases",
      value: stats.total,
      icon: "folder-open-outline",
      color: "#2196F3",
    },
  ];

  const getStatusColor = (status) => {
    return status === "completed" ? "#4CAF50" : "#FF9800";
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const renderStatCard = (stat) => (
    <View key={stat.id} style={styles.statCard}>
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: `${stat.color}15` },
        ]}>
        <Ionicons name={stat.icon} size={24} color={stat.color} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const renderCaseCard = (caseItem) => {
    const isReviewed = caseItem.status === "completed";
    const statusColor = getStatusColor(caseItem.status);

    const imageUrl = getStorageUrl(caseItem.image_url) || getStorageUrl(caseItem.image_path);

    return (
      <TouchableOpacity
        key={caseItem.id}
        style={styles.caseCard}
        activeOpacity={0.7}
        onPress={() => handleCasePress(caseItem)}>
        <View style={styles.caseImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.caseImage} />
          ) : (
            <View style={styles.caseImagePlaceholder}>
              <Ionicons name="leaf" size={24} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.caseInfo}>
          <Text style={styles.caseFarmerName}>
            {caseItem.farmer?.name || "Unknown Farmer"}
          </Text>
          <Text style={styles.caseDisease}>
            {caseItem.disease || caseItem.specific_issue || "Unknown Disease"}
          </Text>
          <Text style={styles.caseCropTime}>
            {caseItem.category
              ? caseItem.category
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : "N/A"}{" "}
            • {formatTimeAgo(caseItem.created_at)}
          </Text>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isReviewed ? "Reviewed" : "Pending"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{(user?.name ?? "DA Worker").toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              {statsData.map(renderStatCard)}
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search cases..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => setShowFilterModal(true)}>
                <Ionicons
                  name="options-outline"
                  size={22}
                  color={colors.textSecondary}
                />
                {selectedFilter !== "all" && (
                  <View style={styles.filterBadge} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Cases</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={handleViewAllCases}
              >
                <Text style={styles.viewAllText}>View all</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.casesContainer}>
              {cases.length > 0 ? (
                cases.map(renderCaseCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="folder-open-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>No cases available</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}>
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Cases</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.filterOption,
                selectedFilter === "all" && styles.filterOptionActive,
              ]}
              onPress={() => handleFilterChange("all")}>
              <Ionicons
                name="grid-outline"
                size={20}
                color={
                  selectedFilter === "all"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "all" && styles.filterOptionTextActive,
                ]}>
                All Cases
              </Text>
              {selectedFilter === "all" && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                selectedFilter === "pending" && styles.filterOptionActive,
              ]}
              onPress={() => handleFilterChange("pending")}>
              <Ionicons
                name="time-outline"
                size={20}
                color={
                  selectedFilter === "pending"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "pending" && styles.filterOptionTextActive,
                ]}>
                Pending Review
              </Text>
              {selectedFilter === "pending" && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                selectedFilter === "completed" && styles.filterOptionActive,
              ]}
              onPress={() => handleFilterChange("completed")}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={
                  selectedFilter === "completed"
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === "completed" &&
                    styles.filterOptionTextActive,
                ]}>
                Reviewed
              </Text>
              {selectedFilter === "completed" && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  welcomeContainer: {
    justifyContent: "center",
  },
  welcomeText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
    ...shadows.light,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: "center",
    ...shadows.light,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fonts.sizes.xxl,
    fontWeight: "700",
    color: colors.text,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    ...shadows.light,
  },
  searchInput: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.light,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: colors.text,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: "500",
  },
  casesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  caseCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
    ...shadows.light,
  },
  caseImageContainer: {
    marginRight: spacing.md,
  },
  caseImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  caseImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  caseInfo: {
    flex: 1,
  },
  caseFarmerName: {
    fontSize: fonts.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  caseDisease: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: "500",
    marginBottom: 2,
  },
  caseCropTime: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    width: "100%",
    maxWidth: 600,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: "700",
    color: colors.text,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  filterOptionActive: {
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterOptionText: {
    flex: 1,
    fontSize: fonts.sizes.md,
    color: colors.text,
    fontWeight: "500",
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});

export default DADashboard;
