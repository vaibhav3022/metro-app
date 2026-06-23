import React, { useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Animated, Image, Dimensions
} from 'react-native';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

// Using local asset because Wikimedia blocks hotlinking from RN apps
const MAP_IMAGE = require('../assets/pune_metro_map.png');

export default function MetroMapScreen() {
  const navigation = useNavigation();
  const { theme: COLORS, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(COLORS), [COLORS]);

  // Pinch-to-Zoom (Gesture)
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);

  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      lastScale.current = Math.max(1, Math.min(lastScale.current, 5)); // Allow zoom out to 1x, in to 5x
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  // Programmatic Zoom (Buttons)
  const handleZoomIn = () => {
    const nextScale = Math.min(lastScale.current + 0.5, 5);
    lastScale.current = nextScale;
    baseScale.setValue(nextScale);
  };

  const handleZoomOut = () => {
    const nextScale = Math.max(lastScale.current - 0.5, 1);
    lastScale.current = nextScale;
    baseScale.setValue(nextScale);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Official Route Map</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.mapContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              bounces={false}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                bounces={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                <PinchGestureHandler
                  onGestureEvent={onPinchEvent}
                  onHandlerStateChange={onPinchStateChange}
                >
                  <Animated.View style={[styles.imageWrapper, { transform: [{ scale: scale }] }]}>
                    <Image 
                      source={MAP_IMAGE}
                      style={styles.mapImage}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </PinchGestureHandler>
              </ScrollView>
            </ScrollView>

            {/* Zoom Controls */}
            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                <Icon name="plus" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                <Icon name="minus" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, letterSpacing: 0.5 },
  
  mapContainer: { 
    flex: 1, 
    backgroundColor: '#ffffff', // Ensure white background for standard maps
    marginHorizontal: 20, 
    marginBottom: 20,
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)', 
    overflow: 'hidden', 
    position: 'relative' 
  },
  
  imageWrapper: { 
    width: width * 1.5, 
    height: height * 0.8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  
  zoomControls: { position: 'absolute', right: 20, bottom: 20, backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  zoomButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  zoomDivider: { height: 1, backgroundColor: COLORS.border },
});
