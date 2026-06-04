import React from 'react';
import { View, Text } from 'react-native';

export const Camera = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    <Text style={{ color: '#fff' }}>Camera not supported on Web</Text>
  </View>
);
export const CameraType = { Back: 'back', Front: 'front' };
export default { Camera, CameraType };
