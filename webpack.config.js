const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const path = require('path')

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  config.entry = {
    app: path.resolve(__dirname, 'App.web.js'),
  }
  const tailwindRule = {
    test: /\.css$/,
    use: [
      'style-loader',
      'css-loader',
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [require('tailwindcss'), require('autoprefixer')],
          },
        },
      },
    ],
  }
  config.module.rules.push(tailwindRule)
  return config
}
