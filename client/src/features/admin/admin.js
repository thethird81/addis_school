'use strict';

// Re-export all admin modules
require('./delete/deleteVideo.js');
require('./users/user.js');
require('./adminServices.js');
require('./grades/gradeManagement.js');
require('./subjects/subjectManagement.js');
require('./contents/contentManagement.js');
require('./subcontents/subcontentManagement.js');
require('./channels/channelManagement.js');
require('./assignments/assignmentManagement.js');

// Video modules - these handle their own CSS import
require('./videos/videoFetcher.js');
require('./videos/videoDeleter.js');

// This file serves as the legacy entry point for backward compatibility
// The new admin panel entry point is src/pages/admin/admin.js