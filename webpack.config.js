import TerserPlugin from "terser-webpack-plugin";
import WebpackShellPlugin from 'webpack-shell-plugin';
import webpack from 'webpack';

let webpackConfig = {
    entry: './src/htmel.js',
    // devtool: "source-map",
    output: {
        filename: "htmel.min.js",
        library: "htmel"
    },
    plugins: [
        // Because webpack doesn't support importing the bundle with 'import htmel from "..."', we do this
        new WebpackShellPlugin({onBuildEnd: [`echo export default htmel.default; let HTMElement = htmel.HTMElement; export {HTMElement}>>dist/htmel.min.js`]})
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
                        reserved: ["htmel", "exports", "replaceWith"],
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
