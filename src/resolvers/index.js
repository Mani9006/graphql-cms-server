/**
 * Root resolver combining all entity resolvers.
 */

'use strict';

const { PubSub } = require('graphql-subscriptions');
const config = require('../config');

// Import resolvers
const articleResolver = require('./articleResolver');
const authorResolver = require('./authorResolver');
const tagResolver = require('./tagResolver');
const categoryResolver = require('./categoryResolver');

// Create shared PubSub instance
const pubsub = new PubSub();

/**
 * Calculate query complexity score.
 * @param {string} query - GraphQL query string.
 * @returns {Object} Complexity analysis report.
 */
function analyzeComplexity(query) {
  if (!query || typeof query !== 'string') {
    return {
      score: 0,
      maxAllowed: config.graphql.maxComplexity,
      depth: 0,
      maxDepth: config.graphql.maxDepth,
      isAllowed: true,
      details: [],
    };
  }

  let score = 0;
  let depth = 0;
  const details = [];

  // Field complexity weights
  const fieldWeights = {
    articles: 10,
    authors: 10,
    tags: 5,
    categories: 5,
    search: 20,
    article: 2,
    author: 2,
    tag: 1,
    category: 1,
    content: 1,
    versions: 5,
    stats: 15,
  };

  // Count depth by tracking braces
  let currentDepth = 0;
  const lines = query.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Track opening braces
    const openBraces = (trimmed.match(/{/g) || []).length;
    const closeBraces = (trimmed.match(/}/g) || []).length;

    currentDepth += openBraces;
    depth = Math.max(depth, currentDepth);
    currentDepth -= closeBraces;

    // Check for field mentions
    for (const [field, weight] of Object.entries(fieldWeights)) {
      const regex = new RegExp(`\\b${field}\\b`, 'g');
      const matches = trimmed.match(regex);
      if (matches) {
        score += weight * matches.length;
        details.push({
          field,
          score: weight * matches.length,
          depth: currentDepth + openBraces,
        });
      }
    }
  }

  // Connection/pagination multiplier
  if (query.includes('Connection')) score += 5;
  if (query.includes('search')) score += 15;

  return {
    score,
    maxAllowed: config.graphql.maxComplexity,
    depth,
    maxDepth: config.graphql.maxDepth,
    isAllowed: score <= config.graphql.maxComplexity && depth <= config.graphql.maxDepth,
    details,
  };
}

/**
 * Root resolver with Query, Mutation, Subscription,
 * and all entity resolvers merged.
 */
const rootResolver = {
  Query: {
    ...articleResolver.Query,
    ...authorResolver.Query,
    ...tagResolver.Query,
    ...categoryResolver.Query,

    /**
     * Full-text search across all content types.
     */
    search: (_parent, { input }) => {
      const { search: searchUtil } = require('../utils/search');
      const Article = require('../models/Article');
      const Author = require('../models/Author');
      const Tag = require('../models/Tag');

      const results = [];
      const types = input.types || ['ARTICLE', 'AUTHOR', 'TAG'];
      const limit = input.limit || 20;

      if (types.includes('ARTICLE')) {
        const articles = Article.findAll();
        const articleResults = searchUtil({
          collection: articles,
          query: input.query,
          fields: ['title', 'content', 'excerpt'],
          limit,
          type: 'articles',
        });
        results.push(...articleResults.results);
      }

      if (types.includes('AUTHOR')) {
        const authors = Author.findAll();
        const authorResults = searchUtil({
          collection: authors,
          query: input.query,
          fields: ['name', 'bio'],
          limit,
        });
        results.push(...authorResults.results);
      }

      if (types.includes('TAG')) {
        const tags = Tag.findAll();
        const tagResults = searchUtil({
          collection: tags,
          query: input.query,
          fields: ['name', 'description'],
          limit,
        });
        results.push(...tagResults.results);
      }

      // Sort by score descending
      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    /**
     * Get CMS statistics.
     */
    stats: () => {
      const Article = require('../models/Article');
      const Author = require('../models/Author');
      const Tag = require('../models/Tag');
      const Category = require('../models/Category');

      const articles = Article.findAll();
      const authors = Author.findAll();
      const tags = Tag.findAll();
      const categories = Category.findAll();

      return {
        totalArticles: articles.length,
        totalAuthors: authors.length,
        totalTags: tags.length,
        totalCategories: categories.length,
        articlesByStatus: {
          draft: articles.filter(a => a.status === 'DRAFT').length,
          review: articles.filter(a => a.status === 'REVIEW').length,
          published: articles.filter(a => a.status === 'PUBLISHED').length,
          rejected: articles.filter(a => a.status === 'REJECTED').length,
          archived: articles.filter(a => a.status === 'ARCHIVED').length,
        },
        recentArticles: articles
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        mostViewedArticles: articles
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 5),
      };
    },

    /**
     * Analyze query complexity.
     */
    complexity: (_parent, { query }) => {
      return analyzeComplexity(query);
    },
  },

  Mutation: {
    ...articleResolver.Mutation,
    ...authorResolver.Mutation,
    ...tagResolver.Mutation,
    ...categoryResolver.Mutation,
  },

  Subscription: {
    contentChanged: {
      subscribe: () => pubsub.asyncIterator(['CONTENT_CHANGED']),
    },
    articleChanged: {
      subscribe: () => pubsub.asyncIterator(['ARTICLE_CHANGED']),
    },
    authorChanged: {
      subscribe: () => pubsub.asyncIterator(['AUTHOR_CHANGED']),
    },
  },

  // Merge type-specific resolvers
  ...articleResolver,
  ...authorResolver,
  ...tagResolver,
  ...categoryResolver,
};

module.exports = { rootResolver, pubsub, analyzeComplexity };
