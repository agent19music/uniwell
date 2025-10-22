// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// --- burnt web support ---
config.resolver.sourceExts.push('mjs');
config.resolver.sourceExts.push('cjs');
// --- end burnt ---

module.exports = config;
