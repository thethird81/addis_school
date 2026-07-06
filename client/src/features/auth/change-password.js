// import { auth } from '../../utils/firebaseConfig.js';
// document.getElementById("changePasswordBtn").onclick = function () {
//   document.getElementById("changePasswordPopup").style.display = "flex";
// };

// // Close popup
// document.getElementById("closeChangePassword").onclick = function () {
//   document.getElementById("changePasswordPopup").style.display = "none";
// };

// // Change Password
// document.getElementById("submitNewPassword").onclick = function () {

//   var user = auth.currentUser;

//   if (!user) {
//     alert("Please log in first.");
//     return;
//   }

//   var currentPassword = document.getElementById("currentPassword").value;
//   var newPassword = document.getElementById("newPassword").value;
//   var confirmPassword = document.getElementById("confirmPassword").value;

//   // Validate inputs
//   if (!currentPassword || !newPassword || !confirmPassword) {
//     alert("Please fill in all fields.");
//     return;
//   }

//   if (newPassword.length < 6) {
//     alert("New password must be at least 6 characters.");
//     return;
//   }

//   if (newPassword !== confirmPassword) {
//     alert("New passwords do not match.");
//     return;
//   }

//   if (currentPassword === newPassword) {
//     alert("New password must be different from current password.");
//     return;
//   }

//   // Re-authenticate the user first
//   var credential = firebase.auth.EmailAuthProvider.credential(
//     user.email,
//     currentPassword
//   );

//   user.reauthenticateWithCredential(credential)
//     .then(function () {
//       // Now change the password
//       return user.updatePassword(newPassword);
//     })
//     .then(function () {
//       alert("Password updated successfully!");
//       document.getElementById("changePasswordPopup").style.display = "none";
//       // Clear form fields
//       document.getElementById("currentPassword").value = "";
//       document.getElementById("newPassword").value = "";
//     })
//     .catch(function (error) {
//       alert("Error: " + error.message);
//     });
// };
