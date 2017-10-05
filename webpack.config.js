var path = require('path');

module.exports = {
    context: __dirname,
    entry: [
        //Set up an ES6-ish environment
        'babel-polyfill',

        //Add your application's scripts below
        './src/jv.js'
    ],
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
        loaders: [
            {
                loader: 'babel-loader',

                //Skip any files outside of your project's `src` directory
                include: [
                    path.resolve(__dirname, 'src')
                ],

                //Only run `.js` and `.jsx` files through Babel
                test: /\.jsx?$/,

                //Options to configure babel with
                query: {
                    plugins: ['transform-runtime'],
                    presets: ['env', 'stage-0']
                }
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
