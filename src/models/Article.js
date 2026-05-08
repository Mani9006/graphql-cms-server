/**
 * Article model for GraphQL CMS.
 * Handles article CRUD operations and JSON file persistence.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const DATA_FILE = path.join(config.data.basePath, config.data.files.articles);

/**
 * Ensure data directory and file exist.
 */
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Read all articles from storage.
 * @returns {Array} Array of articles.
 */
function readAll() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`Failed to read articles: ${err.message}`);
  }
}

/**
 * Write all articles to storage.
 * @param {Array} articles - Articles to write.
 */
function writeAll(articles) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2));
  } catch (err) {
    throw new Error(`Failed to write articles: ${err.message}`);
  }
}

/**
 * Validate article input data.
 * @param {Object} data - Article data to validate.
 * @param {boolean} [isUpdate=false] - Whether validating for update.
 * @throws {Error} If validation fails.
 */
function validate(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (data.title.length < 3) {
      errors.push('Title must be at least 3 characters');
    } else if (data.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
  }

  if (!isUpdate || data.content !== undefined) {
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Content is required and must be a string');
    } else if (data.content.length < 10) {
      errors.push('Content must be at least 10 characters');
    }
  }

  if (data.excerpt !== undefined && typeof data.excerpt !== 'string') {
    errors.push('Excerpt must be a string');
  }

  if (!isUpdate && !data.authorId) {
    errors.push('Author ID is required');
  }

  if (data.authorId !== undefined) {
    const authors = require('./Author');
    const author = authors.findById(data.authorId);
    if (!author) {
      errors.push(`Author with ID "${data.authorId}" not found`);
    }
  }

  if (data.categoryId !== undefined && data.categoryId !== null) {
    const categories = require('./Category');
    const category = categories.findById(data.categoryId);
    if (!category) {
      errors.push(`Category with ID "${data.categoryId}" not found`);
    }
  }

  if (data.tagIds !== undefined) {
    if (!Array.isArray(data.tagIds)) {
      errors.push('Tag IDs must be an array');
    } else {
      const tags = require('./Tag');
      const allTags = tags.findAll();
      const validTagIds = new Set(allTags.map(t => t.id));
      for (const tagId of data.tagIds) {
        if (!validTagIds.has(tagId)) {
          errors.push(`Tag with ID "${tagId}" not found`);
        }
      }
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    const err = new Error(`Validation failed: ${errors.join('; ')}`);
    err.code = 'VALIDATION_ERROR';
    err.details = errors;
    throw err;
  }
}

/**
 * Create a new article.
 * @param {Object} data - Article creation data.
 * @returns {Object} Created article.
 */
function create(data) {
  validate(data);

  const articles = readAll();
  const now = new Date().toISOString();

  const article = {
    id: uuidv4(),
    title: data.title.trim(),
    content: data.content.trim(),
    excerpt: data.excerpt ? data.excerpt.trim() : data.content.substring(0, 200).trim(),
    authorId: data.authorId,
    categoryId: data.categoryId || null,
    tagIds: data.tagIds || [],
    status: data.status || 'DRAFT',
    version: 1,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === 'PUBLISHED' ? now : null,
  };

  articles.push(article);
  writeAll(articles);

  return article;
}

/**
 * Find an article by ID.
 * @param {string} id - Article ID.
 * @returns {Object|null} Article or null.
 */
function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const articles = readAll();
  return articles.find(a => a.id === id) || null;
}

/**
 * Find all articles with optional filtering.
 * @param {Object} [filters] - Filter criteria.
 * @returns {Array} Filtered articles.
 */
function findAll(filters = {}) {
  let articles = readAll();

  if (filters.status) {
    articles = articles.filter(a => a.status === filters.status);
  }
  if (filters.authorId) {
    articles = articles.filter(a => a.authorId === filters.authorId);
  }
  if (filters.categoryId) {
    articles = articles.filter(a => a.categoryId === filters.categoryId);
  }
  if (filters.tagIds && Array.isArray(filters.tagIds)) {
    articles = articles.filter(a =>
      filters.tagIds.some(tagId => a.tagIds.includes(tagId))
    );
  }

  return articles;
}

/**
 * Update an article.
 * @param {string} id - Article ID.
 * @param {Object} data - Update data.
 * @returns {Object} Updated article.
 */
function update(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Article ID is required');
  }

  validate(data, true);

  const articles = readAll();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    const err = new Error(`Article with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const article = articles[index];
  const now = new Date().toISOString();

  // Check status transition validity
  if (data.status && data.status !== article.status) {
    const { validTransitions } = config.publishing;
    const allowed = validTransitions[article.status] || [];
    if (!allowed.includes(data.status)) {
      const err = new Error(
        `Invalid status transition from "${article.status}" to "${data.status}". Allowed: ${allowed.join(', ')}`
      );
      err.code = 'INVALID_TRANSITION';
      throw err;
    }
  }

  const updated = {
    ...article,
    ...(data.title !== undefined && { title: data.title.trim() }),
    ...(data.content !== undefined && { content: data.content.trim() }),
    ...(data.excerpt !== undefined && { excerpt: data.excerpt.trim() }),
    ...(data.authorId !== undefined && { authorId: data.authorId }),
    ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
    ...(data.tagIds !== undefined && { tagIds: data.tagIds }),
    ...(data.status !== undefined && { status: data.status }),
    version: article.version + 1,
    updatedAt: now,
    ...(data.status === 'PUBLISHED' && article.status !== 'PUBLISHED' && { publishedAt: now }),
  };

  articles[index] = updated;
  writeAll(articles);

  return updated;
}

/**
 * Delete an article.
 * @param {string} id - Article ID.
 * @returns {boolean} True if deleted.
 */
function remove(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Article ID is required');
  }

  const articles = readAll();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) {
    const err = new Error(`Article with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  articles.splice(index, 1);
  writeAll(articles);

  return true;
}

/**
 * Increment view count for an article.
 * @param {string} id - Article ID.
 * @returns {Object|null} Updated article or null.
 */
function incrementViews(id) {
  const articles = readAll();
  const index = articles.findIndex(a => a.id === id);

  if (index === -1) return null;

  articles[index].viewCount = (articles[index].viewCount || 0) + 1;
  writeAll(articles);

  return articles[index];
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
  incrementViews,
  readAll,
  writeAll,
  validate,
};
