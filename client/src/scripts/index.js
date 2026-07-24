
import '../components/navbar/navbar.js';
import '../features/auth/auth.js';
import '../features/auth/auth_services_sup.js';
import '../features/auth/authStatus.js';
import '../features/videos/home-page/homePageVideoList.js';
import '../features/quiz/quizTaker.js';
import '../styles/index.css';
import '../styles/responsive.css';
import '../styles/video-list.css';

// Add event listener for Take Quiz button
document.getElementById('takeQuiz')?.addEventListener('click', () => {
  openQuizTaker();
});

