/**
 * DataLoader for batching and caching tag lookups.
 * Eliminates N+1 query problem for tag resolvers.
 */

'use strict';

const DataLoader = require('dataloader');
const Tag = require('../models/Tag');

/**
 * Batch load tags by their IDs.
 * @param {string[]} ids - Array of tag IDs.
 * @returns {Array} Tags in the same order as IDs.
 */
async function batchTags(ids) {
  try {
    const tags = Tag.findAll();
    const tagMap = new Map();

    for (const tag of tags) {
      tagMap.set(tag.id, tag);
    }

    return ids.map(id => tagMap.get(id) || null);
  } catch (err) {
    return ids.map(() => {
      const error = new Error(`Failed to load tags: ${err.message}`);
      error.code = 'BATCH_LOAD_ERROR';
      return error;
    });
  }
}

/**
 * Batch load multiple tags for many articles.
 * @param {string[][]} keysArrays - Arrays of tag ID arrays.
 * @returns {Array[]} Tags grouped by article.
 */
async function batchArticleTags(keysArrays) {
  try {
    const allTagIds = [...new Set(keysArrays.flat())];
    const tags = Tag.findAll();
    const tagMap = new Map();

    for (const tag of tags) {
      tagMap.set(tag.id, tag);
    }

    return keysArrays.map(tagIds =>
      tagIds.map(id => tagMap.get(id)).filter(Boolean)
    );
  } catch (err) {
    return keysArrays.map(() => []);
  }
}

/**
 * Create a tag DataLoader for single tag lookups.
 * @returns {DataLoader} Configured DataLoader.
 */
function createTagLoader() {
  return new DataLoader(batchTags, {
    cache: true,
    cacheKeyFn: key => String(key),
  });
}

/**
 * Create a tag DataLoader for article tag lookups.
 * @returns {DataLoader} Configured DataLoader.
 */
function createArticleTagLoader() {
  return new DataLoader(batchArticleTags, {
    cache: true,
    cacheKeyFn: key => JSON.stringify(key),
  });
}

module.exports = {
  createTagLoader,
  createArticleTagLoader,
  batchTags,
  batchArticleTags,
};
