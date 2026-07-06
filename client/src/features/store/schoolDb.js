const DB_NAME = 'grade_db';
const DB_VERSION = 1; // bump version
const STORE_NAME = 'subjects';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('grade_id', 'grade_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


export async function saveSubjectsToIndexedDB(subjects, grade_id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Save everything under ONE grade record
    const gradeRecord = {
      id: grade_id,
      subjects: subjects
    };

    store.put(gradeRecord);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}



export async function getSubjectNameBySubcontentId(subcontentId, grade_id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('grade_id');

    const request = index.getAll(grade_id);

    request.onsuccess = () => {
      const subjects = request.result;

      for (const subject of subjects) {
        for (const content of subject.contents || []) {
          for (const sub of content.subcontents || []) {
            if (sub.id === subcontentId) {
              resolve(subject.name);
              return;
            }
          }
        }
      }

      resolve(null);
    };

    request.onerror = () => reject(request.error);
  });
}
export async function saveVideosToSubcontentIndexedDB({
  grade_id,
  subject_id,
  content_id,
  subcontent_id,
  videos
}) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('subjects', 'readwrite');
    const store = tx.objectStore('subjects');

    const getReq = store.get(subject_id);

    getReq.onsuccess = () => {
      const subject = getReq.result;

      if (!subject || subject.grade_id !== grade_id) {
        resolve(false);
        return;
      }

      let updated = false;

      for (const content of subject.contents || []) {
        if (content.id !== content_id) continue;

        for (const sub of content.subcontents || []) {
          if (sub.id === subcontent_id) {
            sub.videos = videos; // 🔥 attach videos here
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        resolve(false);
        return;
      }

      store.put(subject);
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
async function saveToIndexedDB(locator, videos) {
  const {
    grade_id,
    subject_id,
    content_id,
    subcontent_id
  } = locator;

  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getRequest = store.get(subject_id);

    getRequest.onsuccess = function () {
      const subject = getRequest.result;

      if (!subject || subject.grade_id !== grade_id) {
        resolve(false);
        return;
      }

      let updated = false;

      for (const content of subject.contents || []) {
        if (content.id !== content_id) continue;

        for (const sub of content.subcontents || []) {
          if (sub.id === subcontent_id) {
            sub.videos = videos; // ✅ attach videos correctly
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        resolve(false);
        return;
      }

      store.put(subject);
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
