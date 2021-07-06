import TerserPlugin from "terser-webpack-plugin";
import WebpackShellPlugin from 'webpack-shell-plugin';
import webpack from 'webpack';

let webpackConfig = {
    entry: './src/yoffee.js',
    // devtool: "source-map",
    output: {
        filename: "yoffee.min.js",
        library: "yoffee",
        libraryTarget: "var"
    },
    plugins: [
        // Because webpack doesn't support exporting the bundle with es6, we have to add code manually with bash like stupids
        new WebpackShellPlugin({
            onBuildEnd: [`echo let {html, YoffeeElement, createYoffeeElement} = yoffee; export {html, YoffeeElement, createYoffeeElement}>>dist/yoffee.min.js`]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                // sourceMap: true,
                terserOptions: {
                    compress: {
                        drop_console: true,
                    },
                    mangle: {
                        reserved: ["yoffee", "exports", "replaceWith"],
                        // properties: true
                    },
                }
            })
        ]
    },
    target: "web"
};

const bundler = webpack(webpackConfig);

bundler.run();
