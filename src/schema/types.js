/**
 * GraphQL type definitions for CMS entities.
 */

'use strict';

const types = `
  """An author who writes content"""
  type Author {
    id: ID!
    name: String!
    email: String
    bio: String
    avatar: String
    role: AuthorRole!
    socialLinks: SocialLinks
    isActive: Boolean!
    articleCount: Int!
    articles(page: PaginationInput): ArticleConnection
    createdAt: String!
    updatedAt: String!
  }

  """Social media links for an author"""
  type SocialLinks {
    twitter: String
    github: String
    linkedin: String
    website: String
  }

  """A content tag for organizing articles"""
  type Tag {
    id: ID!
    name: String!
    slug: String!
    color: String!
    description: String
    articleCount: Int!
    articles(page: PaginationInput): ArticleConnection
    createdAt: String!
    updatedAt: String!
  }

  """A category for grouping articles"""
  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    parent: Category
    children: [Category!]
    color: String
    icon: String
    sortOrder: Int!
    articleCount: Int!
    articles(page: PaginationInput): ArticleConnection
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  """A content article"""
  type Article {
    id: ID!
    title: String!
    content: String!
    excerpt: String!
    author: Author!
    category: Category
    tags: [Tag!]!
    status: ArticleStatus!
    version: Int!
    viewCount: Int!
    versions: [VersionInfo!]!
    createdAt: String!
    updatedAt: String!
    publishedAt: String
  }

  """Version information for content"""
  type VersionInfo {
    versionId: ID!
    version: Int!
    action: VersionAction!
    editorId: ID
    createdAt: String!
  }

  """Detailed version snapshot"""
  type VersionSnapshot {
    versionId: ID!
    contentId: ID!
    version: Int!
    action: VersionAction!
    editorId: ID
    snapshot: String!
    createdAt: String!
  }

  """Version comparison result"""
  type VersionComparison {
    from: Int!
    to: Int!
    diff: DiffResult!
  }

  """Diff result between versions"""
  type DiffResult {
    added: String
    removed: String
    modified: [FieldChange!]!
  }

  """A single field change"""
  type FieldChange {
    field: String!
    from: String
    to: String
  }

  """Search result item"""
  type SearchResult {
    item: SearchResultItem!
    score: Float!
    highlights: HighlightMap!
  }

  """Union of searchable types"""
  union SearchResultItem = Article | Author | Tag

  """Highlight map for search results"""
  type HighlightMap {
    title: String
    content: String
    name: String
    bio: String
  }

  """Page info for pagination"""
  type PageInfo {
    total: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  """Article connection with pagination"""
  type ArticleConnection {
    items: [Article!]!
    pageInfo: PageInfo!
  }

  """Author connection with pagination"""
  type AuthorConnection {
    items: [Author!]!
    pageInfo: PageInfo!
  }

  """Tag connection with pagination"""
  type TagConnection {
    items: [Tag!]!
    pageInfo: PageInfo!
  }

  """Category connection with pagination"""
  type CategoryConnection {
    items: [Category!]!
    pageInfo: PageInfo!
  }

  """Subscription event payload"""
  type SubscriptionEvent {
    type: SubscriptionEventType!
    entityId: ID!
    entity: SubscriptionEntity
    timestamp: String!
    message: String!
  }

  """Union of subscription entity types"""
  union SubscriptionEntity = Article | Author | Tag | Category

  """Query complexity report"""
  type ComplexityReport {
    score: Int!
    maxAllowed: Int!
    depth: Int!
    maxDepth: Int!
    isAllowed: Boolean!
    details: [ComplexityDetail!]!
  }

  """Detail of complexity calculation"""
  type ComplexityDetail {
    field: String!
    score: Int!
    depth: Int!
  }

  """CMS statistics summary"""
  type Stats {
    totalArticles: Int!
    totalAuthors: Int!
    totalTags: Int!
    totalCategories: Int!
    articlesByStatus: StatusCount!
    recentArticles: [Article!]!
    mostViewedArticles: [Article!]!
  }

  """Status count breakdown"""
  type StatusCount {
    draft: Int!
    review: Int!
    published: Int!
    rejected: Int!
    archived: Int!
  }
`;

module.exports = types;
