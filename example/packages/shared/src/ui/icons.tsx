import { StyleSheet, View } from 'react-native';

/**
 * Icons drawn with views, so the showcase needs no icon font or SVG library.
 * Each fits a 24×24 box.
 */
interface IconProps {
  color: string;
}

/** A QR code: three finder patterns and a few modules. */
export function ScanIcon({ color }: IconProps) {
  const finder = (position: object) => (
    <View style={[styles.finder, { borderColor: color }, position]}>
      <View style={[styles.finderDot, { backgroundColor: color }]} />
    </View>
  );
  return (
    <View style={styles.box}>
      {finder({ top: 1, left: 1 })}
      {finder({ top: 1, right: 1 })}
      {finder({ bottom: 1, left: 1 })}
      <View
        style={[styles.module, { backgroundColor: color, right: 1, bottom: 1 }]}
      />
      <View
        style={[styles.module, { backgroundColor: color, right: 7, bottom: 7 }]}
      />
      <View
        style={[styles.module, { backgroundColor: color, right: 1, bottom: 9 }]}
      />
    </View>
  );
}

/** A grid of four tiles: the SDK's start screen. */
export function DashboardIcon({ color }: IconProps) {
  return (
    <View style={[styles.box, styles.grid]}>
      {[0, 1, 2, 3].map((tile) => (
        <View key={tile} style={[styles.tile, { borderColor: color }]} />
      ))}
    </View>
  );
}

/** The pharmacy cross. */
export function PharmacyIcon({ color }: IconProps) {
  return (
    <View style={styles.box}>
      <View style={[styles.crossVertical, { backgroundColor: color }]} />
      <View style={[styles.crossHorizontal, { backgroundColor: color }]} />
    </View>
  );
}

/** A shopping bag. */
export function BagIcon({ color }: IconProps) {
  return (
    <View style={styles.box}>
      <View style={[styles.bagHandle, { borderColor: color }]} />
      <View style={[styles.bagBody, { borderColor: color }]} />
    </View>
  );
}

export function ChevronIcon({ color }: IconProps) {
  return <View style={[styles.chevron, { borderColor: color }]} />;
}

export function CheckIcon({ color }: IconProps) {
  return <View style={[styles.check, { borderColor: color }]} />;
}

const STROKE = 2;

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
  },
  finder: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderWidth: STROKE,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderDot: {
    width: 3,
    height: 3,
    borderRadius: 0.5,
  },
  module: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 1,
  },
  tile: {
    width: 9,
    height: 9,
    borderWidth: STROKE,
    borderRadius: 2.5,
  },
  crossVertical: {
    position: 'absolute',
    left: 8.5,
    top: 2,
    width: 7,
    height: 20,
    borderRadius: 2,
  },
  crossHorizontal: {
    position: 'absolute',
    left: 2,
    top: 8.5,
    width: 20,
    height: 7,
    borderRadius: 2,
  },
  bagHandle: {
    position: 'absolute',
    top: 1,
    left: 7,
    width: 10,
    height: 9,
    borderWidth: STROKE,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  bagBody: {
    position: 'absolute',
    top: 7,
    left: 2,
    width: 20,
    height: 16,
    borderWidth: STROKE,
    borderRadius: 4,
  },
  chevron: {
    width: 8,
    height: 8,
    marginRight: 3,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
    transform: [{ rotate: '45deg' }],
  },
  check: {
    width: 7,
    height: 12,
    marginTop: -3,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: '45deg' }],
  },
});
