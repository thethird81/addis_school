import { getBaseUrl} from '../utils/path.js'


export const getUsernameFromEmail = (email) => {
    if (typeof email !== 'string') return '';
    const atIndex = email.indexOf('@');
    return atIndex > 0 ? email.slice(0, atIndex) : '';
}

// Generic function to update any specified field in the user data object
export const updateUserField = async (field, newValue) => {
    // Check if userData exists in localStorage
    let userData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : null;

    if (!userData) {
        console.error("❌ userData is null or invalid. Cannot update the field.");
        return;
    }

    // Update the specified field in localStorage
    userData[field] = newValue;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`✅ Updated ${field} in localStorage:`, newValue);
    console.log("userData after update:", userData);
};
export const getBasePath = () => {
    return process.env.NODE_ENV === 'development' ? '/dist/' : '/';
};
export const getVideoData = (type) => {
     const videoCategory = localStorage.getItem('videoCategory');
     console.log("getVideoData - videoCategory:", videoCategory);

    // Split the videoCategory by "_"
    const parts = videoCategory.split("_");
    // Map the parts to keys
    const data = {
        grade: parts[0],       // e.g. "3-4"
        subject: parts[1],     // e.g. "Science"
        content: parts[2],     // e.g. "Energy"
        subcontent: parts[3]   // e.g. "EnergyTransfers"
    };

    // Return the requested type (case-insensitive)
    return data[type.toLowerCase()] || null;
}

export const getGradeName = (gradeId) => {

    const grades = JSON.parse(localStorage.getItem('grades')) || {};
    return grades[gradeId] || "Unknown Grade";
}
export function resolveNamesFromLocator(gradeObject, locator) {
  if (!gradeObject) return null;

  const {
    grade_id,
    subject_id,
    content_id,
    subcontent_id
  } = locator;

  if (gradeObject.gradeId !== grade_id) return null;

  const subject = (gradeObject.subjects || [])
    .find(s => s.subjectId === subject_id);

  if (!subject) return null;

  const content = (subject.contents || [])
    .find(c => c.contentId === content_id);

  if (!content) return null;

  const subcontent = (content.subcontents || [])
    .find(sc => sc.subcontentId === subcontent_id);

  if (!subcontent) return null;

  return {
    gradeName: gradeObject.gradeName,
    subjectName: subject.subjectName,
    contentName: content.contentName,
    subcontentName: subcontent.subcontentName
  };
}

export const refresh = async () => {  
    const url = `${getBaseUrl()}/api/v1/auth/refresh`;
    console.log("Refreshing access token with URL:", url);
 const res = await fetch(url, {
  method: 'GET',
  credentials: 'include', // 🔥 REQUIRED for cookies
  headers: { 'Content-Type': 'application/json' },
  
});

const data = await res.json();
localStorage.setItem('accessToken', data.accessToken);
return data.accessToken;

  
}
