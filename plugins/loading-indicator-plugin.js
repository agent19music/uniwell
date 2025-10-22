const { withAndroidStyles, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withLoadingIndicatorAndroid = (config) => {
  return withAndroidStyles(config, (config) => {
    const { styles } = config.modResults;
    
    // Find the AppTheme or create it
    let appTheme = styles?.resources?.style?.find(style => 
      style.$?.name === 'AppTheme'
    );
    
    if (!appTheme) {
      // Create AppTheme if it doesn't exist
      if (!styles.resources) styles.resources = {};
      if (!styles.resources.style) styles.resources.style = [];
      
      appTheme = {
        $: { name: 'AppTheme', parent: 'Theme.Material3Expressive.DayNight.NoActionBar' },
        item: []
      };
      styles.resources.style.push(appTheme);
    } else {
      // Update parent theme to Material3Expressive
      appTheme.$.parent = 'Theme.Material3Expressive.DayNight.NoActionBar';
    }
    
    // Ensure the theme has the necessary items
    if (!appTheme.item) appTheme.item = [];
    
    // Add or update required theme items
    const requiredItems = [
      { $: { name: 'android:enforceNavigationBarContrast', 'tools:targetApi': '29' }, _: 'true' },
      { $: { name: 'android:editTextBackground' }, _: '@drawable/rn_edit_text_material' }
    ];
    
    requiredItems.forEach(requiredItem => {
      const existingItem = appTheme.item.find(item => 
        item.$?.name === requiredItem.$.name
      );
      
      if (!existingItem) {
        appTheme.item.push(requiredItem);
      }
    });
    
    return config;
  });
};

const withLoadingIndicator = (config) => {
  return withPlugins(config, [
    withLoadingIndicatorAndroid,
  ]);
};

module.exports = withLoadingIndicator;