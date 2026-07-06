import { auth, db } from '../../utils/firebaseConfig.js';
import { updateLocalVideoList } from '../videos/fetchVideoServices.js';
import { getBasePath } from '../../utils/path';
// Ensure the "Add User" button exists before using it
let addUserButton = document.getElementById("addUser");
if (!addUserButton) {
    addUserButton = document.createElement("button");
    addUserButton.id = "addUser";
    addUserButton.textContent = "Add User";
    addUserButton.style.marginTop = "10px";
    addUserButton.style.padding = "10px 20px";
    addUserButton.style.backgroundColor = "#4CAF50";
    addUserButton.style.color = "#fff";
    addUserButton.style.border = "none";
    addUserButton.style.borderRadius = "5px";
    addUserButton.style.cursor = "pointer";

    const userSidebar = document.getElementById("userSidebar");
    //userSidebar.appendChild(addUserButton);
}

// Add a modal for switching users
const createSwitchUserModal = () => {
    const modal = document.createElement('div');
    modal.id = 'switchUserModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    modal.style.padding = '20px';
    modal.style.zIndex = '1000';
    modal.style.width = '300px';
    modal.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Switch User';
    title.style.color = '#333';
    title.style.marginBottom = '20px';
    modal.appendChild(title);

    const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];

    savedUsers.forEach(user => {
        const userContainer = document.createElement('div');
        userContainer.style.display = 'flex';
        userContainer.style.alignItems = 'center';
        userContainer.style.marginBottom = '10px';
        userContainer.style.cursor = 'pointer';

        const avatar = document.createElement('img');
        avatar.src = require('@assets/images/user-icon.png'); // Default avatar
        avatar.alt = 'User Avatar';
        avatar.style.width = '40px';
        avatar.style.height = '40px';
        avatar.style.borderRadius = '50%';
        avatar.style.marginRight = '10px';

        const userName = document.createElement('span');
        userName.textContent = user.nickName || user.email;
        userName.style.color = '#555';
        userName.style.fontSize = '16px';

        userContainer.appendChild(avatar);
        userContainer.appendChild(userName);

        userContainer.addEventListener('click', () => {
            localStorage.setItem('loggedInUserId', user.id);
            localStorage.setItem('userData', JSON.stringify(user));
            //alert(`Switched to user: ${user.nickName || user.email}`);
            updateLocalVideoList('loggedIn');
            document.body.removeChild(modal);
            window.location.href = `${getBasePath()}index.html`;
        });

        modal.appendChild(userContainer);
    });

    // Always show the "Add User" button in the modal
    const addUserButton = document.createElement('button');
    addUserButton.textContent = 'Add User';
    addUserButton.style.marginTop = '20px';
    addUserButton.style.padding = '10px 20px';
    addUserButton.style.backgroundColor = '#4CAF50';
    addUserButton.style.color = '#fff';
    addUserButton.style.border = 'none';
    addUserButton.style.borderRadius = '5px';
    addUserButton.style.cursor = 'pointer';

    // Update the "Add User" button to first log out the current user before signing in a new one
    addUserButton.addEventListener('click', async () => {
        try {
            // Log out the current user
            await auth.signOut();
            localStorage.removeItem('loggedInUserId');
            localStorage.removeItem('userData');

            // Prompt for new user credentials
            const email = prompt('Enter the email of the new user:');
            const password = prompt('Enter the password for the new user:');

            if (!email || !password) {
                alert('Both email and password are required to add a user.');
                return;
            }

            // Sign in the new user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch user data from Firestore
            const userRef = db.collection('users').doc(user.uid);
            const docSnap = await userRef.get();

            if (docSnap.exists) {
                const userData = docSnap.data();
                const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
                const existingUserIndex = savedUsers.findIndex(u => u.id === user.uid);

                if (existingUserIndex !== -1) {
                    savedUsers[existingUserIndex] = { id: user.uid, ...userData };
                } else {
                    savedUsers.push({ id: user.uid, ...userData });
                }

                localStorage.setItem('savedUsers', JSON.stringify(savedUsers));
                localStorage.setItem('loggedInUserId', user.uid);
                localStorage.setItem('userData', JSON.stringify(userData));
                alert(`User ${userData.nickName || userData.email} added successfully!`);
                document.body.removeChild(modal);
                updateLocalVideoList('userSwitched');
                window.location.href = `${getBasePath()}index.html`;
            } else {
                alert('User data not found in the database.');
            }
        } catch (error) {
            console.error('Error during user switch:', error);
            alert('Failed to switch users. Please try again.');
        }
    });

    modal.appendChild(addUserButton);

    // Update the close button to be an 'x' on the top right corner
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '100px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = 'black'; // Change close button 'x' color to black
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.appendChild(closeButton);
    document.body.appendChild(modal);
};

