import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Animated
} from 'react-native';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const PURPLE_STATIONS = [
  "PCMC", "Sant Tukaram Nagar", "Bhosari", "Kasarwadi",
  "Phugewadi", "Dapodi", "Bopodi", "Khadki", "Range Hills",
  "Shivaji Nagar", "Civil Court", "Budhwar Peth", "Mandai", "Swargate"
];

const AQUA_STATIONS = [
  "Vanaz", "Anand Nagar", "Ideal Colony", "Nal Stop",
  "Garware College", "Deccan", "Sambhaji Udyan",
  "PMC", "Civil Court", "Mangalwar Peth", "Pune Stn",
  "Ruby Hall", "Bund Garden", "Yerawada", "Kalyani Nagar", "Ramwadi"
];

export default function MetroMapScreen() {
  const navigation = useNavigation();
  // Programmatic Zoom (Buttons)
  const handleZoomIn = () => {
    const nextScale = Math.min(lastScale.current + 0.25, 4);
    lastScale.current = nextScale;
    baseScale.setValue(nextScale);
  };

  const handleZoomOut = () => {
    const nextScale = Math.max(lastScale.current - 0.25, 0.5);
    lastScale.current = nextScale;
    baseScale.setValue(nextScale);
  };

  // Pinch-to-Zoom (Gesture)
  const baseScale = React.useRef(new Animated.Value(1)).current;
  const pinchScale = React.useRef(new Animated.Value(1)).current;
  const lastScale = React.useRef(1);

  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      lastScale.current *= event.nativeEvent.scale;
      lastScale.current = Math.max(0.5, Math.min(lastScale.current, 4));
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  };

  const PURPLE_X = 160;
  const PURPLE_START_Y = 60;
  const PURPLE_SPACING = 50;
  const CIVIL_COURT_IDX_PURPLE = 10;
  const CIVIL_COURT_Y = PURPLE_START_Y + CIVIL_COURT_IDX_PURPLE * PURPLE_SPACING;

  const AQUA_SPACING = 50;
  const CIVIL_COURT_IDX_AQUA = 8;
  const AQUA_START_X = PURPLE_X - CIVIL_COURT_IDX_AQUA * AQUA_SPACING;
  const AQUA_END_X = AQUA_START_X + (AQUA_STATIONS.length - 1) * AQUA_SPACING;

  const SVG_WIDTH = Math.max(AQUA_END_X + 60, 500);
  const SVG_HEIGHT = PURPLE_START_Y + (PURPLE_STATIONS.length - 1) * PURPLE_SPACING + 100;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={['#0A0A1A', '#0D1B3E', '#1A0A3E']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interactive Route Map</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.mapContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <PinchGestureHandler
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View style={[styles.svgWrapper, { transform: [{ scale: scale }] }]}>
                  <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
                    {/* Background already handled by gradient, so transparent SVG */}
                    
                    {/* Purple Line */}
                    <Line
                      x1={PURPLE_X} y1={PURPLE_START_Y}
                      x2={PURPLE_X} y2={PURPLE_START_Y + (PURPLE_STATIONS.length - 1) * PURPLE_SPACING}
                      stroke="#9B59B6" strokeWidth="8" strokeLinecap="round"
                    />

                    {/* Aqua Line */}
                    <Line
                      x1={AQUA_START_X} y1={CIVIL_COURT_Y}
                      x2={AQUA_END_X} y2={CIVIL_COURT_Y}
                      stroke="#00C9A7" strokeWidth="8" strokeLinecap="round"
                    />

                    {/* Purple Stations */}
                    {PURPLE_STATIONS.map((station, i) => {
                      const x = PURPLE_X;
                      const y = PURPLE_START_Y + i * PURPLE_SPACING;
                      const isInterchange = station === 'Civil Court';
                      return (
                        <React.Fragment key={`p-${i}`}>
                          <Circle cx={x} cy={y} r={isInterchange ? 12 : 6} fill="#0A0A1A" stroke={isInterchange ? '#fff' : '#9B59B6'} strokeWidth={isInterchange ? 4 : 3} />
                          <SvgText x={x + 20} y={y + 5} fill="#fff" fontSize="13" fontWeight="bold">
                            {station}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}

                    {/* Aqua Stations */}
                    {AQUA_STATIONS.map((station, i) => {
                      const x = AQUA_START_X + i * AQUA_SPACING;
                      const y = CIVIL_COURT_Y;
                      const isInterchange = station === 'Civil Court';
                      return (
                        <React.Fragment key={`a-${i}`}>
                          {!isInterchange && (
                            <Circle cx={x} cy={y} r="6" fill="#0A0A1A" stroke="#00C9A7" strokeWidth="3" />
                          )}
                          <SvgText
                            x={x}
                            y={y - 16}
                            fill="#fff"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                            transform={`rotate(-45, ${x}, ${y})`}
                          >
                            {station}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </Animated.View>
              </PinchGestureHandler>
            </ScrollView>
          </ScrollView>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
              <Icon name="plus" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
              <Icon name="minus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Line Legend</Text>
          <View style={styles.legendItems}>
            {[
              { color: '#9B59B6', label: 'Purple Line (PCMC–Swargate)' },
              { color: '#00C9A7', label: 'Aqua Line (Vanaz–Ramwadi)' },
              { color: '#EF4444', label: 'Line 3 (Hinjawadi–Civil Court) - Planned' },
            ].map(item => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  
  mapContainer: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', marginHorizontal: 20, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' },
  svgWrapper: { padding: 20 },
  
  zoomControls: { position: 'absolute', right: 20, bottom: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  zoomButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  zoomDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  legend: { backgroundColor: 'rgba(10,10,26,0.9)', padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 20 },
  legendTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 16, letterSpacing: 0.5 },
  legendItems: { flexDirection: 'column', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  legendLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
});
