//import { fetchAndMergeQuizzes } from './quiz.js';
// Check if user is logged in using accessToken
const accessToken = localStorage.getItem('accessToken');
const joinButton = document.getElementById('joinUs');
var userBar = document.querySelector(".user-bar");
var searchBox = document.querySelector(".search-box");
var slidingText = document.querySelector(".sliding-text");
var searchSmall = document.querySelector(".search-small");




if (accessToken) {

    if (joinButton) joinButton.style.display = 'none';
    if (userBar) userBar.style.display = 'flex';


} else {
    if (joinButton) joinButton.style.display = 'block';
    if (searchBox) searchBox.style.display = 'none';
    if (userBar) userBar.style.display = 'none';
    if (searchSmall) searchSmall.style.display = 'none'; // Added to hide searchSmall

}

