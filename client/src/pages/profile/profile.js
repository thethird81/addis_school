
import '../../features/auth/change-password.js';
import './profile.css';

let loggedInUserId = localStorage.getItem("loggedInUserId");

// Load existing userData from localStorage
let userData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : null;

if (!userData) {
    console.error("❌ userData not found in localStorage.");
} else {
    document.getElementById("usernameInput").value = userData.userName || "";
    document.getElementById("gradeInput").value = userData.grade || "";
    document.getElementById("profileImg").src = userData.profilePicture || "assets/bear.bbb635dcab4fb85cd5e1.png ";
}

// Set default selected profile pic
let selectedProfilePic = userData?.profilePicture || "assets/bear.bbb635dcab4fb85cd5e1.png ";

// Popup controls
document.getElementById("editIcon").addEventListener("click", () => {
    document.getElementById("picPopup").style.display = "flex";
});

document.getElementById("closePopup").addEventListener("click", () => {
    document.getElementById("picPopup").style.display = "none";
});

// Picture selection
document.querySelectorAll(".pic-option").forEach(img => {
    img.addEventListener("click", () => {
        selectedProfilePic = img.src;
        document.getElementById("profileImg").src = selectedProfilePic;
        document.getElementById("picPopup").style.display = "none";

        // Optional: update localStorage immediately for profilePicture
        if (userData) {
            userData.profilePicture = selectedProfilePic;
            localStorage.setItem("userData", JSON.stringify(userData));
            console.log("✅ Updated profilePicture in localStorage:", selectedProfilePic);
        }
    });
});

// Save profile changes
document.getElementById("saveBtn").addEventListener("click", async () => {
    if (!userData) return;

    const username = document.getElementById("usernameInput").value;
    const grade = document.getElementById("gradeInput").value;

    // Extract file name from selectedProfilePic URL
    const fileName = selectedProfilePic.split('/').pop(); // e.g., "bear.png"
    // Merge only the updated fields
    const updatedFields = {
        userName: username,
        grade: grade,
        profilePicture: fileName
    };

    // 1️⃣ Update Firestore
    try {
        // await db.collection("users").doc(loggedInUserId).update(updatedFields);
        // console.log("✅ Updated in Firestore:", updatedFields);

        // // 2️⃣ Update localStorage (keep all other fields intact)
        // userData = { ...userData, ...updatedFields };
        // localStorage.setItem("userData", JSON.stringify(userData));
        // console.log("✅ Updated userData in localStorage:", userData);

        // alert("Profile updated!");
    } catch (error) {
        console.error("❌ Error updating profile:", error);
    }
});
