/**
 * Full-text search utility for GraphQL CMS.
 * Provides multi-field search, highlighting, and relevance scoring.
 */

'use strict';

const config = require('../config');

/**
 * Normalize text for search by removing special characters and lowercasing.
 * @param {string} text - Raw text input.
 * @returns {string} Normalized text.
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenize a search query into individual terms.
 * @param {string} query - Search query string.
 * @returns {string[]} Array of search terms.
 */
function tokenize(query) {
  if (!query || typeof query !== 'string') return [];
  const normalized = normalizeText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(term => term.length >= config.search.minQueryLength);
}

/**
 * Calculate relevance score for a document against search terms.
 * @param {Object} document - Document to score.
 * @param {string[]} terms - Search terms.
 * @param {string[]} fields - Fields to search within.
 * @returns {number} Relevance score (higher = more relevant).
 */
function calculateRelevance(document, terms, fields) {
  if (!terms.length || !fields.length) return 0;

  let score = 0;
  const termSet = new Set(terms);

  for (const field of fields) {
    const fieldValue = document[field];
    if (!fieldValue || typeof fieldValue !== 'string') continue;

    const normalizedField = normalizeText(fieldValue);
    if (!normalizedField) continue;

    const fieldWords = normalizedField.split(' ');

    for (const term of termSet) {
      // Exact phrase match in field (highest score)
      if (normalizedField.includes(term)) {
        score += 10;

        // Title field bonus
        if (field === 'title' || field === 'name') {
          score += 5;
        }

        // Word boundary match bonus
        const wordRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (wordRegex.test(fieldValue)) {
          score += 3;
        }
      }

      // Partial word match
      for (const word of fieldWords) {
        if (word.includes(term) || term.includes(word)) {
          score += 2;
        }
      }
    }
  }

  // Recency bonus for articles (if publishedAt exists)
  if (document.publishedAt) {
    const ageMs = Date.now() - new Date(document.publishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 7) score += 3;
    else if (ageDays < 30) score += 1;
  }

  return score;
}

/**
 * Highlight matching terms in text.
 * @param {string} text - Original text.
 * @param {string[]} terms - Terms to highlight.
 * @returns {string} Text with highlighted terms.
 */
function highlightMatches(text, terms) {
  if (!text || !terms.length) return text;

  const { highlightPrefix, highlightSuffix } = config.search;
  let highlighted = text;

  // Sort terms by length descending to avoid nested highlighting
  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    if (term.length < config.search.minQueryLength) continue;
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, `${highlightPrefix}$1${highlightSuffix}`);
  }

  return highlighted;
}

/**
 * Perform full-text search across a collection.
 * @param {Object} options - Search options.
 * @param {Array} options.collection - Array of documents to search.
 * @param {string} options.query - Search query.
 * @param {string[]} options.fields - Fields to search.
 * @param {number} options.limit - Maximum results.
 * @param {string} [options.type] - Document type for type-specific fields.
 * @returns {Object} Search results with scores and highlights.
 */
function search({ collection, query, fields, limit, type }) {
  if (!query || !collection || !Array.isArray(collection)) {
    return { results: [], total: 0, query: query || '' };
  }

  const terms = tokenize(query);
  if (!terms.length) {
    return { results: [], total: 0, query };
  }

  const searchFields = fields || config.search.fields[type] || ['title', 'content'];
  const maxResults = Math.min(limit || config.search.maxResults, config.search.maxResults);

  const scored = collection.map(doc => {
    const score = calculateRelevance(doc, terms, searchFields);
    return { document: doc, score };
  });

  // Filter out zero-score results, sort by score descending
  const filtered = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Add highlights
  const results = filtered.map(item => {
    const doc = item.document;
    const highlights = {};

    for (const field of searchFields) {
      if (doc[field] && typeof doc[field] === 'string') {
        highlights[field] = highlightMatches(doc[field], terms);
      }
    }

    return {
      item: doc,
      score: item.score,
      highlights,
    };
  });

  return {
    results,
    total: results.length,
    query,
  };
}

/**
 * Filter collection by multiple criteria.
 * @param {Array} collection - Array of documents.
 * @param {Object} filters - Key-value filter pairs.
 * @returns {Array} Filtered collection.
 */
function filterBy(collection, filters) {
  if (!filters || typeof filters !== 'object') return collection;

  return collection.filter(doc => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;

      const docValue = doc[key];

      if (Array.isArray(value)) {
        // Array filter: check if doc value is in array
        if (!value.includes(docValue)) return false;
      } else if (typeof value === 'string' && typeof docValue === 'string') {
        // String exact match (case-insensitive)
        if (docValue.toLowerCase() !== value.toLowerCase()) return false;
      } else if (docValue !== value) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Build a search index for faster repeated queries.
 * @param {Array} collection - Documents to index.
 * @param {string[]} fields - Fields to index.
 * @returns {Map} Search index map.
 */
function buildIndex(collection, fields) {
  const index = new Map();

  for (const doc of collection) {
    for (const field of fields) {
      const value = doc[field];
      if (!value || typeof value !== 'string') continue;

      const words = normalizeText(value).split(' ');
      for (const word of words) {
        if (word.length < 2) continue;
        if (!index.has(word)) {
          index.set(word, new Set());
        }
        index.get(word).add(doc.id);
      }
    }
  }

  return index;
}

module.exports = {
  search,
  tokenize,
  normalizeText,
  calculateRelevance,
  highlightMatches,
  filterBy,
  buildIndex,
};
