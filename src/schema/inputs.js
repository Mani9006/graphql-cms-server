/**
 * GraphQL input type definitions for mutations and queries.
 */

'use strict';

const inputs = `
  """Input for creating an article"""
  input CreateArticleInput {
    title: String!
    content: String!
    excerpt: String
    authorId: ID!
    categoryId: ID
    tagIds: [ID!]
    status: ArticleStatus
  }

  """Input for updating an article"""
  input UpdateArticleInput {
    title: String
    content: String
    excerpt: String
    authorId: ID
    categoryId: ID
    tagIds: [ID!]
    status: ArticleStatus
  }

  """Input for creating an author"""
  input CreateAuthorInput {
    name: String!
    email: String
    bio: String
    avatar: String
    role: AuthorRole
    socialLinks: SocialLinksInput
  }

  """Input for updating an author"""
  input UpdateAuthorInput {
    name: String
    email: String
    bio: String
    avatar: String
    role: AuthorRole
    socialLinks: SocialLinksInput
    isActive: Boolean
  }

  """Social links input"""
  input SocialLinksInput {
    twitter: String
    github: String
    linkedin: String
    website: String
  }

  """Input for creating a tag"""
  input CreateTagInput {
    name: String!
    color: String
    description: String
  }

  """Input for updating a tag"""
  input UpdateTagInput {
    name: String
    color: String
    description: String
  }

  """Input for creating a category"""
  input CreateCategoryInput {
    name: String!
    description: String
    parentId: ID
    color: String
    icon: String
    sortOrder: Int
  }

  """Input for updating a category"""
  input UpdateCategoryInput {
    name: String
    description: String
    parentId: ID
    color: String
    icon: String
    sortOrder: Int
    isActive: Boolean
  }

  """Pagination input"""
  input PaginationInput {
    offset: Int
    limit: Int
    after: String
    sortBy: String
    sortOrder: SortDirection
  }

  """Article filter input"""
  input ArticleFilterInput {
    status: ArticleStatus
    authorId: ID
    categoryId: ID
    tagIds: [ID!]
    searchQuery: String
  }

  """Author filter input"""
  input AuthorFilterInput {
    role: AuthorRole
    isActive: Boolean
    searchQuery: String
  }

  """Search input"""
  input SearchInput {
    query: String!
    types: [SearchResultType!]
    limit: Int
  }
`;

module.exports = inputs;
