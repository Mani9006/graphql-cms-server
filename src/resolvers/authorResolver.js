/**
 * Author resolver for GraphQL CMS.
 * Handles all author-related queries, mutations, and field resolvers.
 */

'use strict';

const Author = require('../models/Author');
const Article = require('../models/Article');
const { paginate } = require('../utils/pagination');
const { search, filterBy } = require('../utils/search');

/**
 * Publish subscription event for author changes.
 */
function publishEvent(pubsub, type, entity) {
  if (pubsub) {
    pubsub.publish('AUTHOR_CHANGED', {
      authorChanged: {
        type,
        entityId: entity.id,
        entity,
        timestamp: new Date().toISOString(),
        message: `${type}: ${entity.name || entity.id}`,
      },
    });
  }
}

const authorResolver = {
  Query: {
    /**
     * Get all authors with filtering and pagination.
     */
    authors: (_parent, { filter, page }) => {
      try {
        let authors = Author.findAll();

        if (filter) {
          if (filter.role) {
            authors = authors.filter(a => a.role === filter.role);
          }
          if (filter.isActive !== undefined) {
            authors = authors.filter(a => a.isActive === filter.isActive);
          }
          if (filter.searchQuery) {
            const result = search({
              collection: authors,
              query: filter.searchQuery,
              fields: ['name', 'bio'],
              limit: 50,
            });
            authors = result.results.map(r => r.item);
          }
        }

        return paginate(authors, page);
      } catch (err) {
        throw new Error(`Failed to fetch authors: ${err.message}`);
      }
    },

    /**
     * Get a single author by ID.
     */
    author: (_parent, { id }, { loaders }) => {
      try {
        const author = Author.findById(id);
        if (!author) {
          const err = new Error(`Author with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }
        return author;
      } catch (err) {
        if (err.code === 'NOT_FOUND') throw err;
        throw new Error(`Failed to fetch author: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new author.
     */
    createAuthor: (_parent, { input }, { pubsub }) => {
      try {
        const author = Author.create(input);
        publishEvent(pubsub, 'AUTHOR_CREATED', author);
        return author;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Update an existing author.
     */
    updateAuthor: (_parent, { id, input }, { pubsub }) => {
      try {
        const existing = Author.findById(id);
        if (!existing) {
          const err = new Error(`Author with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        const updated = Author.update(id, input);
        publishEvent(pubsub, 'AUTHOR_UPDATED', updated);
        return updated;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Delete an author.
     */
    deleteAuthor: (_parent, { id }) => {
      try {
        const existing = Author.findById(id);
        if (!existing) {
          const err = new Error(`Author with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        return Author.remove(id);
      } catch (err) {
        throw err;
      }
    },
  },

  /**
   * Field resolvers for Author type.
   */
  Author: {
    articles: (parent, { page }) => {
      const articles = Article.findAll({ authorId: parent.id });
      return paginate(articles, page);
    },
  },
};

module.exports = authorResolver;
