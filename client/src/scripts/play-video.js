
import "../components/iframe/iframe.js";
import "../components/navbar/navbar.js";
import '../features/auth/auth.js';
import '../features/auth/auth_services_sup.js';
import '../features/auth/authStatus.js';
import '../features/videos/play-video-page/playVideoPageVideoList.js';
import "../styles/play-video.css";
import '../styles/navbar.css';
import '../styles/responsive.css';
import { fetchSelectedQuestions } from '../features/quiz/quiz.js';
var accessToken = localStorage.getItem('accessToken');
if (accessToken) {


    var questions = JSON.parse(localStorage.getItem("questions"));
    if (!questions || questions.length === 0) {
        fetchSelectedQuestions();
    }else{
        console.log("Questions already in localStorage:", questions.length)
    }
   // fetchSelectedQuestions();
}
