const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Prevent react-leaflet and leaflet from being bundled into native builds
const NATIVE_EXCLUDED = ['react-leaflet', 'leaflet'];
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (
      platform !== 'web' &&
      NATIVE_EXCLUDED.some((pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/'))
    ) {
      return { type: 'empty' };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
