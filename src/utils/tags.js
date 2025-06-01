/**
 * Common hashtags for social media posts
 */

const TAGS = [
  '#humanrights',
  '#stopthehypocrisy',
  '#selectiveoutrage',
  '#doublestandard',
  '#truthmatters',
  '#wakeupworld',
  '#HamasHypocrisy',
  '#hamasisisis',
  '#hamasterrorists',
  '#breakingnews🚨',
  '#arabworld',
  '#middleeastnews',
  '#violenceawareness',
  '#conflictnews',
  '#newsalert',
  '#ArabViolence',
  '#NewsReport',
  '#Peace'
];

/**
 * Returns a random selection of 5 hashtags from the TAGS array
 * @returns {string} A string of 5 randomly selected hashtags separated by spaces
 */
function getTagString() {
  // Create a copy of the TAGS array to avoid modifying the original
  const tagsCopy = [...TAGS];
  const selectedTags = [];
  
  // Randomly select 5 tags
  for (let i = 0; i < 5 && tagsCopy.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * tagsCopy.length);
    selectedTags.push(tagsCopy.splice(randomIndex, 1)[0]);
  }
  
  return selectedTags.join(' ');
}

module.exports = {
  TAGS,
  getTagString
}; 