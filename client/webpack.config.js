const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');


module.exports = {
  mode: 'production',
  entry: {
    index: './src/scripts/index.js',
    playVideo: './src/scripts/play-video.js',
    aboutUs: './src/pages/about/aboutUs.js',
    settings: './src/pages/settings/settings.js',
    profile: './src/pages/profile/profile.js', // <-- Added entry for profile  
    // admin: './src/pages/admin/admin.js', // Old tab-based UI - replaced by admin-dashboard.html

  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'scripts/[name].[contenthash].js',
    assetModuleFilename: 'assets/[name].[hash][ext][query]',
    clean: true,
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
      forOf: false,
      module: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,   // No need to bundle node_modules (and you're using Firebase from CDN)
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                useBuiltIns: 'usage',
                corejs: 3,

              }]
            ],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|mp4|woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(mp3|m4a|ogg)$/i, // Match audio file extensions
        type: 'asset/resource', // Use Webpack's asset/resource module
      },

    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/pages/index.html',
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      filename: 'play-video.html',
      template: './src/pages/play-video.html',
      chunks: ['playVideo'],
    }),
    new HtmlWebpackPlugin({
      filename: 'about-us.html',
      template: './src/pages/about/about-us.html',
      chunks: ['aboutUs'],
    }),
    new HtmlWebpackPlugin({
      filename: 'settings.html',
      template: './src/pages/settings/settings.html',
      chunks: ['settings'],
    }),
  
    new HtmlWebpackPlugin({
      filename: 'profile.html',
      template: './src/pages/profile/profile.html',
      chunks: ['profile'],
    }),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[contenthash].css',
    }),

   
  
  ],
  resolve: {
    alias: {
      '@styles': path.resolve(__dirname, 'styles'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@utils': path.resolve(__dirname, 'src/utils'), // <-- Added alias for utils
    },
  },
 
};
