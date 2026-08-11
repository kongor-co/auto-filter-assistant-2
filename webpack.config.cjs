const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: { popup: './src/app/index.tsx', background: './src/extension/background.ts', content: './src/extension/content.ts' },
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].js', clean: true },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: { rules: [
    { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] }
  ] },
  plugins: [
    new CopyPlugin({ patterns: [{ from: 'src/manifest.json' }, { from: '_locales', to: '_locales' }] }),
    new HtmlWebpackPlugin({ template: 'src/app/popup.html', filename: 'popup.html', chunks: ['popup'] })
  ],
  devtool: false
};
