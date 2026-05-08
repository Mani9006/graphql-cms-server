/**
 * GraphQL schema definition combining all type definitions.
 */

'use strict';

const { gql } = require('apollo-server');
const types = require('./types');
const inputs = require('./inputs');
const enums = require('./enums');

const rootTypes = gql`
  ${enums}
  ${types}
  ${inputs}

  """Root Query type"""
  type Query {
    """Get all articles with optional filtering and pagination"""
    articles(
      filter: ArticleFilterInput
      page: PaginationInput
    ): ArticleConnection!

    """Get a single article by ID"""
    article(id: ID!): Article

    """Get all authors with optional filtering"""
    authors(
      filter: AuthorFilterInput
      page: PaginationInput
    ): AuthorConnection!

    """Get a single author by ID"""
    author(id: ID!): Author

    """Get all tags"""
    tags(page: PaginationInput): TagConnection!

    """Get a single tag by ID"""
    tag(id: ID!): Tag

    """Get all categories"""
    categories(page: PaginationInput): CategoryConnection!

    """Get category tree with nested children"""
    categoryTree: [Category!]!

    """Get a single category by ID"""
    category(id: ID!): Category

    """Full-text search across content"""
    search(input: SearchInput!): [SearchResult!]!

    """Get version history for an article"""
    articleVersions(id: ID!): [VersionSnapshot!]!

    """Compare two article versions"""
    compareVersions(id: ID!, fromVersion: Int!, toVersion: Int!): VersionComparison

    """Get CMS statistics"""
    stats: Stats!

    """Get query complexity analysis"""
    complexity(query: String!): ComplexityReport!
  }

  """Root Mutation type"""
  type Mutation {
    """Create a new article"""
    createArticle(input: CreateArticleInput!): Article!

    """Update an existing article"""
    updateArticle(id: ID!, input: UpdateArticleInput!): Article!

    """Delete an article"""
    deleteArticle(id: ID!): Boolean!

    """Change article status (publishing workflow)"""
    changeArticleStatus(id: ID!, status: ArticleStatus!): Article!

    """Create a new author"""
    createAuthor(input: CreateAuthorInput!): Author!

    """Update an existing author"""
    updateAuthor(id: ID!, input: UpdateAuthorInput!): Author!

    """Delete an author"""
    deleteAuthor(id: ID!): Boolean!

    """Create a new tag"""
    createTag(input: CreateTagInput!): Tag!

    """Update an existing tag"""
    updateTag(id: ID!, input: UpdateTagInput!): Tag!

    """Delete a tag"""
    deleteTag(id: ID!): Boolean!

    """Create a new category"""
    createCategory(input: CreateCategoryInput!): Category!

    """Update an existing category"""
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!

    """Delete a category"""
    deleteCategory(id: ID!): Boolean!

    """Restore an article to a specific version"""
    restoreArticleVersion(id: ID!, version: Int!): Article!
  }

  """Root Subscription type"""
  type Subscription {
    """Subscribe to all content changes"""
    contentChanged: SubscriptionEvent!

    """Subscribe to article changes"""
    articleChanged: SubscriptionEvent!

    """Subscribe to author changes"""
    authorChanged: SubscriptionEvent!
  }
`;

module.exports = rootTypes;
