
import './delete-video.css'
const deleteBtn = document.querySelector(".delete-btn");
//const syncBtn = document.querySelector(".sync-btn");
const userData = JSON.parse(localStorage.getItem("userData") || "{}");
const isAdmin = userData.isAdmin || false;
if (isAdmin) {
    console.log("Admin privileges granted.");
    deleteBtn.style.display = "block";
    //syncBtn.style.display = "block";

}
