
var youtubeLogoOverlay = document.querySelector(".youtube-logo-overlay");
var body = document.body;// Function to toggle full screen mode
// For Modern Browsers
if (youtubeLogoOverlay.addEventListener) {

    youtubeLogoOverlay.addEventListener("click", toggleFullScreen);
}
// For Older Browsers (IE 8 and below)
else if (youtubeLogoOverlay.attachEvent) {
    youtubeLogoOverlay.attachEvent("onclick", toggleFullScreen);
}
function toggleFullScreen() {
    // Check if the class is already added
    if (body.className.indexOf("fullscreen-mode") === -1) {
        body.className += " fullscreen-mode";  // Add the fullscreen-mode class
    } else {
        body.className = body.className.replace(" fullscreen-mode", "");  // Remove it
    }
}