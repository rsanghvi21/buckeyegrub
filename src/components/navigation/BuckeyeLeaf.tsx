import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '@/src/constants/theme';

export interface BuckeyeLeafProps {
  size?: number;
  color?: string;
  stemColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * BuckeyeLeaf: Official Ohio State Buckeye palmately compound leaf motif (5 leaflets).
 */
export const BuckeyeLeaf: React.FC<BuckeyeLeafProps> = ({
  size = 28,
  color = colors.scarlet,
  stemColor = colors.grayDark,
  style,
}) => {
  // Single leaflet path centered at origin (0, 0) pointing upwards to (0, -32)
  const leafletPath =
    'M 0 0 C -7 -10, -10 -22, 0 -32 C 10 -22, 7 -10, 0 0 Z';

  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="-40 -40 80 80">
        <G>
          {/* Stem */}
          <Path
            d="M 0 0 C 1 12, 3 24, 6 32"
            stroke={stemColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Lower Left Leaflet (-80°) */}
          <G transform="rotate(-80)">
            <Path d={leafletPath} fill={color} opacity={0.92} />
          </G>

          {/* Upper Left Leaflet (-40°) */}
          <G transform="rotate(-40)">
            <Path d={leafletPath} fill={color} />
          </G>

          {/* Center Top Leaflet (0°) */}
          <G transform="rotate(0) scale(1.1)">
            <Path d={leafletPath} fill={color} />
          </G>

          {/* Upper Right Leaflet (+40°) */}
          <G transform="rotate(40)">
            <Path d={leafletPath} fill={color} />
          </G>

          {/* Lower Right Leaflet (+80°) */}
          <G transform="rotate(80)">
            <Path d={leafletPath} fill={color} opacity={0.92} />
          </G>

          {/* Center Node */}
          <Path
            d="M -3 -3 A 4 4 0 1 1 3 3 A 4 4 0 1 1 -3 -3"
            fill={colors.scarletDeep}
          />
        </G>
      </Svg>
    </View>
  );
};

export default BuckeyeLeaf;
