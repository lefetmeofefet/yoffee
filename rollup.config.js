import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';
import strip from '@rollup/plugin-strip';

const production = !process.env.ROLLUP_WATCH;


export default {
    input: './src/yoffee.js',
    output: [{
        file: './dist/yoffee.iife.js',
        format: 'iife',
        name: 'iife'
    },
    {
        file: './dist/yoffee.esm.js',
        format: 'esm',
        name: 'esm'
    },
    {
        file: './dist/yoffee.umd.js',
        format: 'umd',
        name: 'umd'
    },
    {
        file: './dist/yoffee.cjs.js',
        format: 'cjs',
        name: 'cjs'
    },
    {
        file: './dist/yoffee.js.map',
        sourcemap: 'inline'
    }],
    plugins: [
        strip(),
        production && terser({
            format: {
                comments: false
            },
            compress: true,
                mangle: {
                    reserved: ["yoffee", "exports", "replaceWith"],
                } 
        }),
        commonjs(),
        uglify()
    ]
}