import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing } from '../../styles/theme';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => logout() 
        },
      ]
    );
  };

  const profileItems = [
    {
      id: 1,
      icon: 'person-outline',
      label: 'Name',
      value: user?.name || 'N/A',
    },
    {
      id: 2,
      icon: 'mail-outline',
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      id: 3,
      icon: 'location-outline',
      label: 'Address',
      value: user?.address || 'N/A',
    },
    {
      id: 4,
      icon: 'shield-checkmark-outline',
      label: 'Role',
      value: user?.role === 'DA_workers' ? 'DA Worker' : 'Farmer',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={colors.primary} />
          </View>
          <Text style={styles.userName}>{(user?.name || 'User').toUpperCase()}</Text>
          <Text style={styles.userRole}>
            {user?.role === 'DA_workers' ? 'DA Worker' : 'Farmer'}
          </Text>
        </View>

        <View style={styles.infoSection}>
          {profileItems.map((item) => (
            <View key={item.id} style={styles.infoItem}>
              <View style={styles.infoLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 40,
    paddingBottom: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: '#fff',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: '#fff',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  infoValue: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  logoutButtonText: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileScreen;
