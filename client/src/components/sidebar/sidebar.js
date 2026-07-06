import { fetchSubjects,getContents } from "./sidebarServices.js";
import '../../styles/sidebar.css';
import '../../components/loading-spinner/loading-spinner.css';
import '../../components/loading-spinner/loading-spinner.js';


var sidebarContent = document.getElementById("sidebarContent");
var signinSignup = document.querySelector(".signin-signup");
var sidebar = document.querySelector(".sidebar");
const loggedInUserId = localStorage.getItem("loggedInUserId");


const accessToken = localStorage.getItem("accessToken");
if (accessToken) {
    // Show loading spinner while fetching sidebar content
    if (typeof LoadingSpinner !== 'undefined') {
        LoadingSpinner.show();
    }
    
    // Uncomment the following line if `fetchSubjects` is needed and works correctly
    //fetchSubjects();
    getContents().then(function() {
        // Hide spinner when content is loaded
        if (typeof LoadingSpinner !== 'undefined') {
            LoadingSpinner.hide();
        }
    }).catch(function(error) {
        console.error('Error loading sidebar content:', error);
        // Hide spinner on error
        if (typeof LoadingSpinner !== 'undefined') {
            setTimeout(function() {
                LoadingSpinner.hide();
            }, 1500);
        }
    });

}

document.querySelector(".menu-icon").addEventListener("click", async () => {




    if (!loggedInUserId) {
        console.log(loggedInUserId);
        sidebarContent.style.display = "none";
        signinSignup.style.display = "block";
    } else {
        const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
       // console.log(activeProfile);

        // Uncomment the following line if `fetchSubjects` is needed and works correctly
       //await fetchSubjects();
        sidebarContent.style.display = "block";
        signinSignup.style.display = "none";
    }
    var sidebar = document.querySelector(".sidebar");

    sidebar.classList.toggle("visible");

    // Focus the first sidebar element when the sidebar is opened
    if (sidebar.classList.contains("visible")) {
        const firstSidebarItem = document.querySelector(".sidebar-item");
        if (firstSidebarItem) {
            firstSidebarItem.focus();
        }
    }
});

document.getElementById("joinUs").addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        sidebar.classList.add("visible");
        console.log("Toggled visible class");
    } else {
        console.log("Sidebar not found");
    }
});


document.addEventListener("click", function (event) {
    const sidebar = document.querySelector(".sidebar");
    const menuIcon = document.querySelector(".menu-icon");
    const joinUs = document.getElementById("joinUs");

    if (
        sidebar &&
        !sidebar.contains(event.target) &&
        menuIcon !== event.target &&
        joinUs !== event.target
    ) {
        sidebar.classList.remove("visible");
    }
});

// Ensure all sidebar items have tabindex for focusable navigation
document.querySelectorAll(".sidebar-item").forEach((el) => {
    el.setAttribute("tabindex", "0");
});

// Add keyboard navigation for arrow keys
document.addEventListener("keydown", (event) => {
    const focusableElements = Array.from(
        document.querySelectorAll(".sidebar-item")
    );

    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (event.key === "ArrowDown") {
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        focusableElements[nextIndex].focus();
        event.preventDefault();
    } else if (event.key === "ArrowUp") {
        const prevIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        focusableElements[prevIndex].focus();
        event.preventDefault();
    }
});
