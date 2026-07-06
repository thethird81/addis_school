// Generic function to update any specified field in the user data object
export const updateUserField = async (field, newValue) => {
    // Check if activeProfile exists in localStorage
    let activeProfile = localStorage.getItem('activeProfile') ? JSON.parse(localStorage.getItem('activeProfile')) : null;
    const profiles = JSON.parse(localStorage.getItem('profiles')) || [];

    if (!activeProfile) {
        console.error("❌ activeProfile is null or invalid. Cannot update the field.");
        return;
    }

    // Update the specified field in localStorage
    activeProfile[field] = newValue;
    localStorage.setItem('activeProfile', JSON.stringify(activeProfile));
    // Find the profile with the same grade and update it
    for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].id === activeProfile.id) {
            profiles[i] = activeProfile;
            break;
        }
    }

    // Save the updated profiles array back to localStorage
    localStorage.setItem('profiles', JSON.stringify(profiles));
    //console.log(`✅ Updated ${field} in localStorage and profile array:`, newValue);
};

/**
 * Updates the active profile in the profiles array where the grade matches.
 * @param {Object} activeProfile - The updated profile object.
 */
function updateActiveProfile(activeProfile) {
    const profiles = JSON.parse(localStorage.getItem('profiles')) || [];

    // Find the profile with the same grade and update it
    for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].id === activeProfile.id) {
            profiles[i] = activeProfile;
            break;
        }
    }

    // Save the updated profiles array back to localStorage
    localStorage.setItem('profiles', JSON.stringify(profiles));

    // Update the active profile in localStorage
    localStorage.setItem('activeProfile', JSON.stringify(activeProfile));
}

export default updateActiveProfile;
