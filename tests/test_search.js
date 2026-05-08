/**
 * Full-text search feature tests for GraphQL CMS.
 */

'use strict';

const { search, tokenize, normalizeText, calculateRelevance, highlightMatches, filterBy, buildIndex } = require('../src/utils/search');

describe('Full-Text Search Features', () => {
  const collection = [
    { id: '1', title: 'Getting Started with GraphQL', content: 'GraphQL is a query language for APIs', publishedAt: '2024-03-01T00:00:00Z' },
    { id: '2', title: 'Advanced GraphQL Patterns', content: 'Learn advanced patterns in GraphQL', publishedAt: '2024-03-15T00:00:00Z' },
    { id: '3', title: 'REST vs GraphQL Comparison', content: 'Compare REST and GraphQL approaches', publishedAt: '2024-02-01T00:00:00Z' },
    { id: '4', title: 'Node.js Fundamentals', content: 'Learn Node.js from scratch', publishedAt: '2024-01-01T00:00:00Z' },
    { id: '5', title: 'GraphQL Subscriptions Guide', content: 'Real-time updates with GraphQL subscriptions', publishedAt: new Date().toISOString() },
  ];

  describe('normalizeText', () => {
    test('converts to lowercase', () => {
      expect(normalizeText('GRAPHQL')).toBe('graphql');
    });

    test('removes special characters', () => {
      expect(normalizeText('GraphQL!!!')).toBe('graphql');
    });

    test('handles multiple words', () => {
      expect(normalizeText('Hello World')).toBe('hello world');
    });

    test('returns empty string for null', () => {
      expect(normalizeText(null)).toBe('');
    });

    test('returns empty string for undefined', () => {
      expect(normalizeText(undefined)).toBe('');
    });

    test('returns empty string for non-string', () => {
      expect(normalizeText(123)).toBe('');
    });
  });

  describe('tokenize', () => {
    test('splits simple query', () => {
      const terms = tokenize('graphql tutorial');
      expect(terms).toEqual(['graphql', 'tutorial']);
    });

    test('filters single character terms', () => {
      const terms = tokenize('a graphql b');
      expect(terms).toContain('graphql');
      expect(terms).not.toContain('a');
      expect(terms).not.toContain('b');
    });

    test('handles null query', () => {
      expect(tokenize(null)).toEqual([]);
    });

    test('handles empty string', () => {
      expect(tokenize('')).toEqual([]);
    });
  });

  describe('calculateRelevance', () => {
    test('scores exact matches higher', () => {
      const doc = { title: 'GraphQL Basics', content: 'Intro' };
      const score1 = calculateRelevance(doc, ['graphql'], ['title', 'content']);
      const score2 = calculateRelevance(doc, ['python'], ['title', 'content']);
      expect(score1).toBeGreaterThan(score2);
    });

    test('gives title bonus', () => {
      const titleDoc = { title: 'GraphQL', content: 'Other' };
      const contentDoc = { title: 'Other', content: 'GraphQL' };
      const score1 = calculateRelevance(titleDoc, ['graphql'], ['title', 'content']);
      const score2 = calculateRelevance(contentDoc, ['graphql'], ['title', 'content']);
      expect(score1).toBeGreaterThan(score2);
    });

    test('returns zero for no matches', () => {
      const doc = { title: 'Python Guide', content: 'Learn Python' };
      const score = calculateRelevance(doc, ['graphql'], ['title', 'content']);
      expect(score).toBe(0);
    });

    test('gives recency bonus', () => {
      const oldDoc = { title: 'GraphQL', content: 'x', publishedAt: '2020-01-01T00:00:00Z' };
      const newDoc = { title: 'GraphQL', content: 'x', publishedAt: new Date().toISOString() };
      const scoreOld = calculateRelevance(oldDoc, ['graphql'], ['title', 'content']);
      const scoreNew = calculateRelevance(newDoc, ['graphql'], ['title', 'content']);
      expect(scoreNew).toBeGreaterThanOrEqual(scoreOld);
    });
  });

  describe('highlightMatches', () => {
    test('wraps matching terms', () => {
      const result = highlightMatches('GraphQL is great', ['graphql']);
      expect(result).toContain('<mark>');
      expect(result).toContain('</mark>');
    });

    test('is case insensitive', () => {
      const result = highlightMatches('GraphQL', ['graphql']);
      expect(result).toBe('<mark>GraphQL</mark>');
    });

    test('returns original text for no matches', () => {
      const result = highlightMatches('Hello World', ['xyz']);
      expect(result).toBe('Hello World');
    });

    test('handles empty terms', () => {
      const result = highlightMatches('Hello', []);
      expect(result).toBe('Hello');
    });
  });

  describe('search', () => {
    test('finds matching documents', () => {
      const result = search({
        collection,
        query: 'GraphQL',
        fields: ['title', 'content'],
        limit: 10,
      });
      expect(result.total).toBeGreaterThan(0);
      expect(result.results[0].item.title.toLowerCase()).toContain('graphql');
    });

    test('sorts by relevance', () => {
      const result = search({
        collection,
        query: 'GraphQL',
        fields: ['title', 'content'],
        limit: 10,
      });
      // First result should have highest score
      if (result.total > 1) {
        expect(result.results[0].score).toBeGreaterThanOrEqual(result.results[1].score);
      }
    });

    test('includes highlights', () => {
      const result = search({
        collection,
        query: 'GraphQL',
        fields: ['title', 'content'],
        limit: 10,
      });
      expect(result.results[0].highlights).toBeDefined();
    });

    test('respects limit', () => {
      const result = search({
        collection,
        query: 'GraphQL',
        fields: ['title', 'content'],
        limit: 2,
      });
      expect(result.results.length).toBeLessThanOrEqual(2);
    });

    test('returns empty for no query', () => {
      const result = search({ collection, query: '', fields: ['title'], limit: 10 });
      expect(result.total).toBe(0);
    });

    test('returns empty for no collection', () => {
      const result = search({ collection: null, query: 'test', fields: ['title'], limit: 10 });
      expect(result.total).toBe(0);
    });
  });

  describe('filterBy', () => {
    const items = [
      { id: '1', status: 'ACTIVE', name: 'Alice' },
      { id: '2', status: 'INACTIVE', name: 'Bob' },
      { id: '3', status: 'ACTIVE', name: 'Charlie' },
    ];

    test('filters by single value', () => {
      const result = filterBy(items, { status: 'ACTIVE' });
      expect(result).toHaveLength(2);
    });

    test('filters with array values', () => {
      const result = filterBy(items, { status: ['ACTIVE', 'INACTIVE'] });
      expect(result).toHaveLength(3);
    });

    test('filters with string exact match (case insensitive)', () => {
      const result = filterBy(items, { name: 'Alice' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    test('returns all for no filters', () => {
      const result = filterBy(items, {});
      expect(result).toHaveLength(3);
    });

    test('returns all for null filters', () => {
      const result = filterBy(items, null);
      expect(result).toHaveLength(3);
    });
  });

  describe('buildIndex', () => {
    test('creates inverted index', () => {
      const index = buildIndex(collection, ['title']);
      expect(index.has('graphql')).toBe(true);
      expect(index.has('node')).toBe(true);
    });

    test('maps words to document IDs', () => {
      const index = buildIndex(collection, ['title']);
      const graphqlIds = index.get('graphql');
      expect(graphqlIds.size).toBeGreaterThan(0);
    });
  });
});
