module.exports = {
    plugins: [
      // Adds vendor prefixes for old browsers
      require('autoprefixer')({
        grid: 'autoplace',
        flexbox: 'no-2009'
      }),
  
      // Transforms modern CSS (e.g. nesting, custom selectors)
      require('postcss-preset-env')({
        stage: 3,
        autoprefixer: false, // handled above
        features: {
          'nesting-rules': true,
          'custom-properties': false, // disabled for legacy support
          'color-functional-notation': false,
          'focus-within-pseudo-class': false
        }
      }),
  
      // Fixes flexbox bugs in old browsers (especially IE11)
      require('postcss-flexbugs-fixes')(),
  
      // Converts px to rem units (restricted to layout/sizing properties)
      require('postcss-pxtorem')({
        propList: ['font', 'font-size', 'line-height', 'letter-spacing', 'margin', 'padding', 'width', 'height', 'max-width', 'min-width', 'max-height', 'min-height', 'gap', 'border-radius', 'top', 'bottom', 'left', 'right'],
        mediaQuery: false,
        minPixelValue: 0
      }),
  
      // Minifies CSS
      require('cssnano')({
        preset: 'default',
      }),
    ]
  };
  