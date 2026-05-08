/**
 * DataLoader factory for creating all loaders per-request.
 */

'use strict';

const { createAuthorLoader } = require('./authorLoader');
const { createTagLoader, createArticleTagLoader } = require('./tagLoader');

/**
 * Create all DataLoaders for a single request context.
 * @returns {Object} Object containing all loaders.
 */
function createLoaders() {
  return {
    author: createAuthorLoader(),
    tag: createTagLoader(),
    articleTags: createArticleTagLoader(),
  };
}

module.exports = {
  createLoaders,
};
