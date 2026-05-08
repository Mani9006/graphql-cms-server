/**
 * Category resolver for GraphQL CMS.
 * Handles all category-related queries, mutations, and field resolvers.
 */

'use strict';

const Category = require('../models/Category');
const Article = require('../models/Article');
const { paginate } = require('../utils/pagination');

/**
 * Publish subscription event for category changes.
 */
function publishEvent(pubsub, type, entity) {
  if (pubsub) {
    pubsub.publish('CONTENT_CHANGED', {
      contentChanged: {
        type,
        entityId: entity.id,
        entity,
        timestamp: new Date().toISOString(),
        message: `${type}: ${entity.name || entity.id}`,
      },
    });
  }
}

const categoryResolver = {
  Query: {
    /**
     * Get all categories with pagination.
     */
    categories: (_parent, { page }) => {
      try {
        const categories = Category.findAll();
        return paginate(categories, page);
      } catch (err) {
        throw new Error(`Failed to fetch categories: ${err.message}`);
      }
    },

    /**
     * Get category tree with nested children.
     */
    categoryTree: () => {
      try {
        return Category.getTree();
      } catch (err) {
        throw new Error(`Failed to fetch category tree: ${err.message}`);
      }
    },

    /**
     * Get a single category by ID.
     */
    category: (_parent, { id }) => {
      try {
        const category = Category.findById(id);
        if (!category) {
          const err = new Error(`Category with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }
        return category;
      } catch (err) {
        if (err.code === 'NOT_FOUND') throw err;
        throw new Error(`Failed to fetch category: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new category.
     */
    createCategory: (_parent, { input }, { pubsub }) => {
      try {
        const category = Category.create(input);
        publishEvent(pubsub, 'CATEGORY_CREATED', category);
        return category;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Update an existing category.
     */
    updateCategory: (_parent, { id, input }) => {
      try {
        const existing = Category.findById(id);
        if (!existing) {
          const err = new Error(`Category with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        return Category.update(id, input);
      } catch (err) {
        throw err;
      }
    },

    /**
     * Delete a category.
     */
    deleteCategory: (_parent, { id }) => {
      try {
        const existing = Category.findById(id);
        if (!existing) {
          const err = new Error(`Category with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        return Category.remove(id);
      } catch (err) {
        throw err;
      }
    },
  },

  /**
   * Field resolvers for Category type.
   */
  Category: {
    parent: (parent) => {
      if (!parent.parentId) return null;
      return Category.findById(parent.parentId);
    },

    children: (parent) => {
      return Category.findAll({ parentId: parent.id });
    },

    articles: (parent, { page }) => {
      const articles = Article.findAll({ categoryId: parent.id });
      return paginate(articles, page);
    },
  },
};

module.exports = categoryResolver;
