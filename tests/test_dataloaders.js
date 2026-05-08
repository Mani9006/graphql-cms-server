/**
 * DataLoader unit tests for GraphQL CMS.
 */

'use strict';

const { batchAuthors } = require('../src/dataloaders/authorLoader');
const { batchTags, batchArticleTags } = require('../src/dataloaders/tagLoader');
const { createLoaders } = require('../src/dataloaders');

// Mock models
jest.mock('../src/models/Author', () => ({
  findAll: jest.fn(),
}));

jest.mock('../src/models/Tag', () => ({
  findAll: jest.fn(),
}));

const Author = require('../src/models/Author');
const Tag = require('../src/models/Tag');

describe('DataLoaders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('batchAuthors', () => {
    test('returns authors in same order as IDs', async () => {
      const mockAuthors = [
        { id: 'author-1', name: 'Alice' },
        { id: 'author-2', name: 'Bob' },
        { id: 'author-3', name: 'Charlie' },
      ];
      Author.findAll.mockReturnValue(mockAuthors);

      const result = await batchAuthors(['author-3', 'author-1', 'author-2']);
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });

    test('returns null for non-existent IDs', async () => {
      const mockAuthors = [
        { id: 'author-1', name: 'Alice' },
      ];
      Author.findAll.mockReturnValue(mockAuthors);

      const result = await batchAuthors(['author-1', 'nonexistent']);
      expect(result[0].name).toBe('Alice');
      expect(result[1]).toBeNull();
    });

    test('handles empty input', async () => {
      Author.findAll.mockReturnValue([]);
      const result = await batchAuthors([]);
      expect(result).toEqual([]);
    });

    test('handles errors gracefully', async () => {
      Author.findAll.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await batchAuthors(['author-1']);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0].code).toBe('BATCH_LOAD_ERROR');
    });
  });

  describe('batchTags', () => {
    test('returns tags in same order as IDs', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'GraphQL' },
        { id: 'tag-2', name: 'Node.js' },
        { id: 'tag-3', name: 'React' },
      ];
      Tag.findAll.mockReturnValue(mockTags);

      const result = await batchTags(['tag-2', 'tag-3', 'tag-1']);
      expect(result[0].name).toBe('Node.js');
      expect(result[1].name).toBe('React');
      expect(result[2].name).toBe('GraphQL');
    });

    test('returns null for non-existent tag IDs', async () => {
      Tag.findAll.mockReturnValue([{ id: 'tag-1', name: 'GraphQL' }]);
      const result = await batchTags(['tag-1', 'nonexistent']);
      expect(result[0].name).toBe('GraphQL');
      expect(result[1]).toBeNull();
    });
  });

  describe('batchArticleTags', () => {
    test('returns tags grouped by article', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'GraphQL' },
        { id: 'tag-2', name: 'Node.js' },
        { id: 'tag-3', name: 'React' },
      ];
      Tag.findAll.mockReturnValue(mockTags);

      const result = await batchArticleTags([
        ['tag-1', 'tag-2'],
        ['tag-3'],
        ['tag-1', 'tag-3'],
      ]);

      expect(result[0]).toHaveLength(2);
      expect(result[0][0].name).toBe('GraphQL');
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].name).toBe('React');
      expect(result[2]).toHaveLength(2);
    });

    test('filters out missing tags', async () => {
      Tag.findAll.mockReturnValue([{ id: 'tag-1', name: 'GraphQL' }]);
      const result = await batchArticleTags([['tag-1', 'nonexistent']]);
      expect(result[0]).toHaveLength(1);
    });

    test('handles empty arrays', async () => {
      Tag.findAll.mockReturnValue([]);
      const result = await batchArticleTags([[], []]);
      expect(result).toEqual([[], []]);
    });
  });

  describe('createLoaders', () => {
    test('creates all three loaders', () => {
      const loaders = createLoaders();
      expect(loaders.author).toBeDefined();
      expect(loaders.tag).toBeDefined();
      expect(loaders.articleTags).toBeDefined();
    });

    test('creates fresh instances', () => {
      const loaders1 = createLoaders();
      const loaders2 = createLoaders();
      expect(loaders1.author).not.toBe(loaders2.author);
    });
  });
});
