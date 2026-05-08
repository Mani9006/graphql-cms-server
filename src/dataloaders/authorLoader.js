/**
 * DataLoader for batching and caching author lookups.
 * Eliminates N+1 query problem for author resolvers.
 */

'use strict';

const DataLoader = require('dataloader');
const Author = require('../models/Author');

/**
 * Batch load authors by their IDs.
 * @param {string[]} ids - Array of author IDs.
 * @returns {Array} Authors in the same order as IDs.
 */
async function batchAuthors(ids) {
  try {
    const authors = Author.findAll();
    const authorMap = new Map();

    for (const author of authors) {
      authorMap.set(author.id, author);
    }

    // Return authors in the same order as requested IDs
    return ids.map(id => authorMap.get(id) || null);
  } catch (err) {
    // Return array of errors matching the input length
    return ids.map(() => {
      const error = new Error(`Failed to load authors: ${err.message}`);
      error.code = 'BATCH_LOAD_ERROR';
      return error;
    });
  }
}

/**
 * Create a new author DataLoader instance.
 * @returns {DataLoader} Configured DataLoader.
 */
function createAuthorLoader() {
  return new DataLoader(batchAuthors, {
    // Cache results within a single request
    cache: true,
    // Use object identity for caching
    cacheKeyFn: key => String(key),
  });
}

module.exports = {
  createAuthorLoader,
  batchAuthors,
};
