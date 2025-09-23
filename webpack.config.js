const path = require('path');

module.exports = {
    entry: {
        popup: './popup/popup.js',
        'service-worker': './background/service-worker.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    },
    mode: process.env.NODE_ENV || 'development'
};