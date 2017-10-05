var path = require('path');

module.exports = {
    context: __dirname,
    entry: './src/jv.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname),
        filename: 'jvcharts.min.js'
    },
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    },
    module: {
        rules: [
            //CSS Loader-Loaders run in reverse order so css-loader is applied first
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }, {
                test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
                loader: 'file-loader?name=./dist/resources/[name].[ext]'
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [{
                    loader: 'babel-loader',
                    options: { presets: ['env'] }
                }]
            }
        ]
    },
    resolve: {
        modules: [
            path.resolve('./src'),
            path.resolve('./node_modules')
        ]
    }
};
