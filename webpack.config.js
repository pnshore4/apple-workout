const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Entry point of your application
  output: {
    filename: 'bundle.js', // Output bundled file
    path: path.resolve(__dirname, 'dist'), // Output directory
    clean: true, // Clean the output directory before emit
  },
  mode: 'development', // Change to 'production' for production builds
  module: {
    rules: [
      {
        test: /\.css$/i, // Handle CSS files
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.js$/, // Handle JavaScript files
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // Transpile JS if needed
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js'], // Resolve these extensions
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Template HTML file
      filename: 'index.html', // Output file name
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // Serve content from the 'dist' directory
    },
    compress: true, // Enable gzip compression
    port: 8080, // Specify a port number if desired
    open: true, // Open the browser after the server starts
    hot: true, // Enable hot module replacement
  },
};