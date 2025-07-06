const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const commonConfig = {
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const panel = env?.panel || 'left';

  if (panel === 'left') {
    return {
      ...commonConfig,
      name: 'left-panel',
      mode: isProduction ? 'production' : 'development',
      entry: './src/left_panel/index.tsx',
      output: {
        path: path.resolve(__dirname, 'dist/left_panel'),
        filename: 'bundle.js',
        clean: true,
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/left_panel/index.html',
          filename: 'index.html',
        }),
      ],
      devServer: {
        static: {
          directory: path.join(__dirname, 'dist/left_panel'),
        },
        port: 8001,
        hot: true,
        open: false,
        historyApiFallback: true,
      },
    };
  } else {
    return {
      ...commonConfig,
      name: 'right-panel',
      mode: isProduction ? 'production' : 'development',
      entry: './src/right_panel/index.tsx',
      output: {
        path: path.resolve(__dirname, 'dist/right_panel'),
        filename: 'bundle.js',
        clean: true,
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: './src/right_panel/index.html',
          filename: 'index.html',
        }),
      ],
      devServer: {
        static: {
          directory: path.join(__dirname, 'dist/right_panel'),
        },
        port: 8002,
        hot: true,
        open: false,
        historyApiFallback: true,
      },
    };
  }
};
