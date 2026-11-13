import { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IaSdkScreenView,
  type IaSdkScreenEmbedStyle,
  type IaSdkScreenViewId,
} from '@ihreapotheken/ia-sdk-core';
import { eventLog } from '../testing/eventLog';

export interface EmbeddedScreenRequest {
  screen: IaSdkScreenViewId;
  embedStyle: IaSdkScreenEmbedStyle;
}

/**
 * Shows an SDK screen embedded with `IaSdkScreenView` over the whole app, the
 * way an app would show it in a pushed or presented screen of its navigator.
 *
 * On iOS the SDK's back or close button (from the embed style) closes it. The
 * Android SDK shows neither, so there a close bar and the back action do.
 */
export function EmbeddedScreen({
  request,
  onClose,
}: {
  request: EmbeddedScreenRequest;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  return (
    <View style={[styles.overlay, { paddingTop: insets.top }]}>
      {Platform.OS === 'android' && (
        <View style={styles.closeBar}>
          <Text style={styles.closeBarTitle}>
            {request.screen} ({request.embedStyle})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBarButton}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
      <IaSdkScreenView
        screen={request.screen}
        embedStyle={request.embedStyle}
        onDismiss={() => {
          eventLog.add('Embedded screen', `${request.screen} dismissed`);
          onClose();
        }}
        style={styles.screen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  closeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
  },
  closeBarTitle: {
    fontSize: 13,
    color: '#666',
  },
  closeBarButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  screen: {
    flex: 1,
  },
});
