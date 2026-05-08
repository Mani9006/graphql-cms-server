/**
 * Author model for GraphQL CMS.
 * Handles author CRUD operations and JSON file persistence.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const DATA_FILE = path.join(config.data.basePath, config.data.files.authors);

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readAll() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`Failed to read authors: ${err.message}`);
  }
}

function writeAll(authors) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(authors, null, 2));
  } catch (err) {
    throw new Error(`Failed to write authors: ${err.message}`);
  }
}

/**
 * Validate author input data.
 * @param {Object} data - Author data.
 * @param {boolean} [isUpdate=false] - Is update validation.
 * @throws {Error} If validation fails.
 */
function validate(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 100) {
      errors.push('Name must not exceed 100 characters');
    }
  }

  if (data.email !== undefined && data.email !== null) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Email must be a valid email address');
    }
  }

  if (data.bio !== undefined && data.bio !== null) {
    if (typeof data.bio !== 'string') {
      errors.push('Bio must be a string');
    } else if (data.bio.length > 1000) {
      errors.push('Bio must not exceed 1000 characters');
    }
  }

  if (data.role !== undefined) {
    const validRoles = ['ADMIN', 'EDITOR', 'AUTHOR', 'CONTRIBUTOR'];
    if (!validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
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
 * Create a new author.
 * @param {Object} data - Author creation data.
 * @returns {Object} Created author.
 */
function create(data) {
  validate(data);

  const authors = readAll();
  const now = new Date().toISOString();

  // Check for duplicate email
  if (data.email && authors.some(a => a.email === data.email)) {
    const err = new Error(`Author with email "${data.email}" already exists`);
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const author = {
    id: uuidv4(),
    name: data.name.trim(),
    email: data.email ? data.email.trim().toLowerCase() : null,
    bio: data.bio ? data.bio.trim() : null,
    avatar: data.avatar || null,
    role: data.role || 'AUTHOR',
    socialLinks: data.socialLinks || {},
    isActive: true,
    articleCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  authors.push(author);
  writeAll(authors);

  return author;
}

/**
 * Find author by ID.
 * @param {string} id - Author ID.
 * @returns {Object|null} Author or null.
 */
function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const authors = readAll();
  return authors.find(a => a.id === id) || null;
}

/**
 * Find all authors.
 * @param {Object} [filters] - Optional filters.
 * @returns {Array} Authors array.
 */
function findAll(filters = {}) {
  let authors = readAll();

  if (filters.role) {
    authors = authors.filter(a => a.role === filters.role);
  }
  if (filters.isActive !== undefined) {
    authors = authors.filter(a => a.isActive === filters.isActive);
  }

  return authors;
}

/**
 * Update an author.
 * @param {string} id - Author ID.
 * @param {Object} data - Update data.
 * @returns {Object} Updated author.
 */
function update(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Author ID is required');
  }

  validate(data, true);

  const authors = readAll();
  const index = authors.findIndex(a => a.id === id);

  if (index === -1) {
    const err = new Error(`Author with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Check email uniqueness
  if (data.email) {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (authors.some((a, i) => i !== index && a.email === normalizedEmail)) {
      const err = new Error(`Author with email "${data.email}" already exists`);
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }
  }

  const author = authors[index];
  const now = new Date().toISOString();

  const updated = {
    ...author,
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
    ...(data.bio !== undefined && { bio: data.bio ? data.bio.trim() : null }),
    ...(data.avatar !== undefined && { avatar: data.avatar }),
    ...(data.role !== undefined && { role: data.role }),
    ...(data.socialLinks !== undefined && { socialLinks: data.socialLinks }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: now,
  };

  // Update article count
  const Article = require('./Article');
  updated.articleCount = Article.findAll({ authorId: id }).length;

  authors[index] = updated;
  writeAll(authors);

  return updated;
}

/**
 * Delete an author.
 * @param {string} id - Author ID.
 * @returns {boolean} True if deleted.
 */
function remove(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Author ID is required');
  }

  // Check for associated articles
  const Article = require('./Article');
  const articles = Article.findAll({ authorId: id });
  if (articles.length > 0) {
    const err = new Error(`Cannot delete author with ${articles.length} associated articles`);
    err.code = 'HAS_DEPENDENCIES';
    throw err;
  }

  const authors = readAll();
  const index = authors.findIndex(a => a.id === id);

  if (index === -1) {
    const err = new Error(`Author with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  authors.splice(index, 1);
  writeAll(authors);

  return true;
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
  readAll,
  writeAll,
  validate,
};
