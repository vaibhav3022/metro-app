import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, FlatList, SectionList, SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function StationPicker({
  label,
  value,
  onSelect,
  stations = [],
  sections = null,
  placeholder = 'Select Station',
}) {
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredStations = stations.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (station) => {
    onSelect(station);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selector, isOpen && styles.selectorOpen]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Icon name="train" size={18} color="#00C9A7" style={{ marginRight: 10 }} />
        <Text style={[styles.selectorText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={20} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => { setIsOpen(false); setSearch(''); }}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => { setIsOpen(false); setSearch(''); }}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Icon name="magnify" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search station..."
                placeholderTextColor="#AAAAAA"
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {sections && sections.length > 0 ? (
              <SectionList
                sections={sections.map(sec => ({
                  ...sec,
                  data: sec.data.filter(s => s.toLowerCase().includes(search.toLowerCase()))
                })).filter(sec => sec.data.length > 0)}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({ section: { title, color } }) => (
                  <View style={[styles.sectionHeader, { borderLeftColor: color || COLORS.primary }]}>
                    <Text style={styles.sectionHeaderText}>{title}</Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.stationItem, value === item && styles.stationItemActive]}
                    onPress={() => handleSelect(item)}
                  >
                    <Icon
                      name={value === item ? 'radiobox-marked' : 'radiobox-blank'}
                      size={18}
                      color={value === item ? '#00C9A7' : COLORS.textLight}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.stationName, value === item && styles.stationNameActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyItem}>
                    <Text style={styles.emptyText}>No stations found.</Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <FlatList
                data={filteredStations}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.stationItem, value === item && styles.stationItemActive]}
                    onPress={() => handleSelect(item)}
                  >
                    <Icon
                      name={value === item ? 'radiobox-marked' : 'radiobox-blank'}
                      size={18}
                      color={value === item ? '#00C9A7' : COLORS.textLight}
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.stationName, value === item && styles.stationNameActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyItem}>
                    <Text style={styles.emptyText}>No stations found.</Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  wrapper: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textLight, marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selectorOpen: { borderColor: '#00C9A7' },
  selectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  placeholderText: { color: COLORS.textLight, fontWeight: '400' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 12, marginLeft: 8 },
  stationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  stationItemActive: { backgroundColor: 'rgba(0,201,167,0.1)' },
  stationName: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  stationNameActive: { color: '#00C9A7', fontWeight: '800' },
  emptyItem: { padding: 32, alignItems: 'center' },
  emptyText: { color: COLORS.textLight, fontSize: 14 },
  sectionHeader: { backgroundColor: COLORS.background, paddingVertical: 8, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, borderLeftWidth: 4 },
  sectionHeaderText: { fontSize: 13, fontWeight: '800', color: COLORS.text, letterSpacing: 0.5, textTransform: 'uppercase' },
});
