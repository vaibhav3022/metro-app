import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

const { height } = Dimensions.get('window');

export default function CustomDropdown({ data, selectedValue, onValueChange, placeholder }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={styles.dropdownBtn}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectedText, !selectedValue && { color: '#999' }]}>
          {selectedValue || placeholder || 'Select Option'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Modal / Popup */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{placeholder || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionBtn,
                    selectedValue === item && styles.optionBtnSelected
                  ]}
                  onPress={() => {
                    onValueChange(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === item && styles.optionTextSelected
                  ]}>
                    {item}
                  </Text>
                  {selectedValue === item && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 102, 204, 0.2)', // Light primary color
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  optionBtnSelected: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
