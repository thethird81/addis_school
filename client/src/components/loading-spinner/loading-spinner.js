/**
 * Kid-Friendly Loading Spinner Component
 * Legacy browser compatible with ES5 syntax
 */

(function(window) {
    'use strict';

    // Loading Spinner Component
    var LoadingSpinner = {
        // Configuration
        config: {
            emoji: '🚀',
            text: 'Loading...',
            autoHide: false,
            minDisplayTime: 0
        },

        // State
        state: {
            isVisible: false,
            startTime: null,
            timeoutId: null
        },

        // DOM elements
        elements: {
            container: null,
            spinner: null
        },

        /**
         * Initialize the spinner
         * @param {Object} options - Configuration options
         */
        init: function(options) {
            if (options) {
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        this.config[key] = options[key];
                    }
                }
            }
            this._createSpinner();
            this._detectSVGSupport();
        },

        /**
         * Create spinner DOM structure
         * @private
         */
        _createSpinner: function() {
            // Create container
            var container = document.createElement('div');
            container.className = 'loading-spinner-container';
            container.style.display = 'none';

            // Create spinner wrapper
            var spinner = document.createElement('div');
            spinner.className = 'loading-spinner';

            // Create SVG circle
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'loading-spinner-circle');
            svg.setAttribute('viewBox', '0 0 120 120');
            svg.setAttribute('width', '120');
            svg.setAttribute('height', '120');

            var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '60');
            circle.setAttribute('cy', '60');
            circle.setAttribute('r', '45');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', '#FF9F1C');
            circle.setAttribute('stroke-width', '8');
            circle.setAttribute('stroke-linecap', 'round');
            circle.setAttribute('stroke-dasharray', '283');
            circle.setAttribute('stroke-dashoffset', '75');

            svg.appendChild(circle);

            // Create fallback for old browsers
            var fallback = document.createElement('div');
            fallback.className = 'loading-spinner-fallback';

            // Assemble spinner
            spinner.appendChild(svg);
            spinner.appendChild(fallback);
            container.appendChild(spinner);

            // Add to DOM
            document.body.appendChild(container);

            // Store references
            this.elements.container = container;
            this.elements.spinner = spinner;
            this.elements.svg = svg;
            this.elements.emoji = null;
            this.elements.text = null;
            this.elements.fallback = fallback;
        },

        /**
         * Detect SVG support and show fallback if needed
         * @private
         */
        _detectSVGSupport: function() {
            var supportsSVG = !!document.createElementNS && 
                             !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

            if (!supportsSVG) {
                this.elements.svg.classList.add('fallback-active');
                this.elements.fallback.classList.add('active');
            }
        },

        /**
         * Show the spinner
         * @param {Object} options - Optional configuration for this show call (emoji and text are ignored)
         */
        show: function(options) {
            var self = this;

            // Initialize if not already done
            if (!this.elements.container) {
                this._createSpinner();
            }

            // Record start time
            this.state.startTime = new Date().getTime();

            // Show spinner
            if (this.elements.container) {
                this.elements.container.style.display = 'block';
                this.state.isVisible = true;
            }

            // Auto-hide if configured
            if (this.config.autoHide && this.config.minDisplayTime > 0) {
                this.state.timeoutId = setTimeout(function() {
                    self.hide();
                }, this.config.minDisplayTime);
            }
        },

        /**
         * Hide the spinner
         */
        hide: function() {
            // Clear any pending timeout
            if (this.state.timeoutId) {
                clearTimeout(this.state.timeoutId);
                this.state.timeoutId = null;
            }

            // Hide spinner
            if (this.elements.container) {
                this.elements.container.style.display = 'none';
                this.state.isVisible = false;
            }
        },

        /**
         * Check if spinner is currently visible
         * @returns {boolean}
         */
        isVisible: function() {
            return this.state.isVisible;
        },

        /**
         * Update spinner text (no-op - text removed from spinner)
         * @param {string} text - New text to display
         */
        setText: function(text) {
            // No-op: text removed from spinner design
        },

        /**
         * Update spinner emoji (no-op - emoji removed from spinner)
         * @param {string} emoji - New emoji to display
         */
        setEmoji: function(emoji) {
            // No-op: emoji removed from spinner design
        },

        /**
         * Destroy the spinner and clean up
         */
        destroy: function() {
            this.hide();

            if (this.elements.container && this.elements.container.parentNode) {
                this.elements.container.parentNode.removeChild(this.elements.container);
            }

            this.elements = {
                container: null,
                spinner: null,
                svg: null,
                emoji: null,
                text: null,
                fallback: null
            };
        }
    };

    // Export to global scope
    window.LoadingSpinner = LoadingSpinner;

})(typeof window !== 'undefined' ? window : this);