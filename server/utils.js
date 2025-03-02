/**
 * Removes content inside <think> tags from the input text
 * @param {string} text - The text to process
 * @returns {string} - Text with <think> tag content removed
 */
function removeThinkTags(text) {
    // This regex matches <think> tags and their content, even across multiple lines
    return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  }
  
  module.exports = {
    removeThinkTags
  };