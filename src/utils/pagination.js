/**
 * Pagination utility for GraphQL CMS.
 * Implements cursor-based and offset-based pagination strategies.
 */

'use strict';

const config = require('../config');

/**
 * Encode a cursor from an item ID and sort value.
 * @param {string} id - Item identifier.
 * @param {string|number} sortValue - Value used for sorting.
 * @returns {string} Base64-encoded cursor.
 */
function encodeCursor(id, sortValue) {
  const payload = JSON.stringify({ id, s: sortValue });
  return Buffer.from(payload).toString('base64');
}

/**
 * Decode a cursor to get ID and sort value.
 * @param {string} cursor - Base64-encoded cursor.
 * @returns {Object|null} Decoded cursor object or null.
 */
function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const payload = Buffer.from(cursor, 'base64').toString('utf8');
    const parsed = JSON.parse(payload);
    return { id: parsed.id, sortValue: parsed.s };
  } catch (err) {
    throw new Error(`Invalid cursor format: ${cursor}`);
  }
}

/**
 * Sort a collection by specified field and direction.
 * @param {Array} collection - Array to sort.
 * @param {string} sortBy - Field name to sort by.
 * @param {string} sortOrder - 'ASC' or 'DESC'.
 * @returns {Array} Sorted array.
 */
function sortCollection(collection, sortBy, sortOrder) {
  if (!sortBy) return collection;

  const order = sortOrder === 'DESC' ? -1 : 1;

  return [...collection].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order * aVal.localeCompare(bVal);
    }

    if (aVal < bVal) return -1 * order;
    if (aVal > bVal) return 1 * order;
    return 0;
  });
}

/**
 * Apply offset-based pagination to a collection.
 * @param {Array} collection - Full array of items.
 * @param {number} offset - Number of items to skip.
 * @param {number} limit - Maximum items to return.
 * @returns {Object} Paginated result with metadata.
 */
function paginateOffset(collection, offset = 0, limit) {
  const pageSize = Math.min(
    limit || config.graphql.defaultPageSize,
    config.graphql.maxPageSize
  );
  const skip = Math.max(0, offset);
  const total = collection.length;
  const items = collection.slice(skip, skip + pageSize);
  const hasMore = skip + pageSize < total;

  return {
    items,
    pageInfo: {
      total,
      hasNextPage: hasMore,
      hasPreviousPage: skip > 0,
      startCursor: items.length > 0 ? encodeCursor(items[0].id, items[0].createdAt) : null,
      endCursor: items.length > 0 ? encodeCursor(items[items.length - 1].id, items[items.length - 1].createdAt) : null,
    },
  };
}

/**
 * Apply cursor-based pagination to a sorted collection.
 * @param {Array} collection - Pre-sorted array of items.
 * @param {string|null} after - Cursor to start after.
 * @param {number} limit - Maximum items to return.
 * @param {string} sortBy - Field used for sorting.
 * @returns {Object} Paginated result with cursors.
 */
function paginateCursor(collection, after, limit, sortBy = 'createdAt') {
  const pageSize = Math.min(
    limit || config.graphql.defaultPageSize,
    config.graphql.maxPageSize
  );

  let items = collection;
  const decoded = decodeCursor(after);

  if (decoded) {
    // Find position after cursor
    const idx = collection.findIndex(item => item.id === decoded.id);
    if (idx !== -1) {
      items = collection.slice(idx + 1);
    }
  }

  const paginated = items.slice(0, pageSize);
  const total = collection.length;

  return {
    items: paginated,
    pageInfo: {
      total,
      hasNextPage: items.length > pageSize,
      hasPreviousPage: !!after,
      startCursor: paginated.length > 0 ? encodeCursor(paginated[0].id, paginated[0][sortBy]) : null,
      endCursor: paginated.length > 0
        ? encodeCursor(paginated[paginated.length - 1].id, paginated[paginated.length - 1][sortBy])
        : null,
    },
  };
}

/**
 * Unified paginate function supporting both offset and cursor modes.
 * @param {Array} collection - Full array of items.
 * @param {Object} args - Pagination arguments.
 * @param {number} [args.offset] - Offset for offset-based pagination.
 * @param {number} [args.limit] - Page size limit.
 * @param {string} [args.after] - Cursor for cursor-based pagination.
 * @param {string} [args.sortBy] - Sort field.
 * @param {string} [args.sortOrder] - Sort direction ('ASC' or 'DESC').
 * @returns {Object} Paginated result.
 */
function paginate(collection, args = {}) {
  const { offset, limit, after, sortBy, sortOrder } = args;

  // First sort the collection
  const sorted = sortCollection(collection, sortBy, sortOrder);

  // Use cursor pagination if 'after' is provided, otherwise offset
  if (after !== undefined) {
    return paginateCursor(sorted, after, limit, sortBy);
  }

  return paginateOffset(sorted, offset, limit);
}

/**
 * Calculate pagination boundaries for complex queries.
 * @param {number} total - Total item count.
 * @param {number} page - Current page number (1-based).
 * @param {number} pageSize - Items per page.
 * @returns {Object} Boundary info with start, end, hasNext, hasPrev.
 */
function calculateBoundaries(total, page, pageSize) {
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(pageSize || config.graphql.defaultPageSize, config.graphql.maxPageSize);
  const start = (validPage - 1) * validPageSize;
  const end = Math.min(start + validPageSize, total);

  return {
    start,
    end,
    page: validPage,
    pageSize: validPageSize,
    hasNext: end < total,
    hasPrev: validPage > 1,
    totalPages: Math.ceil(total / validPageSize),
  };
}

module.exports = {
  paginate,
  paginateOffset,
  paginateCursor,
  encodeCursor,
  decodeCursor,
  sortCollection,
  calculateBoundaries,
};
