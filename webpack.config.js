'use strict';

var webpack = require('webpack');
var path = require('path');

module.exports = function(options) {
    var babelConfig =  {
        presets: [
            [require.resolve('babel-preset-es2015'), { loose: true }],
            require.resolve('babel-preset-react')
        ]
    };

    var config = {
        resolveLoader: {root: path.join(__dirname, 'node_modules')},
        resolve: {
            extensions: ['', '.js', '.ts', '.jsx', '.tsx']
        },
        entry: {},
        output: {
            filename: '[name].js',
            library: 'Survey',
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        externals: {
            'react': {
                root: 'React',
                commonjs2: 'react',
                commonjs: 'react',
                amd: 'react'
            },
            'react-dom': {
                root: 'ReactDOM',
                commonjs2: 'react-dom',
                commonjs: 'react-dom',
                amd: 'react-dom'
            },
            'knockout': {
                root: 'ko',
                commonjs2: 'knockout',
                commonjs: 'knockout',
                amd: 'knockout'
            }
        },
        module: {
            loaders: [
                {
                    test: /\.(ts|tsx)$/,
                    loaders:[
                        require.resolve('babel-loader') + '?' + JSON.stringify(babelConfig), // TODO why do we need it
                        require.resolve('awesome-typescript-loader')
                    ]
                },
                {
                    test: /\.(js|jsx)$/,
                    loader: require.resolve('babel-loader'),
                    query: babelConfig
                }
            ]
        },
        debug: true,
        plugins: [
            new webpack.NoErrorsPlugin()
        ],
        devtool: 'cheap-inline-module-source-map'
    };

    config.entry[options.bundleName] = path.resolve(__dirname, options.entryPoint);

    return config;
};