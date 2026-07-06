import { getVideoData } from "../../utils/sharedFunctions";

export const doesDocumentExist = async () => {
    if (!window.indexedDB) {
        console.warn("IndexedDB is not supported in this browser. Falling back to alternative storage.");
        // Implement fallback logic here, such as using localStorage or another storage mechanism
        return false;
    }

    const grade = getSelectedSidebar("grade");
    const subject = getSelectedSidebar("subject");
    const content = getSelectedSidebar("content");
    const docId = `${grade}_${subject}_${content}`;

    return new Promise((resolve) => {
        const request = indexedDB.open("MyDatabase", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log("Upgrading database...");
            if (!db.objectStoreNames.contains("contents")) {
                db.createObjectStore("contents", { keyPath: "id" });
                console.log("Object store 'contents' created.");
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            console.log("Database opened successfully.");

            if (!db.objectStoreNames.contains("contents")) {
                console.error("❌ Object store 'contents' not found. Deleting database...");
                db.close();
                indexedDB.deleteDatabase("MyDatabase");
                resolve(false);
                return;
            }

            const transaction = db.transaction("contents", "readonly");
            console.log("Transaction started.");
            const store = transaction.objectStore("contents");
            console.log("Accessing object store 'contents'.");
            const getRequest = store.get(docId);

            getRequest.onsuccess = () => {
                console.log("Document retrieved:", getRequest.result);
                resolve(getRequest.result);
            };

            getRequest.onerror = (event) => {
                console.error("Error retrieving document:", event.target.error);
                resolve(false);
            };
        };

        request.onerror = (event) => {
            console.error("Error opening database:", event.target.error);
            resolve(false);
        };
    });
};

export const saveToIndexedDB = (doc) => {
    if (!window.indexedDB) {
        console.warn("IndexedDB is not supported in this browser. Falling back to alternative storage.");
        // Implement fallback logic here, such as using localStorage or another storage mechanism
        return;
    }

    const request = indexedDB.open("MyDatabase", 2);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("contents")) {
            db.createObjectStore("contents", { keyPath: "id" });
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(["contents"], "readwrite");
        const store = transaction.objectStore("contents");

        const putRequest = store.put(doc);

        putRequest.onsuccess = () => {
        };

        putRequest.onerror = (event) => {
        };
    };

    request.onerror = (event) => {
    };
};

export const doesVideoExist = (indexedDbDoc) => {
    const subcontent = getSelectedSidebar("subcontent");
    if (!indexedDbDoc || !Array.isArray(indexedDbDoc.subcontents)) {
        console.error("❌ Invalid document structure.");
        return false;
    }

    if (indexedDbDoc.subcontents.length === 0) {
        console.warn("⚠️ No subcontents found.");
        return false;
    }

    for (const { subcontent: foundSubcontent, videos } of indexedDbDoc.subcontents) {
        if (subcontent === foundSubcontent) {
            const hasVideos = Array.isArray(videos) && videos.length > 0;
            return hasVideos;
        }
    }

    console.warn("🚫 Subcontent not found or has no videos.");
    return false;
};

export const deleteDatabase = (dbName) => {
    if (!window.indexedDB) {
        console.warn("IndexedDB is not supported in this browser. Falling back to alternative storage.");
        // Implement fallback logic here, such as using localStorage or another storage mechanism
        return;
    }

    // Replace with the name of your IndexedDB database

    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => {
        console.log(`Database "${dbName}" deleted successfully.`);
    };

    request.onerror = (event) => {
        console.error(`Error deleting database "${dbName}":`, event.target.error);
    };

    request.onblocked = () => {
        console.warn(`Database deletion for "${dbName}" is blocked. Close all open connections.`);
    };
};

function getAllGradeVideos(db, grade) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('contents', 'readonly');
        const store = tx.objectStore('contents');
        const allRequest = store.getAll();

        allRequest.onsuccess = function () {
            const allEntries = allRequest.result;
            const gradeEntries = allEntries.filter(entry => entry.id.startsWith(grade));

            const allVideos = gradeEntries.flatMap(entry =>
                (entry.subcontents || []).flatMap(sub => sub.videos || [])
            );

            resolve(allVideos);
        };

        allRequest.onerror = function (event) {
            reject(event.target.error);
        };
    });
}

// Modify getAllIndexedDbVideos to return videos
export const getAllIndexedDbVideos = (grade) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MyDatabase', 2);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('contents')) {
                db.createObjectStore('contents', { keyPath: 'id' });
                console.log("Object store 'contents' created during upgrade.");
            }
        };

        request.onsuccess = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('contents')) {
                console.error("Object store 'contents' not found. Please ensure it exists before accessing.");
                reject("Object store 'contents' not found.");
                return;
            }

            getAllGradeVideos(db, grade).then(videos => {
                //console.log(`Videos for grade ${grade}:`, videos); // Log videos before resolving
                resolve(videos);
            }).catch(err => {
                reject(err);
            });
        };

        request.onerror = function (event) {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error);
        };
    });
};

export const removeFromIndexedDB = (videoId) => {
    const videoPath = localStorage.getItem('videoPath');
    const contentPath = getVideoData("grade", videoPath) + "_" + getVideoData("subject", videoPath) + "_" + getVideoData("content", videoPath);

    if (!window.indexedDB) {
        console.warn("IndexedDB is not supported in this browser.");
        return;
    }

    const request = indexedDB.open("MyDatabase", 2);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const tx = db.transaction('contents', 'readwrite');
        const store = tx.objectStore('contents');
        const getRequest = store.get(contentPath);

        getRequest.onsuccess = function () {
            let contentData = getRequest.result;

            if (!contentData) {
                console.warn(`No data found for contentPath "${contentPath}"`);
                return;
            }

            // Step 1: find the matching subcontent
            let subcontentName = getVideoData("subcontent", videoPath);
            let subcontent = contentData.subcontents.find(sc => sc.subcontent === subcontentName);

            if (!subcontent) {
                console.warn(`No subcontent found with name "${subcontentName}"`);
                return;
            }

            // Step 2: filter out the video with the given videoId
            const beforeLength = subcontent.videos.length;
            subcontent.videos = subcontent.videos.filter(v => v.videoId !== videoId);

            if (subcontent.videos.length === beforeLength) {
                console.warn(`No video found with id "${videoId}" in "${subcontentName}"`);
                return;
            }

            // Step 3: save updated object back
            const putRequest = store.put(contentData);

            putRequest.onsuccess = function () {
                console.log(`Video with id "${videoId}" deleted successfully from subcontent "${subcontentName}".`);
            };

            putRequest.onerror = function (event) {
                console.error("Error updating contentData:", event.target.error);
            };
        };

        getRequest.onerror = function (event) {
            console.error("Error retrieving contentPath:", event.target.error);
        };
    };

    request.onerror = function (event) {
        console.error("Error opening database:", event.target.error);
    };
};
