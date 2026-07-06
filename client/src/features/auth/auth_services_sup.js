'use strict';
import { getBasePath } from '../../utils/sharedFunctions.js';
import { getBaseUrl } from '../../utils/path.js';
import { deleteDatabase } from '../../features/store/indexeddbStore.js';
import { fetchSubcontentsByGrade } from '../search/search.js';
import { getVideosByGrade } from "../../features/videos/videoResolver.js";
import { showProfileSelection } from "../auth/profileSelect.js"

const BASE_URL = getBaseUrl();
console.log("Base URL:", BASE_URL);
console.log("Environment:", process.env.NODE_ENV);

const showMessage = (message, divId) => {
    const messageDiv = document.getElementById(divId);
    if (messageDiv) {
        messageDiv.style.display = "block";
        messageDiv.innerHTML = message;
        messageDiv.style.opacity = 1;
    }
};

function validateSignUpForm() {
    const userName = document.getElementById('userName').value.trim();
    const email = document.getElementById('rEmail').value.trim();
    const password = document.getElementById('rPassword').value;

    if (userName === '') {
        showMessage('User Name is required.', 'signUpMessage');
        return false;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(userName)) {
        showMessage('User Name must be 3-20 characters and contain only letters, numbers, or underscores.', 'signUpMessage');
        return false;
    }
    if (email === '') {
        showMessage('Email is required.', 'signUpMessage');
        return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showMessage('Invalid email format.', 'signUpMessage');
        return false;
    }
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'signUpMessage');
        return false;
    }

    // Access children array from auth.js (exposed globally or via module)
    const childrenList = window.signUpChildren || [];
    if (!childrenList.length) {
        showMessage('Please add at least one child profile.', 'signUpMessage');
        return false;
    }

    return true;
}

function getLastWatchedPath(grade) {
    const paths = {
        "KG": "KG_KG_Colors and Shapes_Identifying complex shapes (triangle, rectangle)",
        "1": "3_Entertainment_Movies_Educational movies for kids",
        "2": "3_Entertainment_Movies_Educational movies for kids",
        "3": "3_Entertainment_Movies_Educational movies for kids",
        "4": "3_Entertainment_Movies_Educational movies for kids",
        "5": "3_Entertainment_Movies_Educational movies for kids",
        "6": "3_Entertainment_Movies_Educational movies for kids"
    };
    return paths[grade] || null;
}

function getSelectedQuizPath(grade) {
    const paths = {
        "KG": "",
        "1": "3_Math_Multiplication, multiples and factors_Multiplication",
        "2": "3_Math_Multiplication, multiples and factors_Multiplication",
        "3": "3_Math_Multiplication, multiples and factors_Multiplication",
        "4": "3_Math_Multiplication, multiples and factors_Multiplication",
        "5": "3_Math_Multiplication, multiples and factors_Multiplication",
        "6": "6_3_Math_Multiplication, multiples and factors_Multiplication"
    };
    return paths[grade] || null;
}

// Sign-Up Functionality
const signUp = document.getElementById('submitSignUp');
const signOut = document.getElementById('logout');
signUp?.addEventListener('click', async (event) => {
    event.preventDefault();

    console.log("Sign-Up button clicked");
    if (!validateSignUpForm()) return;

    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const userName = document.getElementById('userName').value;
    const childrenList = window.signUpChildren || [];

    const body = {
      email: email,
      password: password,
      userName: userName,
      children: childrenList.map(child => ({
        name: child.name,
        gradeId: child.gradeId,
        avatarUrl: child.avatarUrl || ""
      }))
    };
window.location.href = `${getBasePath()}index.html`;
async function signup() {
  try {

    const response = await fetch(`${BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("Signup failed");
    }

    const data = await response.json();

    console.log("User created:", data);

  } catch (error) {
    console.error("Signup error:", error);
  }
}
    signup();
   
});

// Sign-In Functionality
const signIn = document.getElementById('submitSignIn');
signIn?.addEventListener('click', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    async function signin() {
        try {

            const response = await fetch(`${BASE_URL}/api/v1/auth/signin`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (!response.ok) {
                throw new Error("Login failed");
            }

            const data = await response.json();
            console.log("Login response data:", data);
            console.log("User:", data.user);
            console.log("Profiles:", data.profiles);
            console.log("accessToken:", data.accessToken);

            localStorage.setItem('loggedInUserId', data.user.id);
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('profiles', JSON.stringify(data.profiles));
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('role', data.user.role);

            showMessage('Login successful!', 'signInMessage');
            localStorage.setItem('isAfterLogin', true);

            // Don't auto-select profile - show selection modal instead
            // Profile selection and content loading will happen after user selects a profile
            showProfileSelection();
           

        } catch (error) {
            console.error("Signin error:", error);
        }
    }

    signin();

});

signOut?.addEventListener('click', async () => {
    async function signOut() {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/auth/signout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
            });

            if (!response.ok) {
                throw new Error("Sign out failed");
            }

            const data = await response.json();
            console.log("Signed out:", data.message);

            deleteDatabase("MyDatabase");
            deleteDatabase("profiles_db");
            localStorage.clear();

            window.location.href = `${getBasePath()}index.html`;
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }

    signOut();

});