import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, spacing } from "../../styles/theme";
import api from "../../services/api";
import { useRefresh } from "../../hooks/useRefresh";
import diagnosisService from "../../services/diagnosisService";
import { getStorageUrl } from "../../config/config";

const getSeverity = (report) => {
  const rawSev = report?.severity_level ?? report?.severity;
  if (
    rawSev &&
    String(rawSev).toLowerCase() !== "unknown" &&
    String(rawSev).toLowerCase() !== "n/a"
  ) {
    const normalizedSeverity = String(rawSev).trim();
    return (
      normalizedSeverity.charAt(0).toUpperCase() + normalizedSeverity.slice(1)
    );
  }
  const conf = String(report?.confidence ?? "");
  const parsed = parseFloat(conf.replace("%", ""));
  if (!Number.isFinite(parsed)) return "N/A";
  if (parsed >= 80) return "High";
  if (parsed >= 50) return "Medium";
  return "Low";
};

const getSeverityColor = (sev) => {
  if (!sev) return { bg: "#ECEFF1", text: "#546E7A" };
  const severityLower = String(sev).toLowerCase();
  if (severityLower === "high") return { bg: "#FFF3F2", text: "#D32F2F" };
  if (severityLower === "medium") return { bg: "#FFF8E1", text: "#EF6C00" };
  if (severityLower === "low") return { bg: "#E8F5E9", text: "#2E7D32" };
  return { bg: "#ECEFF1", text: "#546E7A" };
};

const getStatusColors = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();
  if (normalizedStatus.includes("pending"))
    return { bg: "#FFF8E1", border: "#FFDAB3", text: "#EF6C00" };
  if (
    normalizedStatus.includes("resolved") ||
    normalizedStatus.includes("completed")
  )
    return { bg: "#E8F5E9", border: "#C8E6C9", text: "#2E7D32" };
  if (normalizedStatus.includes("reviewed"))
    return { bg: "#E3F2FD", border: "#BBDEFB", text: "#1565C0" };
  return { bg: "#F5F5F5", border: "#E0E0E0", text: "#616161" };
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  const parts = String(dateStr).split(",");
  if (parts.length > 0) return parts[0].trim();
  return dateStr;
};