addUserButton.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.id = 'addUserModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = '#fff'; // Ensure the background color does not change when clicking Add User
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    modal.style.padding = '20px';
    modal.style.zIndex = '1000';
    modal.style.width = '300px';
    modal.style.textAlign = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Add User';
    title.style.color = '#333';
    title.style.marginBottom = '20px';
    modal.appendChild(title);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Enter email';
    emailInput.style.width = '100%';
    emailInput.style.marginBottom = '10px';
    emailInput.style.padding = '10px';
    emailInput.style.border = '1px solid #ddd';
    emailInput.style.borderRadius = '5px';
    modal.appendChild(emailInput);

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter password';
    passwordInput.style.width = '100%';
    passwordInput.style.marginBottom = '20px';
    passwordInput.style.padding = '10px';
    passwordInput.style.border = '1px solid #ddd';
    passwordInput.style.borderRadius = '5px';
    modal.appendChild(passwordInput);

    const addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.style.marginRight = '10px';
    addButton.style.padding = '10px 20px';
    addButton.style.backgroundColor = '#4CAF50';
    addButton.style.color = '#fff';
    addButton.style.border = 'none';
    addButton.style.borderRadius = '5px';
    addButton.style.cursor = 'pointer';

    addButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            alert('Both email and password are required.');
            return;
        }

        try {
            // Keep the currently logged-in user in the list
            const currentUserId = localStorage.getItem('loggedInUserId');
            const currentUserData = JSON.parse(localStorage.getItem('userData'));
            const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];

            if (currentUserId && currentUserData) {
                const existingUserIndex = savedUsers.findIndex(u => u.id === currentUserId);
                if (existingUserIndex === -1) {
                    savedUsers.push({ id: currentUserId, ...currentUserData });
                }
            }

            // Log out the current user
            await auth.signOut();
            localStorage.removeItem('loggedInUserId');
            localStorage.removeItem('userData');

            // Sign in the new user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch user data from Firestore
            const userRef = db.collection('users').doc(user.uid);
            const docSnap = await userRef.get();

            if (docSnap.exists) {
                const userData = docSnap.data();
                const existingUserIndex = savedUsers.findIndex(u => u.id === user.uid);

                if (existingUserIndex !== -1) {
                    savedUsers[existingUserIndex] = { id: user.uid, ...userData };
                } else {
                    savedUsers.push({ id: user.uid, ...userData });
                }

                localStorage.setItem('savedUsers', JSON.stringify(savedUsers));
                localStorage.setItem('loggedInUserId', user.uid);
                localStorage.setItem('userData', JSON.stringify(userData));
                alert(`User ${userData.nickName || userData.email} added successfully!`);
                document.body.removeChild(modal);
                updateLocalVideoList('userSwitched');
                window.location.href = `${getBasePath()}index.html`;
            } else {
                alert('User data not found in the database.');
            }
        } catch (error) {
            console.error('Error during user addition:', error);
            alert('Failed to add user. Please try again.');
        }
    });

    modal.appendChild(addButton);

    // Update the close button to be an 'x' on the top right corner
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = 'black'; // Change close button 'x' color to black
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';

    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    modal.appendChild(closeButton);
    document.body.appendChild(modal);
});

// Update the "Add User" button to list saved users with indentation
addUserButton.addEventListener('click', () => {
    const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];

    const userListContainer = document.createElement('div');
    userListContainer.id = 'userListContainer';
    userListContainer.style.marginTop = '10px';
    userListContainer.style.padding = '10px';

    userListContainer.style.border = '1px solid #ddd';
    userListContainer.style.borderRadius = '5px';

    if (savedUsers.length === 0) {
        const noUsersMessage = document.createElement('p');
        noUsersMessage.textContent = 'No saved users available.';
        noUsersMessage.style.color = '#555';
        //userListContainer.appendChild(noUsersMessage);
    } else {
        savedUsers.forEach((user, index) => {
            const userItem = document.createElement('div');
            userItem.style.marginLeft = '20px'; // Indentation for each user
            userItem.style.marginBottom = '5px';
            userItem.style.cursor = 'pointer';
            userItem.style.color = '#333';

            userItem.textContent = `${index + 1}. ${user.nickName || user.email}`;

            userItem.addEventListener('click', () => {
                localStorage.setItem('loggedInUserId', user.id);
                localStorage.setItem('userData', JSON.stringify(user));
                // alert(`Switched to user: ${user.nickName || user.email}`);
                updateLocalVideoList('userSwitched');
                window.location.href = `${getBasePath()}index.html`;
            });

            userListContainer.appendChild(userItem);
        });
    }

    const existingContainer = document.getElementById('userListContainer');
    if (existingContainer) {
        existingContainer.remove();
    }

    //switchUserButton.insertAdjacentElement('afterend', userListContainer);
    // Replace insertAdjacentElement for older browsers
    const parentElement = addUserButton.parentNode;
    if (parentElement) {
        parentElement.insertBefore(userListContainer, addUserButton.nextSibling);
    }
});

