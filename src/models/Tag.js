/**
 * Tag model for GraphQL CMS.
 * Handles tag CRUD operations and JSON file persistence.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const DATA_FILE = path.join(config.data.basePath, config.data.files.tags);

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
    throw new Error(`Failed to read tags: ${err.message}`);
  }
}

function writeAll(tags) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tags, null, 2));
  } catch (err) {
    throw new Error(`Failed to write tags: ${err.message}`);
  }
}

/**
 * Normalize tag name for consistent storage.
 * @param {string} name - Raw tag name.
 * @returns {string} Normalized name.
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Validate tag data.
 * @param {Object} data - Tag data.
 * @param {boolean} [isUpdate=false] - Is update.
 * @throws {Error} If validation fails.
 */
function validate(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 50) {
      errors.push('Name must not exceed 50 characters');
    }
  }

  if (data.color !== undefined && data.color !== null) {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(data.color)) {
      errors.push('Color must be a valid hex color (e.g., #FF5733)');
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 300) {
      errors.push('Description must not exceed 300 characters');
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
 * Create a new tag.
 * @param {Object} data - Tag data.
 * @returns {Object} Created tag.
 */
function create(data) {
  validate(data);

  const tags = readAll();
  const normalizedName = normalizeName(data.name);

  // Check for duplicate slug
  if (tags.some(t => t.slug === normalizedName)) {
    const err = new Error(`Tag "${data.name}" already exists`);
    err.code = 'DUPLICATE_TAG';
    throw err;
  }

  const now = new Date().toISOString();
  const tag = {
    id: uuidv4(),
    name: data.name.trim(),
    slug: normalizedName,
    color: data.color || '#6366F1',
    description: data.description ? data.description.trim() : null,
    articleCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  tags.push(tag);
  writeAll(tags);

  return tag;
}

/**
 * Find tag by ID.
 * @param {string} id - Tag ID.
 * @returns {Object|null} Tag or null.
 */
function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const tags = readAll();
  return tags.find(t => t.id === id) || null;
}

/**
 * Find tags by IDs.
 * @param {string[]} ids - Tag IDs.
 * @returns {Array} Found tags.
 */
function findByIds(ids) {
  if (!Array.isArray(ids)) return [];
  const tags = readAll();
  return tags.filter(t => ids.includes(t.id));
}

/**
 * Find all tags.
 * @returns {Array} All tags.
 */
function findAll() {
  return readAll();
}

/**
 * Update a tag.
 * @param {string} id - Tag ID.
 * @param {Object} data - Update data.
 * @returns {Object} Updated tag.
 */
function update(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Tag ID is required');
  }

  validate(data, true);

  const tags = readAll();
  const index = tags.findIndex(t => t.id === id);

  if (index === -1) {
    const err = new Error(`Tag with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const tag = tags[index];
  const now = new Date().toISOString();

  // Check slug uniqueness
  if (data.name) {
    const newSlug = normalizeName(data.name);
    if (newSlug !== tag.slug && tags.some((t, i) => i !== index && t.slug === newSlug)) {
      const err = new Error(`Tag "${data.name}" already exists`);
      err.code = 'DUPLICATE_TAG';
      throw err;
    }
  }

  const updated = {
    ...tag,
    ...(data.name !== undefined && {
      name: data.name.trim(),
      slug: normalizeName(data.name),
    }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
    updatedAt: now,
  };

  tags[index] = updated;
  writeAll(tags);

  return updated;
}

/**
 * Delete a tag.
 * @param {string} id - Tag ID.
 * @returns {boolean} True if deleted.
 */
function remove(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Tag ID is required');
  }

  const tags = readAll();
  const index = tags.findIndex(t => t.id === id);

  if (index === -1) {
    const err = new Error(`Tag with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  tags.splice(index, 1);
  writeAll(tags);

  return true;
}

module.exports = {
  create,
  findById,
  findByIds,
  findAll,
  update,
  remove,
  normalizeName,
  readAll,
  writeAll,
  validate,
};