const formatCategory = (raw) => {
  if (!raw) return "Unknown";
  const formattedCategory = String(raw).replace(/_/g, " ").trim();
  return formattedCategory
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const formatStatus = (status) => {
  const statusLower = String(status || "").toLowerCase();
  if (statusLower === "completed") return "Reviewed";
  if (statusLower === "pending_review") return "Pending Review";
  return formatCategory(status);
};

const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getEndpoint = (filter) => {
    switch (filter) {
      case "pending":
        return "/diagnosis/pending-cases";
      case "reviewed":
        return "/diagnosis/reviewed-cases";
      default:
        return "/my-reports";
    }
  };

  const mapReportData = (item) => {
    let imageUrl = null;

    if (item.image_path) {
      imageUrl = getStorageUrl(item.image_path);
    } else if (item.image_url) {
      imageUrl = item.image_url.startsWith('http')
        ? item.image_url
        : getStorageUrl(item.image_url);
    }

    return {
      id: item.id,
      image_url: imageUrl,
      category: item.category ?? "Pending review",
      issue: item.specific_issue ?? item.issue ?? "Pending review",
      confidence: (item.confidence_score ?? 0) + "%",
      status: item.status ?? "pending_review",
      diagnosis_mode: item.diagnosis_mode ?? "N/A",
      severity_level: item.severity_level ?? "unknown",
      description: item.description ?? "",
      date: item.created_at,
      crop: item.crop ?? null,
      plant: item.plant ?? null,
      location: item.location ?? null,
      solution: item.solution ?? null,
      organic_solution: item.organic_solution ?? null,
      chemical_solution: item.chemical_solution ?? null,
      prevention_tips: item.prevention_tips ?? null,
    };
  };

  const { refreshing, onRefresh } = useRefresh(async () => {
    setCurrentPage(1);
    setHasMorePages(true);
    const endpoint = getEndpoint(activeFilter);
    const response = await api.get(endpoint, {
      params: { page: 1, per_page: 15 },
    });

    const data = response.data.success ? response.data.data : response.data;
    const reports = (data.data || []).map(mapReportData);
    setReports(reports);
    setHasMorePages(data.current_page < data.last_page);
  });

  const fetchReports = useCallback(
    async (page = 1) => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const endpoint = getEndpoint(activeFilter);
        const response = await api.get(endpoint, {
          params: { page, per_page: 15 },
        });

        const data = response.data.success ? response.data.data : response.data;
        const items = (data.data || []).map(mapReportData);
        setReports(page === 1 ? items : [...reports, ...items]);
        setHasMorePages(data.current_page < data.last_page);
        setCurrentPage(data.current_page);
      } catch (error) {
        console.error("Error fetching reports:", error);
        if (page === 1) setReports([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [reports, activeFilter]
  );

  useEffect(() => {
    fetchReports(1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    setHasMorePages(true);
    setReports([]);
    fetchReports(1);
  }, [activeFilter]);

  const fetchDiagnosisDetails = async (diagnosisId) => {
    setDetailsLoading(true);
    try {
      const response = await api.get(`/diagnosis/${diagnosisId}`);
      if (response.data.success) {
        setSelectedReport(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching diagnosis details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteReport = (reportId) => {
    Alert.alert(
      "Delete Report",
      "This will permanently delete this diagnosis report.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(reportId);
              await diagnosisService.deleteDiagnosis(reportId);
              setReports(reports.filter((report) => report.id !== reportId));
            } catch (error) {
              console.error("Error deleting report:", error);
              Alert.alert(
                "Error",
                "Failed to delete report. Please try again."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePages && !loading) {
      fetchReports(currentPage + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  };

  const renderReportItem = ({ item: report }) => {
    const severity = getSeverity(report);
    const severityColor = getSeverityColor(severity);
    const statusInfo = getStatusColors(report.status);
    return (
      <TouchableOpacity
        style={styles.reportCard}
        activeOpacity={0.7}
        disabled={deletingId === report.id}
        onPress={async () => {
          setModalVisible(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 1,
              tension: 65,
              friction: 11,
              useNativeDriver: true,
            }),
          ]).start();

          await fetchDiagnosisDetails(report.id);
        }}
        onLongPress={() => handleDeleteReport(report.id)}>
        <View style={styles.imageCol}>
          {report.image_url ? (
            <Image
              source={{ uri: report.image_url }}
              style={styles.reportImage}
            />
          ) : (
            <View style={styles.iconBg}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={34}
                color={colors.primary}
              />
            </View>
          )}
        </View>
        <View style={styles.detailCol}>
          <Text style={styles.reportCategory}>
            {formatCategory(report.category)}
          </Text>
          <Text style={styles.reportAbout}>
            {report.crop || report.plant || report.location || ""}
          </Text>
          <Text style={styles.reportIssue} numberOfLines={2}>
            {report.issue}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.severityPill,
                { backgroundColor: severityColor.bg },
              ]}>
              <Text
                style={[styles.severityText, { color: severityColor.text }]}>
                {severity}
              </Text>
            </View>
            <Text style={styles.reportDate}>
              {formatDateShort(report.date)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusButton,
            {
              backgroundColor: statusInfo.bg,
              borderColor: statusInfo.border,
            },
          ]}>
          <Text style={[styles.statusButtonText, { color: statusInfo.text }]}>
            {formatStatus(report.status)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No reports found.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 18 }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>View your diagnosis reports</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "all" && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter("all")}>
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "all" && styles.filterTabTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "pending" && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter("pending")}>
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "pending" && styles.filterTabTextActive,
            ]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            activeFilter === "reviewed" && styles.filterTabActive,
          ]}
          onPress={() => setActiveFilter("reviewed")}>
          <Text
            style={[
              styles.filterTabText,
              activeFilter === "reviewed" && styles.filterTabTextActive,
            ]}>
            Reviewed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setModalVisible(false);
            setSelectedReport(null);
          });
        }}>
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diagnosis Details</Text>
              <TouchableOpacity
                onPress={() => {
                  Animated.parallel([
                    Animated.timing(fadeAnim, {
                      toValue: 0,
                      duration: 150,
                      useNativeDriver: true,
                    }),
                    Animated.timing(slideAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true,
                    }),
                  ]).start(() => {
                    setModalVisible(false);
                    setSelectedReport(null);
                  });
                }}
                style={styles.closeButton}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}>
              {detailsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading details...</Text>
                </View>
              ) : (
                selectedReport && (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Category</Text>
                      <Text style={styles.modalValue}>
                        {formatCategory(selectedReport.category)}
                      </Text>
                    </View>

                    {selectedReport.crop && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Crop</Text>
                        <Text style={styles.modalValue}>
                          {selectedReport.crop}
                        </Text>
                      </View>
                    )}

                    {selectedReport.issue && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Issue</Text>
                        <Text style={styles.modalValue}>
                          {selectedReport.issue}
                        </Text>
                      </View>
                    )}

                    {selectedReport.solution && (
                      <View style={styles.modalSection}>
                        <View style={styles.sectionTitleRow}>
                          <MaterialCommunityIcons
                            name="lightbulb"
                            size={22}
                            color="#2196F3"
                          />
                          <Text style={styles.modalSectionTitle}>
                            Recommended Solution
                          </Text>
                        </View>
                        <Text style={styles.modalText}>
                          {selectedReport.solution}
                        </Text>
                      </View>
                    )}

                    {selectedReport.organic_solution && (
                      <View style={styles.modalSection}>
                        <View style={styles.sectionTitleRow}>
                          <MaterialCommunityIcons
                            name="leaf"
                            size={22}
                            color="#4CAF50"
                          />
                          <Text style={styles.modalSectionTitle}>
                            Organic Solution
                          </Text>
                        </View>
                        <Text style={styles.modalText}>
                          {selectedReport.organic_solution}
                        </Text>
                      </View>
                    )}

                    {selectedReport.chemical_solution && (
                      <View style={styles.modalSection}>
                        <View style={styles.sectionTitleRow}>
                          <MaterialCommunityIcons
                            name="flask"
                            size={22}
                            color="#FF9800"
                          />
                          <Text style={styles.modalSectionTitle}>
                            Chemical Solution
                          </Text>
                        </View>
                        <Text style={styles.modalText}>
                          {selectedReport.chemical_solution}
                        </Text>
                      </View>
                    )}

                    {selectedReport.prevention_tips && (
                      <View style={styles.modalSection}>
                        <View style={styles.sectionTitleRow}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={22}
                            color="#9C27B0"
                          />
                          <Text style={styles.modalSectionTitle}>
                            Prevention Tips
                          </Text>
                        </View>
                        <Text style={styles.modalText}>
                          {selectedReport.prevention_tips}
                        </Text>
                      </View>
                    )}

                    {selectedReport.status === "completed" &&
                      (selectedReport.review ||
                        selectedReport.recommendation) && (
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={28}
                              color="#4CAF50"
                            />
                            <View style={styles.reviewHeaderText}>
                              <Text style={styles.reviewTitle}>
                                DA Worker Review
                              </Text>
                              {selectedReport.reviewer && (
                                <Text style={styles.reviewerName}>
                                  Reviewed by:{" "}
                                  {selectedReport.reviewer.name || "DA Worker"}
                                </Text>
                              )}
                              {selectedReport.reviewed_at && (
                                <Text style={styles.reviewDate}>
                                  {new Date(
                                    selectedReport.reviewed_at
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                              )}
                            </View>
                          </View>

                          {selectedReport.review && (
                            <View style={styles.reviewSection}>
                              <Text style={styles.reviewSectionTitle}>
                                Review Notes:
                              </Text>
                              <Text style={styles.reviewText}>
                                {selectedReport.review}
                              </Text>
                            </View>
                          )}

                          {selectedReport.recommendation && (
                            <View style={styles.reviewSection}>
                              <Text style={styles.reviewSectionTitle}>
                                Recommendations:
                              </Text>
                              <Text style={styles.reviewText}>
                                {selectedReport.recommendation}
                              </Text>
                            </View>
                          )}

                          <View style={styles.reviewBadge}>
                            <MaterialCommunityIcons
                              name="shield-check"
                              size={16}
                              color="#4CAF50"
                            />
                            <Text style={styles.reviewBadgeText}>
                              Verified by DA Worker
                            </Text>
                          </View>
                        </View>
                      )}

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Severity</Text>
                      <Text style={styles.modalValue}>
                        {getSeverity(selectedReport)}
                      </Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Status</Text>
                      <Text style={styles.modalValue}>
                        {formatStatus(selectedReport.status)}
                      </Text>
                    </View>

                    {selectedReport.date && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>Date</Text>
                        <Text style={styles.modalValue}>
                          {selectedReport.date}
                        </Text>
                      </View>
                    )}
                  </>
                )
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {deletingId && (
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteOverlayContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.deleteOverlayText}>Deleting report...</Text>
          </View>
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
  deleteOverlay: {
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
  deleteOverlayContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: "center",
    minWidth: 200,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteOverlayText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ECECEC",
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fonts.sizes.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: "#fff",
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
    fontWeight: "400",
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: fonts.sizes.sm,
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.md,
  },
  reportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 18,
    shadowColor: "#101828",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0.5,
    marginBottom: 8,
  },
  imageCol: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F3F7F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  reportImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F9F9F7",
    justifyContent: "center",
    alignItems: "center",
  },
  detailCol: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  reportCategory: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  reportAbout: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontWeight: "400",
    marginBottom: 2,
  },
  reportIssue: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  severityPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  severityText: {
    fontSize: fonts.sizes.xs,
    fontWeight: "600",
  },
  reportDate: {
    fontSize: fonts.sizes.xs,
    color: "#ADB5BD",
    marginLeft: 10,
  },
  statusButton: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  statusButtonText: {
    fontWeight: "700",
    fontSize: fonts.sizes.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  reviewCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: spacing.sm,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  reviewSection: {
    marginBottom: spacing.md,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  reviewText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  reviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    marginTop: spacing.sm,
    gap: 4,
  },
  reviewBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: "700",
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalValue: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    fontWeight: "500",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  modalSectionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: "700",
    color: colors.text,
  },
  modalText: {
    fontSize: fonts.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoaderText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ReportsScreen;
