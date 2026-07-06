import { updateUserField } from "../../utils/updateUserData";
import coinImage from '@assets/images/coin.png';
import { getBasePath } from '../../utils/path.js';
export function addCoins() {
    var coinCountElement = document.getElementById("coinCount");
    let coins = JSON.parse(localStorage.getItem('activeProfile')).coins; // Ensure coins is fetched correctly
    coins = coins ? parseInt(coins, 10) : 0;
    coins += 2;
    updateUserField("coins", coins); // Update coins in activeProfile
    coinCountElement.textContent = coins;
}
export function subtructCoins() {
    let coins = JSON.parse(localStorage.getItem('activeProfile')).coins; // Change const to let
    coins = coins ? parseInt(coins, 10) : 0;
    coins -= 2;
    return coins;
}
// Function to show the modal with the message about not enough coins
export function showNotEnoughCoinsModal() {
    var modal = document.getElementById("quizModal");
    var overlay = document.getElementById("overlay");

    // Display question image if available



    // Set the question text to be the message
    var questionText = document.getElementById("questionText");
    var quizContent = document.querySelector(".quiz-content");
    questionText.innerHTML = "Get More Coins By Watching Other Subjects! "; // Custom message
    var questionImage = document.createElement('img');
    questionImage.src = coinImage;
    questionImage.alt = "Question Image";
    questionImage.className = "question-image";

    // Set width and height
    questionImage.style.width = "100px"; // Adjust the width as needed
    questionImage.style.height = "100px"; // Adjust the height as needed

    quizContent.appendChild(questionImage);
    // Clear the answerContainer (no answers for this case)
    var answerContainer = document.getElementById("answerContainer");
    answerContainer.innerHTML = ""; // No answers are needed

    // Create a "Go to Home" button
    var goToIndexButton = document.createElement("button");
    goToIndexButton.classList.add("btn");
    goToIndexButton.textContent = "Get More Coins!"; // Button text

    // Add event listener to the button
    goToIndexButton.addEventListener("click", function () {
        window.location.href = `${getBasePath()}index.html`; // Redirect to index.html when clicked

    });

    // Append the button to the answer container
    answerContainer.appendChild(goToIndexButton);

    // Show the modal and overlay
    modal.classList.add("active");
    overlay.classList.add("active");
}
//subtract coin
//save coins to db