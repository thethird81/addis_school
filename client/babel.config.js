module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    ie: '10',        // or android 4.4, or whatever old device you want
                },
                useBuiltIns: 'usage',
                corejs: 3,           // add polyfills only when needed
            },
        ],
    ],
    plugins: [
        '@babel/plugin-transform-runtime',
    ],
};
