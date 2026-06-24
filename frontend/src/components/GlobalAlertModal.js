import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Alert as RNAlert } from 'react-native';

const originalAlert = RNAlert.alert;

// A global reference to register show/hide
export const globalAlertRef = {
  current: null
};

// Monkey patch Alert.alert globally
RNAlert.alert = (title, message, buttons, options) => {
  if (globalAlertRef.current) {
    globalAlertRef.current.show(title, message, buttons, options);
  } else {
    originalAlert(title, message, buttons, options);
  }
};

export const GlobalAlertModal = () => {
  const { theme: COLORS, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
    options: {}
  });

  const scaleValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    globalAlertRef.current = {
      show: (title, message, buttons, options) => {
        setAlertData({ title, message, buttons, options });
        setVisible(true);
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }).start();
      },
      hide: () => {
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }
    };
    return () => {
      globalAlertRef.current = null;
    };
  }, []);

  const handleClose = (btn) => {
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      if (btn && btn.onPress) {
        btn.onPress();
      }
    });
  };

  if (!visible) return null;

  const { title, message, buttons } = alertData;
  const displayButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', onPress: () => {} }];

  // Determine icon type based on content
  const getIconDetails = () => {
    const textToSearch = `${title || ''} ${message || ''}`.toLowerCase();
    if (textToSearch.includes('success') || textToSearch.includes('verified') || textToSearch.includes('complete') || textToSearch.includes('added') || textToSearch.includes('thank') || textToSearch.includes('successful')) {
      return {
        name: 'checkbox-marked-circle-outline',
        color: '#00C9A7',
        bg: 'rgba(0, 201, 167, 0.12)'
      };
    }
    if (textToSearch.includes('error') || textToSearch.includes('fail') || textToSearch.includes('denied') || textToSearch.includes('invalid') || textToSearch.includes('insufficient') || textToSearch.includes('cancel')) {
      return {
        name: 'alert-circle-outline',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)'
      };
    }
    if (textToSearch.includes('warning') || textToSearch.includes('caution') || textToSearch.includes('notice') || textToSearch.includes('confirm') || textToSearch.includes('sure')) {
      return {
        name: 'alert-outline',
        color: '#FF9800',
        bg: 'rgba(255, 152, 0, 0.12)'
      };
    }
    return {
      name: 'information-outline',
      color: COLORS.primary || '#0D47A1',
      bg: isDark ? 'rgba(30, 136, 229, 0.15)' : 'rgba(13, 71, 161, 0.12)'
    };
  };

  const iconDetails = getIconDetails();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => handleClose()}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[
          styles.alertCard,
          { transform: [{ scale: scaleValue }], backgroundColor: COLORS.cardBg, borderColor: COLORS.border }
        ]}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: iconDetails.bg }]}>
            <Icon name={iconDetails.name} size={36} color={iconDetails.color} />
          </View>

          {/* Title */}
          {title ? (
            <Text style={[styles.title, { color: COLORS.text }]}>{title}</Text>
          ) : null}

          {/* Message */}
          {message ? (
            <Text style={[styles.message, { color: COLORS.textLight }]}>{message}</Text>
          ) : null}

          {/* Buttons */}
          <View style={[
            styles.buttonsContainer,
            displayButtons.length > 2 ? styles.buttonsStacked : styles.buttonsRow
          ]}>
            {displayButtons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              // If it's a primary action (e.g. single button, or second button in 2 buttons)
              const isPrimary = displayButtons.length === 1 || (displayButtons.length === 2 && index === 1);

              if (isPrimary && !isCancel && !isDestructive) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.primaryButtonWrap}
                    onPress={() => handleClose(btn)}
                  >
                    <LinearGradient
                      colors={[COLORS.secondary, COLORS.secondary]}
                      style={styles.primaryButtonGrad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.primaryButtonText}>{btn.text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              // Otherwise outline style button
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.outlineButton, 
                    { borderColor: COLORS.border },
                    isDestructive && { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }
                  ]}
                  onPress={() => handleClose(btn)}
                >
                  <Text style={[
                    styles.outlineButtonText, 
                    { color: COLORS.text },
                    isDestructive && { color: '#EF4444' },
                    isCancel && { color: COLORS.textLight }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonsStacked: {
    flexDirection: 'column',
  },
  primaryButtonWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
