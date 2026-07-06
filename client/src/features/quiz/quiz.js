import { showModal, hideModal } from '../../components/iframe/iframe.js';
import {getBaseUrl} from '../../utils/path.js';
import { getQuestions, setQuestions, clearQuestions } from '../store/profileStore.js';
var questionText = document.getElementById('questionText');
var answerContainer = document.getElementById('answerContainer');
var countdownDisplay = document.getElementById('countdown');



const activeProfile = JSON.parse(localStorage.getItem('activeProfile'));
const BASE_URL = getBaseUrl();
import '../../styles/quiz-modal.css'

var quizInterval;
var countdownInterval;
var currentQuestionIndex = 0;



export const  displayQuestion= async() => {

    resetQuiz();

    let questions = activeProfile && activeProfile.id ? await getQuestions(activeProfile.id) : [];

    if (!questions || questions.length === 0) {
        console.log("No question Available");
      
        await fetchSelectedQuestions();

        // Reload after fetch
        questions = activeProfile && activeProfile.id ? await getQuestions(activeProfile.id) : [];
        if (!questions || questions.length === 0) {
            console.log("No questions available after fetching.");
            return;
        }
    }

    // pick random question
    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];

    // display text
    questionText.innerHTML = question.question_text;

    // display image if exists (UPDATED FIELD NAME)
    if (question.question_image) {
        const img = document.createElement("img");
        img.src = question.question_image;
        img.alt = "Question Image";
        img.className = "question-image";
        questionText.appendChild(img);
    }

    // clear previous options
    answerContainer.innerHTML = "";

    // 🚀 DO NOT RESHUFFLE OPTIONS
    // DB already shuffled and correct_answer is aligned

    question.options.forEach((option, index) => {

        const button = document.createElement("button");
        button.className = "answer";

        const optionContent = document.createElement("div");
        optionContent.className = "option-content";

        const optionText = document.createElement("span");
        optionText.innerHTML = option.text;
        optionContent.appendChild(optionText);

        button.appendChild(optionContent);

        // correct index already stored from DB
        button.dataset.correct = (option.id === question.correct_answer);

        button.addEventListener("click", handleAnswerClick);
        answerContainer.appendChild(button);
    });

    showModal();
}





function resetQuiz() {
    clearInterval(countdownInterval); // Clear any active countdown
    countdownDisplay.innerHTML = ""; // Clear countdown display
    var buttons = answerContainer.getElementsByClassName('answer');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = false;
    }
}

function startQuizInterval() {
    clearInterval(quizInterval);
    quizInterval = setTimeout(function () {
        displayQuestion();
    }, 60000); // Show the quiz after 5 seconds
}

// Handle answer clicks
function handleAnswerClick(e) {
    var isCorrect = e.currentTarget.getAttribute('data-correct') === 'true';
    console.log(e.currentTarget.getAttribute('data-correct'))

    if (isCorrect) {
        console.log("Correct answer clicked!");

        hideModal();
        resetQuiz();
        currentQuestionIndex++;
        // setTimeout(function () {
        //     startQuizInterval(); // Show the next question after 5 seconds
        // }, 60000);
    } else {
        console.log("Wrong answer clicked!");
        var buttons = answerContainer.getElementsByClassName('answer');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
        }

        var countdownTimer = 20;
        countdownDisplay.innerHTML = countdownTimer;
        countdownInterval = setInterval(function () {
            countdownTimer--;
            countdownDisplay.innerHTML = countdownTimer;

            if (countdownTimer <= 0) {
                clearInterval(countdownInterval);
                resetQuiz();
            }
        }, 1000);
    }
}




export const fetchSelectedQuestions = async () =>{
  // Always fetch the latest favorites — don't skip if cached,
  // because the user may have changed their favorites via the settings page.

  // Fetch favorited quiz IDs from the favorites API
  let quizIds = [];
  try {
    const accessToken = localStorage.getItem("accessToken");
    const url = `${BASE_URL}/api/v1/favorites/${activeProfile.id}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch favorites");

    const favorites = await response.json();
    quizIds = favorites.map((fav) => fav.quizId);
    console.log("Favorited quiz IDs:", quizIds);
  } catch (error) {
    console.error("Error fetching favorite quizzes:", error);
    return;
  }

  if (!quizIds || quizIds.length === 0) {
    console.log("No favorited quizzes found.");
    // Clear any previously cached questions since there are no favorites
    if (activeProfile && activeProfile.id) {
      await clearQuestions(activeProfile.id);
    }
    return;
  }

  try {
    console.log(BASE_URL)
    const url = `${BASE_URL}/api/v1/questions/selected`;
    const accessToken = localStorage.getItem("accessToken");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ quizIds })
    });

    const data = await response.json();
    console.log("API response for questions:", data);

    // Merge all questions from all favorite quizzes into one combined array
    // and save it locally as a single "quiz" for the active profile
    if (activeProfile && activeProfile.id) {
      await setQuestions(activeProfile.id, data);
    }

    console.log("Fetched and merged questions:", data);

  } catch (error) {
    console.error("Error fetching questions:", error);
  }

}
