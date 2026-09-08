const path = require('path');

module.exports = function (api) {
  api.cache(true);

  let workletsPluginPath;
  try {
    workletsPluginPath = require.resolve('react-native-worklets-core/plugin');
  } catch (e) {
    workletsPluginPath = require.resolve('react-native-worklets/plugin');
  }

  const reanimatedPluginPath = require.resolve('react-native-reanimated/plugin');

  return {
    presets: [
      ['babel-preset-expo'],
      [
        'nativewind/babel',
        {
          modules: {
            'react-native-worklets': false,
          },
        },
      ],
    ],
    plugins: [
      workletsPluginPath,
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@api': './src/api',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@assets': './assets',
            '@lib': './src/lib',
          },
        },
      ],
      reanimatedPluginPath,
    ],
  };
};
