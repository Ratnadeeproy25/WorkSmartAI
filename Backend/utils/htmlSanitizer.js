const striptags = require('striptags');

/**
 * Strip HTML tags from a string while preserving line breaks
 * @param {string} html - The HTML string to clean
 * @returns {string} - Clean text without HTML tags
 */
const stripHtmlTags = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Convert <br>, <br/>, <br /> tags to line breaks
  let cleanText = html.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert </p> tags to double line breaks for paragraph separation
  cleanText = cleanText.replace(/<\/p>/gi, '\n\n');
  
  // Convert <div> closing tags to line breaks
  cleanText = cleanText.replace(/<\/div>/gi, '\n');
  
  // Strip all remaining HTML tags
  cleanText = striptags(cleanText);
  
  // Clean up multiple consecutive line breaks (more than 2)
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace from the beginning and end
  cleanText = cleanText.trim();
  
  return cleanText;
};

/**
 * Sanitize task data by stripping HTML from description
 * @param {Object} taskData - The task data object
 * @returns {Object} - Sanitized task data
 */
const sanitizeTaskData = (taskData) => {
  if (!taskData) return taskData;
  
  const sanitized = { ...taskData };
  
  // Strip HTML from description
  if (sanitized.description) {
    sanitized.description = stripHtmlTags(sanitized.description);
  }
  
  // Strip HTML from title as well (just in case)
  if (sanitized.title) {
    sanitized.title = stripHtmlTags(sanitized.title);
  }
  
  return sanitized;
};

module.exports = {
  stripHtmlTags,
  sanitizeTaskData
}; 