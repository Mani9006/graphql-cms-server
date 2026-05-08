/**
 * Configuration module for GraphQL CMS Server.
 * Centralizes all environment-specific settings and defaults.
 */

'use strict';

const path = require('path');

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 4000,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // GraphQL configuration
  graphql: {
    path: '/graphql',
    playground: process.env.NODE_ENV !== 'production',
    introspection: true,
    tracing: process.env.NODE_ENV === 'development',
    // Query complexity limits
    maxComplexity: 1000,
    maxDepth: 10,
    // Default pagination
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // Data persistence
  data: {
    basePath: path.join(__dirname, '..', 'data'),
    files: {
      articles: 'articles.json',
      authors: 'authors.json',
      tags: 'tags.json',
      categories: 'categories.json',
    },
  },

  // Search configuration
  search: {
    minQueryLength: 2,
    maxResults: 50,
    highlightPrefix: '<mark>',
    highlightSuffix: '</mark>',
    fields: {
      articles: ['title', 'content', 'excerpt'],
      authors: ['name', 'bio'],
    },
  },

  // Versioning configuration
  versioning: {
    maxVersions: 10,
    keepDeletedDays: 30,
  },

  // Publishing workflow
  publishing: {
    validTransitions: {
      DRAFT: ['REVIEW', 'ARCHIVED'],
      REVIEW: ['PUBLISHED', 'DRAFT', 'REJECTED'],
      PUBLISHED: ['ARCHIVED', 'DRAFT'],
      REJECTED: ['DRAFT', 'ARCHIVED'],
      ARCHIVED: ['DRAFT'],
    },
  },

  // Subscription configuration
  subscriptions: {
    path: '/graphql',
    onConnect: () => {
      console.log('[Subscriptions] Client connected');
    },
    onDisconnect: () => {
      console.log('[Subscriptions] Client disconnected');
    },
  },
};

/**
 * Validate critical configuration values.
 * @throws {Error} If required configuration is missing or invalid.
 */
function validateConfig() {
  if (config.graphql.maxDepth < 1) {
    throw new Error('GRAPHQL_MAX_DEPTH must be at least 1');
  }
  if (config.graphql.maxPageSize < 1) {
    throw new Error('MAX_PAGE_SIZE must be at least 1');
  }
}

validateConfig();

module.exports = config;
