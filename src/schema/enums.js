/**
 * GraphQL enum type definitions for CMS.
 */

'use strict';

const enums = `
  """Article publishing status workflow"""
  enum ArticleStatus {
    DRAFT
    REVIEW
    PUBLISHED
    REJECTED
    ARCHIVED
  }

  """Author role permissions"""
  enum AuthorRole {
    ADMIN
    EDITOR
    AUTHOR
    CONTRIBUTOR
  }

  """Sort direction for pagination"""
  enum SortDirection {
    ASC
    DESC
  }

  """Article sort fields"""
  enum ArticleSortField {
    title
    createdAt
    updatedAt
    publishedAt
    viewCount
    status
  }

  """Author sort fields"""
  enum AuthorSortField {
    name
    createdAt
    updatedAt
    role
    articleCount
  }

  """Tag sort fields"""
  enum TagSortField {
    name
    createdAt
    articleCount
  }

  """Category sort fields"""
  enum CategorySortField {
    name
    sortOrder
    createdAt
    articleCount
  }

  """Version action types"""
  enum VersionAction {
    CREATE
    UPDATE
    DELETE
  }

  """Subscription event types"""
  enum SubscriptionEventType {
    ARTICLE_CREATED
    ARTICLE_UPDATED
    ARTICLE_DELETED
    ARTICLE_PUBLISHED
    AUTHOR_CREATED
    AUTHOR_UPDATED
    TAG_CREATED
    CATEGORY_CREATED
  }

  """Search result types"""
  enum SearchResultType {
    ARTICLE
    AUTHOR
    TAG
    CATEGORY
  }
`;

module.exports = enums;
