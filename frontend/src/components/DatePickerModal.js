import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function DatePickerModal({ value, onChange, COLORS, minYear = 1940, maxYear, hideText = false }) {
  const today = new Date();
  const maxYearVal = maxYear || today.getFullYear();

  const [visible, setVisible] = useState(false);
  const [viewMonth, setViewMonth] = useState(value ? value.getMonth() : 0);
  const [viewYear, setViewYear] = useState(value ? value.getFullYear() : 2000);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const selected = value || new Date(2000, 0, 1);

  const formatDate = (d) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d) =>
    d &&
    selected.getDate() === d &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;

  const isToday = (d) =>
    d &&
    today.getDate() === d &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isFuture = (d) => {
    if (!d) return false;
    return new Date(viewYear, viewMonth, d) > today;
  };

  const handleDayPress = (d) => {
    if (!d || isFuture(d)) return;
    const picked = new Date(viewYear, viewMonth, d);
    onChange(picked);
    setVisible(false);
  };

  const years = [];
  for (let y = maxYearVal; y >= minYear; y--) years.push(y);

  const styles = getStyles(COLORS);

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.triggerBtn, hideText && { paddingHorizontal: 12 }]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="calendar-month" size={20} color={COLORS.primary} />
        {!hideText && <Text style={styles.triggerText}>{formatDate(value)}</Text>}
        {!hideText && <Icon name="chevron-down" size={20} color={COLORS.textLight} />}
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                <Icon name="chevron-left" size={24} color={COLORS.text} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowYearPicker(p => !p)} style={styles.monthYearBtn}>
                <Text style={styles.monthYearText}>{MONTHS[viewMonth]} {viewYear}</Text>
                <Icon name={showYearPicker ? 'menu-up' : 'menu-down'} size={18} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                <Icon name="chevron-right" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {showYearPicker ? (
              /* Year Picker */
              <ScrollView style={styles.yearList} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearItem, viewYear === y && styles.yearItemActive]}
                    onPress={() => { setViewYear(y); setShowYearPicker(false); }}
                  >
                    <Text style={[styles.yearText, viewYear === y && styles.yearTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <>
                {/* Day labels */}
                <View style={styles.dayLabels}>
                  {DAYS.map(d => (
                    <Text key={d} style={styles.dayLabel}>{d}</Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.grid}>
                  {cells.map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.cell,
                        isSelected(d) && styles.cellSelected,
                        isToday(d) && !isSelected(d) && styles.cellToday,
                      ]}
                      onPress={() => handleDayPress(d)}
                      disabled={!d || isFuture(d)}
                    >
                      <Text style={[
                        styles.cellText,
                        isSelected(d) && styles.cellTextSelected,
                        isToday(d) && !isSelected(d) && styles.cellTextToday,
                        (isFuture(d) || !d) && styles.cellTextDisabled,
                      ]}>
                        {d || ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Footer */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.inputText,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 20,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cellTextSelected: {
    color: '#fff',
    fontWeight: '800',
  },
  cellTextToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  cellTextDisabled: {
    color: COLORS.border,
  },
  yearList: {
    maxHeight: 220,
    marginBottom: 12,
  },
  yearItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 2,
  },
  yearItemActive: {
    backgroundColor: COLORS.primary + '20',
  },
  yearText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  yearTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  closeBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
