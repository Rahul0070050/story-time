const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable require.context for Expo Router
config.transformer.unstable_allowRequireContext = true;

module.exports = config;