// scripts/saved-users.js

(function () {
    const containerId = 'savedUsersList';

    function getSavedProfiles() {
        return JSON.parse(localStorage.getItem('profiles')) || [];
    }

    function renderUserButtons() {
        const container = document.getElementById(containerId);
        if (!container) return;

        const profiles = getSavedProfiles();
        if (profiles.length === 0) {
            container.innerHTML = '<p>No saved users yet. Please sign in.</p>';
            return;
        }

        profiles.forEach((profile, index) => {
            const btn = document.createElement('button');
            btn.textContent = profile.name;
            btn.setAttribute('tabindex', '0');
            btn.className = 'user-select-btn';
            btn.onclick = () => proceedToLogin(profile.grade);
            container.appendChild(btn);
        });
console.log('profiles:', profiles);
        enableTVRemoteFocus(container);
    }

    function proceedToLogin(email) {
        alert(`Switching to user: ${email}. Now enter password.`);
        // You could also prefill the email in a login form or route to a login page with query param
        localStorage.setItem('selectedUserEmail', email);
       // location.href = 'login.html';
    }

    function enableTVRemoteFocus(container) {
        const buttons = container.querySelectorAll('button');
        let index = 0;
        buttons[index]?.focus();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                index = (index + 1) % buttons.length;
                buttons[index].focus();
            } else if (e.key === 'ArrowUp') {
                index = (index - 1 + buttons.length) % buttons.length;
                buttons[index].focus();
            } else if (e.key === 'Enter') {
                buttons[index].click();
            }
        });
    }

    window.addEventListener('DOMContentLoaded', renderUserButtons);
})();
