import * as React from 'react';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  Dimensions,
  Image,
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import {
  scanBarcodes,
  BarcodeFormat,
  Barcode,
  Rect,
} from 'vision-camera-code-scanner';
import { uniqBy } from 'lodash-es';

export default function App() {
  const devices = useCameraDevices();
  const device = devices.back;
  const [hasPermission, setHasPermission] = React.useState(false);
  const [barcodes, setBarcodes] = React.useState<Barcode[]>([]);
  const scanArea = React.useRef<Rect>({ top: 0, left: 0, right: 0, bottom: 0 });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const data = scanBarcodes(frame, [BarcodeFormat.ALL_FORMATS], {
      checkInverted: true,
    });
    runOnJS(setBarcodes)(data);
  }, []);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height, x, y } = e.nativeEvent.layout;
    scanArea.current = {
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
    };
  };

  React.useEffect(() => {
    const _barCodes = uniqBy(barcodes, 'displayValue');

    if (_barCodes.length > 0) {
      const barCode = _barCodes[0];
      const { boundingBox } = barCode;
      if (!boundingBox) return;
      // 判断只有在boundingBox在scanArea里面时才算扫码成功
      if (
        boundingBox.top >= scanArea.current.top &&
        boundingBox.bottom <= scanArea.current.bottom &&
        boundingBox.left >= scanArea.current.left &&
        boundingBox.right <= scanArea.current.right
      ) {
        // 业务逻辑在这里，拿到value后进行跳转
      }
    }
  }, [barcodes]);

  const scannerValue = useSharedValue(0);
  React.useEffect(() => {
    scannerValue.value = withRepeat(withTiming(270, {duration: 2000}), -1, true);
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scannerValue.value }],
    };
  });

  return (
    <>
      {device != null && hasPermission && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
          />
        </>
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <View style={styles.scan} onLayout={handleLayout}>
          <Image
            source={require('../assets/left-corner.png')}
            style={[styles.corner, styles.topLeft]}
          />
          <Image
            source={require('../assets/right-corner.png')}
            style={[styles.corner, styles.topRight]}
          />
          <Image
            source={require('../assets/left-corner.png')}
            style={[styles.corner, styles.bottomLeft]}
          />
          <Image
            source={require('../assets/right-corner.png')}
            style={[styles.corner, styles.bottomRight]}
          />
          <Animated.Image
            source={require('../assets/scan-line.png')}
            style={[
              animatedStyle,
              { width: 280, height: 6 },
            ]}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  scan: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'white',
    width: 280,
    height: 280,
  },
  corner: {
    width: 25,
    height: 25,
    position: 'absolute',
  },
  topLeft: {
    transform: [{ rotateX: '0deg' }],
    left: -3,
    top: -3,
  },
  topRight: {
    transform: [{ rotateX: '0deg' }],
    right: -3,
    top: -3,
  },
  bottomLeft: {
    transform: [{ rotateX: '180deg' }],
    bottom: -3,
    left: -3,
  },
  bottomRight: {
    transform: [{ rotateX: '180deg' }],
    bottom: -3,
    right: -3,
  },
});
