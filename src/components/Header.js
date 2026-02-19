import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { colors, fonts, spacing } from '../styles/theme';

const Header = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBack = false,
  transparent = false,
}) => {
  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      <StatusBar
        barStyle={transparent ? 'dark-content' : 'light-content'}
        backgroundColor={transparent ? 'transparent' : colors.primary}
      />
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {(leftIcon || showBack) && (
            <TouchableOpacity onPress={onLeftPress} style={styles.iconButton}>
              {leftIcon || <Text style={styles.backIcon}>←</Text>}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, transparent && styles.titleDark]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, transparent && styles.subtitleDark]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightContainer}>
          {rightIcon && (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '600',
    color: colors.white,
  },
  titleDark: {
    color: colors.text,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  subtitleDark: {
    color: colors.textSecondary,
  },
  iconButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
  },
});

export default Header;
