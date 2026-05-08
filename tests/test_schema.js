/**
 * Schema validation tests for GraphQL CMS.
 */

'use strict';

const { gql } = require('apollo-server');
const typeDefs = require('../src/schema');

// Helper to check if a type definition contains a specific string
function hasDefinition(defs, str) {
  return defs.includes(str);
}

describe('GraphQL Schema', () => {
  let defs;

  beforeAll(() => {
    // typeDefs from our schema is a gql-tagged string
    defs = typeDefs.loc.source.body;
  });

  describe('Basic Types', () => {
    test('should define Query type', () => {
      expect(hasDefinition(defs, 'type Query')).toBe(true);
    });

    test('should define Mutation type', () => {
      expect(hasDefinition(defs, 'type Mutation')).toBe(true);
    });

    test('should define Subscription type', () => {
      expect(hasDefinition(defs, 'type Subscription')).toBe(true);
    });

    test('should define Article type', () => {
      expect(hasDefinition(defs, 'type Article')).toBe(true);
    });

    test('should define Author type', () => {
      expect(hasDefinition(defs, 'type Author')).toBe(true);
    });

    test('should define Tag type', () => {
      expect(hasDefinition(defs, 'type Tag')).toBe(true);
    });

    test('should define Category type', () => {
      expect(hasDefinition(defs, 'type Category')).toBe(true);
    });
  });

  describe('Enum Types', () => {
    test('should define ArticleStatus enum', () => {
      expect(hasDefinition(defs, 'enum ArticleStatus')).toBe(true);
      expect(hasDefinition(defs, 'DRAFT')).toBe(true);
      expect(hasDefinition(defs, 'PUBLISHED')).toBe(true);
      expect(hasDefinition(defs, 'REVIEW')).toBe(true);
      expect(hasDefinition(defs, 'ARCHIVED')).toBe(true);
    });

    test('should define AuthorRole enum', () => {
      expect(hasDefinition(defs, 'enum AuthorRole')).toBe(true);
      expect(hasDefinition(defs, 'ADMIN')).toBe(true);
      expect(hasDefinition(defs, 'EDITOR')).toBe(true);
      expect(hasDefinition(defs, 'AUTHOR')).toBe(true);
      expect(hasDefinition(defs, 'CONTRIBUTOR')).toBe(true);
    });

    test('should define SortDirection enum', () => {
      expect(hasDefinition(defs, 'enum SortDirection')).toBe(true);
      expect(hasDefinition(defs, 'ASC')).toBe(true);
      expect(hasDefinition(defs, 'DESC')).toBe(true);
    });

    test('should define VersionAction enum', () => {
      expect(hasDefinition(defs, 'enum VersionAction')).toBe(true);
      expect(hasDefinition(defs, 'CREATE')).toBe(true);
      expect(hasDefinition(defs, 'UPDATE')).toBe(true);
      expect(hasDefinition(defs, 'DELETE')).toBe(true);
    });

    test('should define SubscriptionEventType enum', () => {
      expect(hasDefinition(defs, 'enum SubscriptionEventType')).toBe(true);
      expect(hasDefinition(defs, 'ARTICLE_CREATED')).toBe(true);
      expect(hasDefinition(defs, 'ARTICLE_UPDATED')).toBe(true);
      expect(hasDefinition(defs, 'ARTICLE_DELETED')).toBe(true);
    });
  });

  describe('Query Fields', () => {
    test('should have articles query', () => {
      expect(hasDefinition(defs, 'articles(')).toBe(true);
      expect(hasDefinition(defs, 'ArticleFilterInput')).toBe(true);
    });

    test('should have article query by ID', () => {
      expect(hasDefinition(defs, 'article(id: ID!)')).toBe(true);
    });

    test('should have authors query', () => {
      expect(hasDefinition(defs, 'authors(')).toBe(true);
    });

    test('should have tags query', () => {
      expect(hasDefinition(defs, 'tags(')).toBe(true);
    });

    test('should have categories query', () => {
      expect(hasDefinition(defs, 'categories(')).toBe(true);
    });

    test('should have search query', () => {
      expect(hasDefinition(defs, 'search(')).toBe(true);
      expect(hasDefinition(defs, 'SearchInput')).toBe(true);
    });

    test('should have stats query', () => {
      expect(hasDefinition(defs, 'stats: Stats')).toBe(true);
    });
  });

  describe('Mutation Fields', () => {
    test('should have createArticle mutation', () => {
      expect(hasDefinition(defs, 'createArticle(')).toBe(true);
      expect(hasDefinition(defs, 'CreateArticleInput')).toBe(true);
    });

    test('should have updateArticle mutation', () => {
      expect(hasDefinition(defs, 'updateArticle(')).toBe(true);
    });

    test('should have deleteArticle mutation', () => {
      expect(hasDefinition(defs, 'deleteArticle(')).toBe(true);
    });

    test('should have changeArticleStatus mutation', () => {
      expect(hasDefinition(defs, 'changeArticleStatus(')).toBe(true);
    });

    test('should have createAuthor mutation', () => {
      expect(hasDefinition(defs, 'createAuthor(')).toBe(true);
    });

    test('should have createTag mutation', () => {
      expect(hasDefinition(defs, 'createTag(')).toBe(true);
    });

    test('should have createCategory mutation', () => {
      expect(hasDefinition(defs, 'createCategory(')).toBe(true);
    });

    test('should have restoreArticleVersion mutation', () => {
      expect(hasDefinition(defs, 'restoreArticleVersion(')).toBe(true);
    });
  });

  describe('Subscription Fields', () => {
    test('should have contentChanged subscription', () => {
      expect(hasDefinition(defs, 'contentChanged:')).toBe(true);
      expect(hasDefinition(defs, 'SubscriptionEvent')).toBe(true);
    });

    test('should have articleChanged subscription', () => {
      expect(hasDefinition(defs, 'articleChanged:')).toBe(true);
    });

    test('should have authorChanged subscription', () => {
      expect(hasDefinition(defs, 'authorChanged:')).toBe(true);
    });
  });

  describe('Connection Types', () => {
    test('should define ArticleConnection', () => {
      expect(hasDefinition(defs, 'type ArticleConnection')).toBe(true);
    });

    test('should define PageInfo', () => {
      expect(hasDefinition(defs, 'type PageInfo')).toBe(true);
      expect(hasDefinition(defs, 'hasNextPage')).toBe(true);
      expect(hasDefinition(defs, 'hasPreviousPage')).toBe(true);
    });
  });

  describe('Version Types', () => {
    test('should define VersionSnapshot', () => {
      expect(hasDefinition(defs, 'type VersionSnapshot')).toBe(true);
    });

    test('should define VersionComparison', () => {
      expect(hasDefinition(defs, 'type VersionComparison')).toBe(true);
    });

    test('should define DiffResult', () => {
      expect(hasDefinition(defs, 'type DiffResult')).toBe(true);
    });
  });

  describe('Pagination Input', () => {
    test('should define PaginationInput', () => {
      expect(hasDefinition(defs, 'input PaginationInput')).toBe(true);
      expect(hasDefinition(defs, 'offset')).toBe(true);
      expect(hasDefinition(defs, 'limit')).toBe(true);
      expect(hasDefinition(defs, 'after')).toBe(true);
    });
  });
});
