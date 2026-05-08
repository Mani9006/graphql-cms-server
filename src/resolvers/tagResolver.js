/**
 * Tag resolver for GraphQL CMS.
 * Handles all tag-related queries, mutations, and field resolvers.
 */

'use strict';

const Tag = require('../models/Tag');
const Article = require('../models/Article');
const { paginate } = require('../utils/pagination');

/**
 * Publish subscription event for tag changes.
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

const tagResolver = {
  Query: {
    /**
     * Get all tags with pagination.
     */
    tags: (_parent, { page }) => {
      try {
        const tags = Tag.findAll();
        return paginate(tags, page);
      } catch (err) {
        throw new Error(`Failed to fetch tags: ${err.message}`);
      }
    },

    /**
     * Get a single tag by ID.
     */
    tag: (_parent, { id }, { loaders }) => {
      try {
        const tag = Tag.findById(id);
        if (!tag) {
          const err = new Error(`Tag with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }
        return tag;
      } catch (err) {
        if (err.code === 'NOT_FOUND') throw err;
        throw new Error(`Failed to fetch tag: ${err.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Create a new tag.
     */
    createTag: (_parent, { input }, { pubsub }) => {
      try {
        const tag = Tag.create(input);
        publishEvent(pubsub, 'TAG_CREATED', tag);
        return tag;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Update an existing tag.
     */
    updateTag: (_parent, { id, input }) => {
      try {
        const existing = Tag.findById(id);
        if (!existing) {
          const err = new Error(`Tag with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        return Tag.update(id, input);
      } catch (err) {
        throw err;
      }
    },

    /**
     * Delete a tag.
     */
    deleteTag: (_parent, { id }) => {
      try {
        const existing = Tag.findById(id);
        if (!existing) {
          const err = new Error(`Tag with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        return Tag.remove(id);
      } catch (err) {
        throw err;
      }
    },
  },

  /**
   * Field resolvers for Tag type.
   */
  Tag: {
    articles: (parent, { page }) => {
      const articles = Article.findAll().filter(a =>
        a.tagIds && a.tagIds.includes(parent.id)
      );
      return paginate(articles, page);
    },
  },
};

module.exports = tagResolver;
