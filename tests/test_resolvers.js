/**
 * Resolver unit tests for GraphQL CMS.
 */

'use strict';

const { analyzeComplexity } = require('../src/resolvers');
const { paginate, encodeCursor, decodeCursor } = require('../src/utils/pagination');
const { search, tokenize, normalizeText } = require('../src/utils/search');
const { createSnapshot, calculateDiff, versionManager } = require('../src/utils/versionControl');

// Mock models
jest.mock('../src/models/Author', () => ({
  findById: jest.fn(),
  findAll: jest.fn(() => []),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('../src/models/Article', () => ({
  findById: jest.fn(),
  findAll: jest.fn(() => []),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  incrementViews: jest.fn(),
}));

jest.mock('../src/models/Category', () => ({
  findById: jest.fn(),
  findAll: jest.fn(() => []),
  getTree: jest.fn(() => []),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

jest.mock('../src/models/Tag', () => ({
  findById: jest.fn(),
  findByIds: jest.fn(),
  findAll: jest.fn(() => []),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

describe('Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    versionManager.clear();
  });

  describe('analyzeComplexity', () => {
    test('returns default report for empty query', () => {
      const result = analyzeComplexity('');
      expect(result.score).toBe(0);
      expect(result.isAllowed).toBe(true);
      expect(result.details).toEqual([]);
    });

    test('returns default report for null query', () => {
      const result = analyzeComplexity(null);
      expect(result.score).toBe(0);
      expect(result.isAllowed).toBe(true);
    });

    test('calculates complexity for simple query', () => {
      const query = '{ articles { items { title } } }';
      const result = analyzeComplexity(query);
      expect(result.score).toBeGreaterThan(0);
      expect(result.depth).toBeGreaterThan(0);
      expect(result.isAllowed).toBe(true);
    });

    test('detects query depth', () => {
      const query = `
        {
          articles {
            items {
              author {
                articles {
                  items {
                    tags {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
      const result = analyzeComplexity(query);
      expect(result.depth).toBeGreaterThan(5);
    });

    test('adds weight for search field', () => {
      const query = '{ search(input: { query: "test" }) { score } }';
      const result = analyzeComplexity(query);
      expect(result.score).toBeGreaterThanOrEqual(20);
    });

    test('adds weight for connection types', () => {
      const query = '{ articles { items { title content author { name } } } }';
      const result = analyzeComplexity(query);
      expect(result.score).toBeGreaterThanOrEqual(10);
    });

    test('returns detailed breakdown', () => {
      const query = '{ articles { items { title } } authors { items { name } } }';
      const result = analyzeComplexity(query);
      expect(result.details.length).toBeGreaterThan(0);
      expect(result.details[0]).toHaveProperty('field');
      expect(result.details[0]).toHaveProperty('score');
      expect(result.details[0]).toHaveProperty('depth');
    });
  });
});

describe('Pagination Utility', () => {
  const sampleItems = Array.from({ length: 50 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    createdAt: new Date(2024, 0, 50 - i).toISOString(),
  }));

  describe('paginate', () => {
    test('returns paginated result with items', () => {
      const result = paginate(sampleItems, { limit: 10 });
      expect(result.items).toHaveLength(10);
      expect(result.pageInfo).toBeDefined();
      expect(result.pageInfo.total).toBe(50);
    });

    test('returns default page size', () => {
      const result = paginate(sampleItems);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(20);
    });

    test('respects offset parameter', () => {
      const result = paginate(sampleItems, { offset: 10, limit: 10 });
      expect(result.items[0].id).toBe('item-11');
    });

    test('pageInfo has correct flags', () => {
      const result = paginate(sampleItems, { limit: 10 });
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    test('cursor-based pagination works', () => {
      const result = paginate(sampleItems, { limit: 10 });
      expect(result.pageInfo.startCursor).toBeDefined();
      expect(result.pageInfo.endCursor).toBeDefined();
    });

    test('sorting works ascending', () => {
      const result = paginate(sampleItems, { sortBy: 'title', sortOrder: 'ASC', limit: 5 });
      expect(result.items[0].title).toBe('Item 1');
    });

    test('sorting works descending', () => {
      const result = paginate(sampleItems, { sortBy: 'title', sortOrder: 'DESC', limit: 5 });
      expect(result.items[0].title).toBe('Item 9');
    });
  });

  describe('encodeCursor / decodeCursor', () => {
    test('encode and decode roundtrip', () => {
      const cursor = encodeCursor('item-1', '2024-01-01');
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe('item-1');
      expect(decoded.sortValue).toBe('2024-01-01');
    });

    test('decode null returns null', () => {
      expect(decodeCursor(null)).toBeNull();
    });

    test('decode invalid cursor throws', () => {
      expect(() => decodeCursor('invalid-cursor')).toThrow();
    });
  });
});

describe('Search Utility', () => {
  const articles = [
    { id: '1', title: 'GraphQL Basics', content: 'Introduction to GraphQL', excerpt: 'Learn GraphQL' },
    { id: '2', title: 'Advanced GraphQL', content: 'Deep dive into GraphQL', excerpt: 'Master GraphQL' },
    { id: '3', title: 'REST API Design', content: 'Building REST APIs', excerpt: 'REST fundamentals' },
    { id: '4', title: 'Node.js Tutorial', content: 'Server-side JavaScript', excerpt: 'Learn Node.js' },
  ];

  describe('normalizeText', () => {
    test('lowercases and removes special chars', () => {
      expect(normalizeText('Hello, World!')).toBe('hello world');
    });

    test('handles null input', () => {
      expect(normalizeText(null)).toBe('');
    });
  });

  describe('tokenize', () => {
    test('splits query into terms', () => {
      const terms = tokenize('GraphQL tutorial');
      expect(terms).toContain('graphql');
      expect(terms).toContain('tutorial');
    });

    test('filters short terms', () => {
      const terms = tokenize('a b graphql');
      expect(terms).not.toContain('a');
      expect(terms).not.toContain('b');
      expect(terms).toContain('graphql');
    });
  });

  describe('search', () => {
    test('finds matching articles', () => {
      const result = search({
        collection: articles,
        query: 'graphql',
        fields: ['title', 'content'],
        limit: 10,
      });
      expect(result.total).toBeGreaterThan(0);
      expect(result.results[0].item.title.toLowerCase()).toContain('graphql');
    });

    test('returns empty for no matches', () => {
      const result = search({
        collection: articles,
        query: 'nonexistent-term-xyz',
        fields: ['title', 'content'],
        limit: 10,
      });
      expect(result.total).toBe(0);
    });

    test('includes highlights in results', () => {
      const result = search({
        collection: articles,
        query: 'GraphQL',
        fields: ['title', 'content'],
        limit: 10,
      });
      expect(result.results[0].highlights).toBeDefined();
    });

    test('returns empty for empty query', () => {
      const result = search({
        collection: articles,
        query: '',
        fields: ['title'],
        limit: 10,
      });
      expect(result.total).toBe(0);
    });

    test('returns empty for null collection', () => {
      const result = search({
        collection: null,
        query: 'test',
        fields: ['title'],
        limit: 10,
      });
      expect(result.total).toBe(0);
    });
  });
});

describe('Version Control', () => {
  beforeEach(() => {
    versionManager.clear();
  });

  const sampleContent = {
    id: 'article-1',
    title: 'Original Title',
    content: 'Original content',
    version: 1,
  };

  describe('createSnapshot', () => {
    test('creates snapshot with metadata', () => {
      const snapshot = createSnapshot(sampleContent, 'UPDATE', 'author-1');
      expect(snapshot.versionId).toBeDefined();
      expect(snapshot.contentId).toBe('article-1');
      expect(snapshot.version).toBe(2);
      expect(snapshot.action).toBe('UPDATE');
      expect(snapshot.editorId).toBe('author-1');
    });

    test('throws for invalid content', () => {
      expect(() => createSnapshot(null, 'UPDATE')).toThrow();
    });
  });

  describe('calculateDiff', () => {
    test('detects added fields', () => {
      const oldObj = { a: 1 };
      const newObj = { a: 1, b: 2 };
      const diff = calculateDiff(oldObj, newObj);
      expect(diff.added).toEqual({ b: 2 });
    });

    test('detects removed fields', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1 };
      const diff = calculateDiff(oldObj, newObj);
      expect(diff.removed).toEqual({ b: 2 });
    });

    test('detects modified fields', () => {
      const oldObj = { a: 1 };
      const newObj = { a: 2 };
      const diff = calculateDiff(oldObj, newObj);
      expect(diff.modified.a).toEqual({ from: 1, to: 2 });
    });
  });

  describe('versionManager', () => {
    test('stores and retrieves version history', () => {
      versionManager.store(sampleContent, 'CREATE', 'author-1');
      const history = versionManager.getHistory('article-1');
      expect(history.length).toBe(1);
      expect(history[0].action).toBe('CREATE');
    });

    test('increments version number', () => {
      versionManager.store(sampleContent, 'CREATE', 'author-1');
      const history = versionManager.getHistory('article-1');
      expect(history[0].version).toBe(2);
    });

    test('retrieves specific version', () => {
      versionManager.store(sampleContent, 'CREATE', 'author-1');
      const history = versionManager.getHistory('article-1');
      const version = versionManager.getVersion('article-1', history[0].versionId);
      expect(version).toBeDefined();
    });

    test('restores version', () => {
      versionManager.store(sampleContent, 'CREATE', 'author-1');
      const restored = versionManager.restoreVersion('article-1', 2);
      expect(restored.title).toBe('Original Title');
      expect(restored.restoredFrom).toBe(2);
    });

    test('returns null for non-existent version', () => {
      const version = versionManager.getVersion('nonexistent', 'fake-id');
      expect(version).toBeNull();
    });

    test('returns null for non-existent restore', () => {
      const restored = versionManager.restoreVersion('nonexistent', 1);
      expect(restored).toBeNull();
    });

    test('compares versions', () => {
      versionManager.store(sampleContent, 'CREATE', 'author-1');
      const updated = { ...sampleContent, title: 'Updated Title', version: 2 };
      versionManager.store(updated, 'UPDATE', 'author-1');
      const comparison = versionManager.compareVersions('article-1', 2, 3);
      expect(comparison).toBeDefined();
      expect(comparison).not.toBeNull();
      expect(comparison.from).toBe(2);
      expect(comparison.to).toBe(3);
    });
  });
});
