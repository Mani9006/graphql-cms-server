/**
 * Category model for GraphQL CMS.
 * Handles category CRUD with nested hierarchy support.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const DATA_FILE = path.join(config.data.basePath, config.data.files.categories);

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
    throw new Error(`Failed to read categories: ${err.message}`);
  }
}

function writeAll(categories) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(categories, null, 2));
  } catch (err) {
    throw new Error(`Failed to write categories: ${err.message}`);
  }
}

/**
 * Generate slug from name.
 * @param {string} name - Category name.
 * @returns {string} URL-friendly slug.
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);
}

/**
 * Validate category data.
 * @param {Object} data - Category data.
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
    } else if (data.name.length > 100) {
      errors.push('Name must not exceed 100 characters');
    }
  }

  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
  }

  if (data.parentId !== undefined && data.parentId !== null) {
    const categories = readAll();
    const parent = categories.find(c => c.id === data.parentId);
    if (!parent) {
      errors.push(`Parent category with ID "${data.parentId}" not found`);
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
 * Create a new category.
 * @param {Object} data - Category data.
 * @returns {Object} Created category.
 */
function create(data) {
  validate(data);

  const categories = readAll();
  const slug = slugify(data.name);

  // Check for duplicate slug
  if (categories.some(c => c.slug === slug)) {
    const err = new Error(`Category "${data.name}" already exists`);
    err.code = 'DUPLICATE_CATEGORY';
    throw err;
  }

  const now = new Date().toISOString();
  const category = {
    id: uuidv4(),
    name: data.name.trim(),
    slug,
    description: data.description ? data.description.trim() : null,
    parentId: data.parentId || null,
    color: data.color || '#3B82F6',
    icon: data.icon || null,
    sortOrder: data.sortOrder || 0,
    articleCount: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  categories.push(category);
  writeAll(categories);

  return category;
}

/**
 * Find category by ID.
 * @param {string} id - Category ID.
 * @returns {Object|null} Category or null.
 */
function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const categories = readAll();
  return categories.find(c => c.id === id) || null;
}

/**
 * Find all categories.
 * @param {Object} [filters] - Optional filters.
 * @returns {Array} Categories array.
 */
function findAll(filters = {}) {
  let categories = readAll();

  if (filters.isActive !== undefined) {
    categories = categories.filter(c => c.isActive === filters.isActive);
  }
  if (filters.parentId !== undefined) {
    categories = categories.filter(c => c.parentId === filters.parentId);
  }

  return categories;
}

/**
 * Get hierarchical tree of categories.
 * @returns {Array} Category tree with children.
 */
function getTree() {
  const categories = readAll().filter(c => c.isActive);
  const categoryMap = new Map();

  for (const cat of categories) {
    categoryMap.set(cat.id, { ...cat, children: [] });
  }

  const roots = [];
  for (const cat of categories) {
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      categoryMap.get(cat.parentId).children.push(categoryMap.get(cat.id));
    } else {
      roots.push(categoryMap.get(cat.id));
    }
  }

  return roots;
}

/**
 * Update a category.
 * @param {string} id - Category ID.
 * @param {Object} data - Update data.
 * @returns {Object} Updated category.
 */
function update(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error('Category ID is required');
  }

  validate(data, true);

  const categories = readAll();
  const index = categories.findIndex(c => c.id === id);

  if (index === -1) {
    const err = new Error(`Category with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Prevent circular reference
  if (data.parentId === id) {
    const err = new Error('Category cannot be its own parent');
    err.code = 'CIRCULAR_REFERENCE';
    throw err;
  }

  const category = categories[index];
  const now = new Date().toISOString();

  // Check slug uniqueness
  if (data.name) {
    const newSlug = slugify(data.name);
    if (newSlug !== category.slug && categories.some((c, i) => i !== index && c.slug === newSlug)) {
      const err = new Error(`Category "${data.name}" already exists`);
      err.code = 'DUPLICATE_CATEGORY';
      throw err;
    }
  }

  const updated = {
    ...category,
    ...(data.name !== undefined && {
      name: data.name.trim(),
      slug: slugify(data.name),
    }),
    ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
    ...(data.parentId !== undefined && { parentId: data.parentId }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.icon !== undefined && { icon: data.icon }),
    ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: now,
  };

  categories[index] = updated;
  writeAll(categories);

  return updated;
}

/**
 * Delete a category.
 * @param {string} id - Category ID.
 * @returns {boolean} True if deleted.
 */
function remove(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Category ID is required');
  }

  const categories = readAll();

  // Check for child categories
  const children = categories.filter(c => c.parentId === id);
  if (children.length > 0) {
    const err = new Error(`Cannot delete category with ${children.length} subcategories`);
    err.code = 'HAS_CHILDREN';
    throw err;
  }

  const index = categories.findIndex(c => c.id === id);

  if (index === -1) {
    const err = new Error(`Category with ID "${id}" not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  categories.splice(index, 1);
  writeAll(categories);

  return true;
}

module.exports = {
  create,
  findById,
  findAll,
  getTree,
  update,
  remove,
  slugify,
  readAll,
  writeAll,
  validate,
};
