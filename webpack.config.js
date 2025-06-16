const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { EsbuildPlugin } = require('esbuild-loader');

const scssBasePath = './src/assets/scss/';
const themeBasePath = `${scssBasePath}themes/`;

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    return {
        entry: {
            vendor: ['element-ui', 'noty', 'vue', 'vue-i18n', 'worker-timers'],
            app: {
                import: ['./src/app.js'],
                dependOn: 'vendor'
            },
            vr: {
                import: ['./src/vr.js'],
                dependOn: 'vendor'
            },
            'theme.dark': `${themeBasePath}theme.dark.scss`,
            'theme.darkvanillaold': `${themeBasePath}theme.darkvanillaold.scss`,
            'theme.darkvanilla': `${themeBasePath}theme.darkvanilla.scss`,
            'theme.pink': `${themeBasePath}theme.pink.scss`,
            'theme.material3': `${themeBasePath}theme.material3.scss`,
            'emoji.font': `${scssBasePath}emoji.font.scss`
        },
        output: {
            path: path.resolve(__dirname, 'build/html'),
            filename: '[name].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        hotReload: false
                    }
                },
                {
                    test: /\.[jt]sx?$/,
                    exclude: /node_modules/,
                    loader: 'esbuild-loader',
                    options: {
                        loader: 'js',
                        target: 'es2022'
                    }
                },
                {
                    test: /\.pug$/,
                    use: [
                        { loader: 'raw-loader' },
                        { loader: 'pug-plain-loader' }
                    ]
                },
                {
                    test: /\.s?css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(eot|png|svg|ttf|woff)/,
                    type: 'asset',
                    generator: {
                        filename: 'assets/[name][ext]'
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.css', '.scss'],
            alias: {
                vue: 'vue/dist/vue.esm.js'
            }
        },
        performance: {
            hints: false
        },
        devtool: 'inline-source-map',
        target: ['web', 'es2022'],
        stats: {
            preset: 'errors-warnings',
            timings: true
        },
        plugins: [
            new EsbuildPlugin({
                define: {
                    LINUX: JSON.stringify(process.env.PLATFORM === 'linux'),
                    WINDOWS: JSON.stringify(process.env.PLATFORM === 'windows'),
                    __VUE_I18N_LEGACY_API__: JSON.stringify(false),
                    __VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
                    __INTLIFY_DROP_MESSAGE_COMPILER__: JSON.stringify(true)
                }
            }),
            new VueLoaderPlugin(),
            new MiniCssExtractPlugin({
                filename: '[name].css'
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './src/static/index.html',
                inject: true,
                chunks: ['vendor', 'app', 'emoji.font']
            }),
            new HtmlWebpackPlugin({
                filename: 'vr.html',
                template: './src/static/vr.html',
                inject: true,
                chunks: ['vendor', 'vr', 'emoji.font']
            }),
            new CopyPlugin({
                patterns: [
                    // assets
                    {
                        from: './images/',
                        to: './images/'
                    }
                ]
            }),
            new webpack.ProgressPlugin({})
        ],
        optimization: {
            minimizer: isProduction
                ? [
                      new EsbuildPlugin({
                          target: 'es2022',
                          css: true
                      })
                  ]
                : [],
            splitChunks: {
                chunks: 'all'
            }
        },
        watchOptions: {
            ignored: /node_modules/
        }
    };
};
