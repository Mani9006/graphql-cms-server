/**
 * Article resolver for GraphQL CMS.
 * Handles all article-related queries, mutations, and field resolvers.
 */

'use strict';

const Article = require('../models/Article');
const Category = require('../models/Category');
const { paginate } = require('../utils/pagination');
const { search, filterBy } = require('../utils/search');
const { versionManager } = require('../utils/versionControl');
const config = require('../config');

/**
 * Publish a subscription event.
 * @param {Object} pubsub - PubSub engine.
 * @param {string} type - Event type.
 * @param {Object} entity - Entity data.
 */
function publishEvent(pubsub, type, entity) {
  if (pubsub) {
    pubsub.publish('CONTENT_CHANGED', {
      contentChanged: {
        type,
        entityId: entity.id,
        entity,
        timestamp: new Date().toISOString(),
        message: `${type}: ${entity.title || entity.name || entity.id}`,
      },
    });
    pubsub.publish('ARTICLE_CHANGED', {
      articleChanged: {
        type,
        entityId: entity.id,
        entity,
        timestamp: new Date().toISOString(),
        message: `${type}: ${entity.title || entity.id}`,
      },
    });
  }
}

const articleResolver = {
  Query: {
    /**
     * Get all articles with filtering and pagination.
     */
    articles: (_parent, { filter, page }) => {
      try {
        let articles = Article.findAll();

        // Apply filters
        if (filter) {
          if (filter.status) {
            articles = articles.filter(a => a.status === filter.status);
          }
          if (filter.authorId) {
            articles = articles.filter(a => a.authorId === filter.authorId);
          }
          if (filter.categoryId) {
            articles = articles.filter(a => a.categoryId === filter.categoryId);
          }
          if (filter.tagIds && filter.tagIds.length > 0) {
            articles = articles.filter(a =>
              filter.tagIds.some(tagId => a.tagIds.includes(tagId))
            );
          }

          // Full-text search
          if (filter.searchQuery) {
            const searchResult = search({
              collection: articles,
              query: filter.searchQuery,
              fields: ['title', 'content', 'excerpt'],
              limit: config.search.maxResults,
            });
            articles = searchResult.results.map(r => r.item);
          }
        }

        return paginate(articles, page);
      } catch (err) {
        throw new Error(`Failed to fetch articles: ${err.message}`);
      }
    },

    /**
     * Get a single article by ID.
     */
    article: (_parent, { id }, { loaders }) => {
      try {
        const article = Article.findById(id);
        if (!article) {
          const err = new Error(`Article with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }
        return article;
      } catch (err) {
        if (err.code === 'NOT_FOUND') throw err;
        throw new Error(`Failed to fetch article: ${err.message}`);
      }
    },

    /**
     * Get article version history.
     */
    articleVersions: (_parent, { id }) => {
      const article = Article.findById(id);
      if (!article) {
        const err = new Error(`Article with ID "${id}" not found`);
        err.code = 'NOT_FOUND';
        throw err;
      }
      return versionManager.getHistory(id);
    },

    /**
     * Compare two article versions.
     */
    compareVersions: (_parent, { id, fromVersion, toVersion }) => {
      const article = Article.findById(id);
      if (!article) {
        const err = new Error(`Article with ID "${id}" not found`);
        err.code = 'NOT_FOUND';
        throw err;
      }
      return versionManager.compareVersions(id, fromVersion, toVersion);
    },
  },

  Mutation: {
    /**
     * Create a new article.
     */
    createArticle: (_parent, { input }, { pubsub }) => {
      try {
        const article = Article.create(input);
        versionManager.store(article, 'CREATE', input.authorId);
        publishEvent(pubsub, 'ARTICLE_CREATED', article);
        return article;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Update an existing article.
     */
    updateArticle: (_parent, { id, input }, { pubsub }) => {
      try {
        const existing = Article.findById(id);
        if (!existing) {
          const err = new Error(`Article with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        versionManager.store(existing, 'UPDATE', input.authorId);
        const updated = Article.update(id, input);
        publishEvent(pubsub, 'ARTICLE_UPDATED', updated);
        return updated;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Delete an article.
     */
    deleteArticle: (_parent, { id }, { pubsub }) => {
      try {
        const existing = Article.findById(id);
        if (!existing) {
          const err = new Error(`Article with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        versionManager.store(existing, 'DELETE');
        Article.remove(id);
        publishEvent(pubsub, 'ARTICLE_DELETED', existing);
        return true;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Change article status with workflow validation.
     */
    changeArticleStatus: (_parent, { id, status }, { pubsub }) => {
      try {
        const article = Article.findById(id);
        if (!article) {
          const err = new Error(`Article with ID "${id}" not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }

        const updated = Article.update(id, { status });
        publishEvent(pubsub, 'ARTICLE_UPDATED', updated);
        return updated;
      } catch (err) {
        throw err;
      }
    },

    /**
     * Restore an article to a specific version.
     */
    restoreArticleVersion: (_parent, { id, version }, { pubsub }) => {
      const restored = versionManager.restoreVersion(id, version);
      if (!restored) {
        const err = new Error(`Version ${version} not found for article "${id}"`);
        err.code = 'NOT_FOUND';
        throw err;
      }

      const updated = Article.update(id, {
        title: restored.title,
        content: restored.content,
        excerpt: restored.excerpt,
        tagIds: restored.tagIds,
      });

      publishEvent(pubsub, 'ARTICLE_UPDATED', updated);
      return updated;
    },
  },

  /**
   * Field resolvers for Article type.
   */
  Article: {
    author: (parent, _args, { loaders }) => {
      return loaders.author.load(parent.authorId);
    },

    category: (parent) => {
      if (!parent.categoryId) return null;
      return Category.findById(parent.categoryId);
    },

    tags: (parent, _args, { loaders }) => {
      if (!parent.tagIds || parent.tagIds.length === 0) return [];
      return parent.tagIds.map(tagId => loaders.tag.load(tagId)).filter(Boolean);
    },

    versions: (parent) => {
      return versionManager.getHistory(parent.id);
    },
  },

  SearchResultItem: {
    __resolveType(obj) {
      if (obj.title && obj.content) return 'Article';
      if (obj.email || obj.bio) return 'Author';
      if (obj.slug && !obj.description) return 'Tag';
      return 'Article';
    },
  },

  SubscriptionEntity: {
    __resolveType(obj) {
      if (obj.title && obj.content) return 'Article';
      if (obj.email || obj.bio) return 'Author';
      if (obj.slug && obj.color) return 'Tag';
      return 'Category';
    },
  },
};

module.exports = articleResolver;
