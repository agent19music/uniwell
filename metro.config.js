// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo configuration
const config = getDefaultConfig(__dirname);

// Simple polyfill for the 'events' module that follows the EventEmitter API
const eventsPolyfill = `
  class EventEmitter {
    constructor() {
      this._events = {};
    }
    
    on(event, listener) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(listener);
      return this;
    }
    
    once(event, listener) {
      const onceWrapper = (...args) => {
        listener(...args);
        this.removeListener(event, onceWrapper);
      };
      this.on(event, onceWrapper);
      return this;
    }
    
    off(event, listener) {
      return this.removeListener(event, listener);
    }
    
    removeListener(event, listener) {
      if (!this._events[event]) return this;
      this._events[event] = this._events[event].filter(l => l !== listener);
      return this;
    }
    
    emit(event, ...args) {
      if (!this._events[event]) return false;
      this._events[event].forEach(listener => listener(...args));
      return true;
    }
    
    listenerCount(event) {
      return this._events[event] ? this._events[event].length : 0;
    }
  }
  
  module.exports = EventEmitter;
  module.exports.EventEmitter = EventEmitter;
  module.exports.once = (emitter, event) => {
    return new Promise((resolve) => {
      emitter.once(event, (...args) => resolve(args.length > 1 ? args : args[0]));
    });
  };
`;

// Create a virtual module resolver for 'events'
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: {
    __esModule: true,
    default: eventsPolyfill,
  },
};

// Add extension handling for module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Add additional resolver for the ws module
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;