// Check if there are saved users and show the "Add User" button if none exist
const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];

if (savedUsers.length === 0) {
    const addUserButton = document.createElement('button');
    addUserButton.id = 'addUser';
    addUserButton.textContent = 'Add User';
    addUserButton.style.marginTop = '20px';
    addUserButton.style.padding = '10px 20px';
    addUserButton.style.backgroundColor = '#4CAF50';
    addUserButton.style.color = '#fff';
    addUserButton.style.border = 'none';
    addUserButton.style.borderRadius = '5px';
    addUserButton.style.cursor = 'pointer';

    // Update the "Add User" button to first log out the current user before signing in a new one
    addUserButton.addEventListener('click', async () => {
        try {
            // Log out the current user
            await auth.signOut();
            localStorage.removeItem('loggedInUserId');
            localStorage.removeItem('userData');

            // Prompt for new user credentials
            const email = prompt('Enter the email of the new user:');
            const password = prompt('Enter the password for the new user:');

            if (!email || !password) {
                alert('Both email and password are required to add a user.');
                return;
            }

            // Sign in the new user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch user data from Firestore
            const userRef = db.collection('users').doc(user.uid);
            const docSnap = await userRef.get();

            if (docSnap.exists) {
                const userData = docSnap.data();
                const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];
                savedUsers.push({ id: user.uid, ...userData });
                localStorage.setItem('savedUsers', JSON.stringify(savedUsers));
                localStorage.setItem('loggedInUserId', user.uid);
                localStorage.setItem('userData', JSON.stringify(userData));
                alert(`User ${userData.nickName || userData.email} added successfully!`);
                updateLocalVideoList('userSwitched');
                window.location.href = `${getBasePath()}index.html`;
            } else {
                alert('User data not found in the database.');
            }
        } catch (error) {
            console.error('Error signing in the new user:', error);
            alert('Failed to sign in the new user. Please check the credentials.');
        }
    });

    const userSidebar = document.getElementById('userSidebar');
    //userSidebar.appendChild(addUserButton);
}

// Always display the saved users under the "Add User" button with the same background color and sample avatars
const updateUserList = () => {
    const savedUsers = JSON.parse(localStorage.getItem('savedUsers')) || [];

    let userListContainer = document.getElementById('userListContainer');

    if (!userListContainer) {
        userListContainer = document.createElement('div');
        userListContainer.id = 'userListContainer';
        userListContainer.style.marginTop = '10px';
        userListContainer.style.padding = '10px';
        userListContainer.style.backgroundColor = 'inherit'; // Match parent background color
        userListContainer.style.borderRadius = '5px';
        const parentElement = addUserButton.parentNode;
        if (parentElement) {
            parentElement.insertBefore(userListContainer, addUserButton.nextSibling);
        }
    }

    userListContainer.innerHTML = ''; // Clear existing content

    if (savedUsers.length === 0) {
        const noUsersMessage = document.createElement('p');
        noUsersMessage.textContent = 'No saved users available.';
        noUsersMessage.style.color = 'white'; // Set text color to white
        // userListContainer.appendChild(noUsersMessage);
    } else {
        savedUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.style.display = 'flex';
            userItem.style.alignItems = 'center';
            userItem.style.marginBottom = '10px';
            userItem.style.cursor = 'pointer';
            userItem.style.color = 'white'; // Set text color to white

            const avatar = document.createElement('img');
            avatar.src = require('@assets/images/user-icon.png'); // Use user-icon.png as avatar
            avatar.alt = '';
            avatar.style.width = '30px';
            avatar.style.height = '30px';
            avatar.style.borderRadius = '50%';
            avatar.style.marginRight = '10px';

            const userName = document.createElement('span');
            userName.textContent = user.nickName || user.email;

            userItem.appendChild(avatar);
            userItem.appendChild(userName);

            userItem.addEventListener('click', () => {
                localStorage.setItem('loggedInUserId', user.id);
                localStorage.setItem('userData', JSON.stringify(user));
                //alert(`Switched to user: ${user.nickName || user.email}`);
                updateLocalVideoList('userSwitched');
                window.location.href = `${getBasePath()}index.html`;
            });

            userListContainer.appendChild(userItem);
        });
    }
};

// Call updateUserList on page load to ensure the list is always displayed
updateUserList();

// Update the list whenever a new user is added or switched
addUserButton.addEventListener('click', updateUserList);