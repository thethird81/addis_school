# Kid-Friendly Loading Spinner

A playful, animated loading spinner component with full legacy browser compatibility.

## Features

- 🎨 **Kid-Friendly Design**: Bright orange circle (#FF9F1C) with rocket emoji 🚀
- ✨ **Smooth Animations**: Spinning circle, pulsing emoji, and fading text
- 🔄 **Infinite Loop**: Continuous animation for loading states
- 🖥️ **Legacy Browser Support**: Works with ES5 syntax and vendor prefixes
- 📦 **SVG with Fallback**: SVG circle with CSS border fallback for old browsers
- 🎯 **Easy to Use**: Simple API with show/hide methods

## Files

- `loading-spinner.css` - Styles with vendor prefixes for maximum compatibility
- `loading-spinner.js` - ES5 JavaScript component
- `loading-spinner.html` - Demo page (optional)

## Quick Start

### 1. Include the CSS and JS files

```html
<link rel="stylesheet" href="src/components/loading-spinner/loading-spinner.css">
<script src="src/components/loading-spinner/loading-spinner.js"></script>
```

### 2. Initialize the spinner (optional - auto-initializes on load)

```javascript
// Initialize with custom options
LoadingSpinner.init({
    emoji: '⭐',
    text: 'Please wait...',
    autoHide: false,
    minDisplayTime: 0
});
```

### 3. Show the spinner

```javascript
// Show with default settings
LoadingSpinner.show();

// Show with custom emoji and text
LoadingSpinner.show({
    emoji: '🐼',
    text: 'Loading fun stuff...'
});
```

### 4. Hide the spinner

```javascript
LoadingSpinner.hide();
```

## API Reference

### `LoadingSpinner.init(options)`

Initialize the spinner with custom configuration.

**Parameters:**
- `options.emoji` (string) - Emoji to display (default: '🚀')
- `options.text` (string) - Loading text (default: 'Loading...')
- `options.autoHide` (boolean) - Auto-hide after minDisplayTime (default: false)
- `options.minDisplayTime` (number) - Minimum display time in ms (default: 0)

**Example:**
```javascript
LoadingSpinner.init({
    emoji: '🌟',
    text: 'Preparing your adventure...',
    autoHide: true,
    minDisplayTime: 3000
});
```

### `LoadingSpinner.show(options)`

Show the spinner with optional custom settings for this instance.

**Parameters:**
- `options.emoji` (string) - Override emoji for this show call
- `options.text` (string) - Override text for this show call

**Example:**
```javascript
LoadingSpinner.show({
    emoji: '🎨',
    text: 'Creating your masterpiece...'
});
```

### `LoadingSpinner.hide()`

Hide the spinner.

**Example:**
```javascript
LoadingSpinner.hide();
```

### `LoadingSpinner.isVisible()`

Check if spinner is currently visible.

**Returns:** `boolean`

**Example:**
```javascript
if (LoadingSpinner.isVisible()) {
    console.log('Spinner is showing');
}
```

### `LoadingSpinner.setText(text)`

Update the loading text dynamically.

**Parameters:**
- `text` (string) - New text to display

**Example:**
```javascript
LoadingSpinner.setText('Almost there...');
```

### `LoadingSpinner.setEmoji(emoji)`

Update the emoji dynamically.

**Parameters:**
- `emoji` (string) - New emoji to display

**Example:**
```javascript
LoadingSpinner.setEmoji('🎉');
```

### `LoadingSpinner.destroy()`

Remove the spinner from the DOM and clean up.

**Example:**
```javascript
LoadingSpinner.destroy();
```

## Usage Examples

### Basic Usage

```javascript
// Show spinner before async operation
LoadingSpinner.show();

// Perform async operation
fetch('/api/data')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // Process data
        console.log(data);
    })
    .catch(function(error) {
        console.error('Error:', error);
    })
    .finally(function() {
        // Hide spinner when done
        LoadingSpinner.hide();
    });
```

### With Form Submission

```javascript
document.getElementById('myForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading spinner
    LoadingSpinner.show({
        emoji: '📤',
        text: 'Sending your message...'
    });
    
    // Submit form via AJAX
    var formData = new FormData(this);
    
    fetch('/api/submit', {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        LoadingSpinner.setText('Processing...');
        return response.json();
    })
    .then(function(result) {
        LoadingSpinner.setEmoji('✅');
        LoadingSpinner.setText('Success!');
        setTimeout(function() {
            LoadingSpinner.hide();
        }, 1000);
    })
    .catch(function(error) {
        LoadingSpinner.setEmoji('❌');
        LoadingSpinner.setText('Oops! Try again');
        setTimeout(function() {
            LoadingSpinner.hide();
        }, 2000);
    });
});
```

### Page Load Indicator

```javascript
// Show spinner immediately when page starts loading
LoadingSpinner.show({
    emoji: '🌍',
    text: 'Loading page...'
});

// Hide when page is fully loaded
window.addEventListener('load', function() {
    setTimeout(function() {
        LoadingSpinner.hide();
    }, 500);
});
```

### Multiple Loading States

```javascript
function loadUserData() {
    LoadingSpinner.show({
        emoji: '👤',
        text: 'Loading user profile...'
    });
    
    loadProfile().then(function() {
        LoadingSpinner.setText('Loading settings...');
        return loadSettings();
    }).then(function() {
        LoadingSpinner.setText('Loading preferences...');
        return loadPreferences();
    }).then(function() {
        LoadingSpinner.setEmoji('✨');
        LoadingSpinner.setText('Ready!');
        setTimeout(function() {
            LoadingSpinner.hide();
        }, 800);
    }).catch(function(error) {
        LoadingSpinner.setEmoji('⚠️');
        LoadingSpinner.setText('Error loading data');
        console.error(error);
    });
}
```

## Browser Compatibility

- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ IE9+ (with CSS fallback for SVG)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Technical Details

### CSS Features Used
- Flexbox with vendor prefixes (-webkit-, -moz-, -ms-)
- CSS Animations with vendor prefixes
- Absolute color values (no CSS variables)
- SVG with stroke-dasharray animation
- CSS border fallback for SVG

### JavaScript Features
- ES5 syntax (no arrow functions, template literals, or let/const)
- IIFE pattern for global scope isolation
- Prototype-free object pattern
- Feature detection for SVG support

### Animations
1. **Spin**: Full 360° rotation (2s linear infinite)
2. **Dash**: SVG stroke animation (1.5s ease-in-out infinite)
3. **Pulse**: Scale 1 → 1.1 → 1 (1.5s ease-in-out infinite)
4. **Fade**: Opacity 0.6 → 1 → 0.6 (2s ease-in-out infinite)

## Customization

### Change Colors

Edit `loading-spinner.css`:

```css
.loading-spinner-circle circle {
    stroke: #FF9F1C;  /* Change to your color */
}

.loading-spinner-fallback {
    border-top: 8px solid #FF9F1C;  /* Match the color */
}
```

### Change Size

Edit both CSS and JS:

```css
.loading-spinner {
    width: 150px;  /* Change size */
    height: 150px;
}
```

```javascript
// In loading-spinner.js, update _createSpinner method:
svg.setAttribute('viewBox', '0 0 150 150');
svg.setAttribute('width', '150');
svg.setAttribute('height', '150');
circle.setAttribute('cx', '75');
circle.setAttribute('cy', '75');
circle.setAttribute('r', '60');
```

### Change Animation Speed

Edit `loading-spinner.css`:

```css
.loading-spinner-circle {
    -webkit-animation: spin 3s linear infinite;  /* Slower spin */
    animation: spin 3s linear infinite;
}

.loading-spinner-circle circle {
    -webkit-animation: dash 2s ease-in-out infinite;  /* Slower dash */
    animation: dash 2s ease-in-out infinite;
}
```

## License

Free to use for your projects!