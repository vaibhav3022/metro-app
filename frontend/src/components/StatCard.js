import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ title, value, iconName, iconColor = '#0066CC', bgColor = '#EFF6FF', subtitle, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <Wrapper
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Icon name={iconName || 'chart-bar'} size={24} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Wrapper>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: { flex: 1 },
  title: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  value: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, fontWeight: '600', color: '#22c55e', marginTop: 2 },
});
