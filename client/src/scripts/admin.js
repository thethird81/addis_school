if (loggedInUserId) {
    var coins = localStorage.getItem('coins');
    coinCountElement.textContent = coins;
    if (loggedInUserId == "vzTIlWdmgTZTF9zpEygFlcl8yFq1") {
        deleteBtn.style.display = "block";
        syncBtn.style.display = "block";

        deleteBtn.addEventListener("click", deleteVideo);
        syncBtn.addEventListener("click", removeVideoFromFirestore);
    }

}