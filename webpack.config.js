const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const RemovePlugin = require('remove-files-webpack-plugin')

const isProduction = (process.env.NODE_ENV === 'production')

module.exports = {
  entry: {
    main: [path.join(__dirname, 'src', 'templates', 'main.jsx'), path.join(__dirname, 'src', 'index.scss')],
    remote: [path.join(__dirname, 'src', 'templates', 'remote.jsx'), path.join(__dirname, 'src', 'index.scss')],
    cartel: [path.join(__dirname, 'src', 'templates', 'cartel.jsx'), path.join(__dirname, 'src', 'index.scss')],
    draw: [path.join(__dirname, 'src', 'templates', 'draw.jsx'), path.join(__dirname, 'src', 'index.scss')],
    paint: [path.join(__dirname, 'src', 'templates', 'paint.jsx'), path.join(__dirname, 'src', 'index.scss')]
  },

  output: {
    publicPath: '/',
    filename: '[name].js',
    path: path.join(__dirname, isProduction ? 'build' : 'src')
  },

  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      abstractions: path.join(__dirname, 'src', 'abstractions'),
      components: path.join(__dirname, 'src', 'components'),
      controllers: path.join(__dirname, 'src', 'controllers'),
      icons: path.join(__dirname, 'src', 'icons'),
      utils: path.join(__dirname, 'src', 'utils'),
      store: path.join(__dirname, 'src', 'store.js')
    }
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'ifdef-loader',
        options: { DEVELOPMENT: !isProduction }
      },
      {
        test: /\.(scss)$/,
        use: [
          (isProduction
            ? { loader: MiniCssExtractPlugin.loader }
            : { loader: 'style-loader', options: { sourceMap: true } }
          ),
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true,
              minimize: isProduction
            }
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true }
          }
        ],
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.svg$/i,
        use: 'raw-loader'
      }
    ]
  },

  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',

  optimization: {
    // Do not minimize output, because some parts of the code need to display <instance>.constructor.name
    minimize: false
  },

  plugins: [
    new webpack.ProvidePlugin({
      h: [path.join(__dirname, 'src', 'utils', 'jsx'), 'h']
    }),
    ...(isProduction
      ? [
        new RemovePlugin({ before: { include: [path.join(__dirname, 'build')] } }),
        new MiniCssExtractPlugin({ filename: 'bundle.css' }),
        new webpack.DefinePlugin({ 'process.env': { NODE_ENV: '"production"' } }),
        new webpack.optimize.OccurrenceOrderPlugin()
      ]
      : [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ]
    )
  ]
}
