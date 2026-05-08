# GraphQL CMS Server

<p align="center">
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white" alt="GraphQL" />
  <img src="https://img.shields.io/badge/Apollo%20Server-311C87?style=flat&logo=apollo-graphql&logoColor=white" alt="Apollo Server" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version" />
</p>

A production-grade **GraphQL server for content management** built with Apollo Server. Features content type management, article CRUD, author management, tag/category systems, content versioning, publishing workflows, full-text search, pagination, real-time subscriptions, and query complexity analysis.

## Features

### Core Functionality
- **Content Type Management** - Define and manage articles, authors, tags, and categories
- **Full CRUD Operations** - Create, read, update, and delete all content types
- **Publishing Workflow** - Draft &rarr; Review &rarr; Published &rarr; Archived lifecycle
- **Content Versioning** - Automatic snapshots with diff tracking and rollback support
- **Full-Text Search** - Multi-field search with relevance scoring and highlighting

### GraphQL Features
- **Apollo Server 3** - Production-grade GraphQL server
- **DataLoader** - N+1 query elimination with batching and caching
- **GraphQL Playground** - Interactive query explorer (development)
- **Subscriptions** - Real-time updates via WebSocket
- **Query Complexity Analysis** - Prevent expensive queries with scoring
- **Input Validation** - Comprehensive validation on all mutations
- **Error Handling** - Structured errors with machine-readable codes

### Data Layer
- **JSON File Storage** - Simple, portable persistence layer
- **Category Hierarchy** - Nested parent-child category tree
- **Tag System** - Flexible article tagging with color coding
- **Author Management** - Role-based author system

### Developer Experience
- **Jest Testing** - Unit and integration tests with coverage
- **ESLint** - Code quality and style enforcement
- **Seed Data** - Pre-populated sample content
- **Conventional Commits** - Simulated git history

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Apollo Server 3 | GraphQL server framework |
| GraphQL 16 | Schema definition and query language |
| DataLoader 2 | Batching and deduplication |
| graphql-subscriptions | PubSub for real-time updates |
| UUID | Unique identifier generation |
| Jest | Testing framework |
| ESLint | Code linting |
| Node.js 16+ | Runtime environment |

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/graphql-cms-server.git
cd graphql-cms-server

# Install dependencies
npm install

# Seed the database with sample data
npm run seed

# Start the server
npm start
```

The server will start at `http://localhost:4000` with GraphQL Playground available.

### Development

```bash
# Run with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

## GraphQL API Examples

### Queries

#### Get all articles with pagination
```graphql
query GetArticles {
  articles(
    filter: { status: PUBLISHED }
    page: { limit: 5, sortBy: "publishedAt", sortOrder: DESC }
  ) {
    items {
      id
      title
      excerpt
      status
      publishedAt
      author {
        name
        email
      }
      category {
        name
      }
      tags {
        name
        color
      }
    }
    pageInfo {
      total
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

#### Get a single article
```graphql
query GetArticle($id: ID!) {
  article(id: $id) {
    id
    title
    content
    excerpt
    status
    version
    viewCount
    author {
      id
      name
      bio
    }
    category {
      id
      name
      slug
    }
    tags {
      id
      name
      color
    }
    versions {
      version
      action
      createdAt
    }
    createdAt
    updatedAt
    publishedAt
  }
}
```

#### Full-text search
```graphql
query SearchContent {
  search(input: { query: "GraphQL", types: [ARTICLE], limit: 10 }) {
    item {
      ... on Article {
        id
        title
        excerpt
      }
    }
    score
    highlights {
      title
      content
    }
  }
}
```

#### Get category tree
```graphql
query GetCategoryTree {
  categoryTree {
    id
    name
    slug
    children {
      id
      name
      slug
    }
  }
}
```

#### Get CMS statistics
```graphql
query GetStats {
  stats {
    totalArticles
    totalAuthors
    totalTags
    totalCategories
    articlesByStatus {
      draft
      review
      published
      rejected
      archived
    }
    recentArticles {
      id
      title
      status
      createdAt
    }
    mostViewedArticles {
      id
      title
      viewCount
    }
  }
}
```

#### Query complexity analysis
```graphql
query AnalyzeComplexity {
  complexity(query: "{ articles { items { title author { name } } } }") {
    score
    maxAllowed
    depth
    maxDepth
    isAllowed
    details {
      field
      score
      depth
    }
  }
}
```

### Mutations

#### Create an article
```graphql
mutation CreateArticle {
  createArticle(input: {
    title: "Getting Started with GraphQL"
    content: "GraphQL is a query language for APIs..."
    excerpt: "Learn GraphQL from scratch"
    authorId: "author-id-here"
    categoryId: "category-id-here"
    tagIds: ["tag-id-1", "tag-id-2"]
    status: DRAFT
  }) {
    id
    title
    status
    version
    createdAt
  }
}
```

#### Update article status (publishing workflow)
```graphql
mutation PublishArticle {
  changeArticleStatus(id: "article-id", status: PUBLISHED) {
    id
    title
    status
    publishedAt
  }
}
```

#### Update an article
```graphql
mutation UpdateArticle {
  updateArticle(id: "article-id", input: {
    title: "Updated Title"
    content: "Updated content..."
  }) {
    id
    title
    version
    updatedAt
  }
}
```

#### Create an author
```graphql
mutation CreateAuthor {
  createAuthor(input: {
    name: "Jane Doe"
    email: "jane@example.com"
    bio: "Technical writer and developer"
    role: AUTHOR
  }) {
    id
    name
    email
    role
    createdAt
  }
}
```

#### Create a tag
```graphql
mutation CreateTag {
  createTag(input: {
    name: "React"
    color: "#61DAFB"
    description: "React library and ecosystem"
  }) {
    id
    name
    slug
    color
  }
}
```

#### Create a category
```graphql
mutation CreateCategory {
  createCategory(input: {
    name: "Frontend"
    description: "Frontend development topics"
    color: "#F59E0B"
    sortOrder: 1
  }) {
    id
    name
    slug
    color
  }
}
```

#### Delete an article
```graphql
mutation DeleteArticle {
  deleteArticle(id: "article-id")
}
```

#### Restore a version
```graphql
mutation RestoreVersion {
  restoreArticleVersion(id: "article-id", version: 2) {
    id
    title
    version
  }
}
```

### Subscriptions

#### Subscribe to all content changes
```graphql
subscription OnContentChanged {
  contentChanged {
    type
    entityId
    timestamp
    message
  }
}
```

#### Subscribe to article changes
```graphql
subscription OnArticleChanged {
  articleChanged {
    type
    entityId
    entity {
      ... on Article {
        id
        title
        status
      }
    }
    timestamp
  }
}
```

## Project Structure

```
project_22_graphql_cms/
  src/
    server.js              # Apollo Server setup and configuration
    schema/
      index.js             # Root type definitions
      types.js             # Entity types (Article, Author, Tag, Category)
      inputs.js            # Input types for mutations
      enums.js             # Enum definitions
    resolvers/
      index.js             # Root resolver with search, stats, complexity
      articleResolver.js   # Article queries, mutations, field resolvers
      authorResolver.js    # Author queries, mutations
      tagResolver.js       # Tag queries, mutations
      categoryResolver.js  # Category queries, mutations, tree
    dataloaders/
      index.js             # Loader factory
      authorLoader.js      # Author batch loading
      tagLoader.js         # Tag batch loading
    models/
      Article.js           # Article data model
      Author.js            # Author data model
      Tag.js               # Tag data model
      Category.js          # Category data model
    utils/
      search.js            # Full-text search with relevance scoring
      pagination.js        # Offset and cursor pagination
      versionControl.js    # Content versioning system
    config.js              # Server configuration
  tests/
    test_schema.js         # Schema definition tests
    test_resolvers.js      # Resolver and complexity tests
    test_dataloaders.js    # DataLoader tests
    test_search.js         # Search utility tests
  data/
    seed.js                # Sample data generator
  docs/
    architecture.md        # Architecture documentation
  package.json
  README.md
  LICENSE
  .gitignore
```

## Architecture

### Data Flow

```
Client Request
    |
    v
Apollo Server --> Schema Validation
    |
    v
Root Resolver --> Entity Resolver
    |
    v
Field Resolvers --> DataLoader (batching)
    |
    v
Models --> JSON File Storage
```

### Key Design Patterns

1. **DataLoader Batching** - Each request gets fresh DataLoaders that batch and cache database lookups, eliminating N+1 query problems
2. **Publishing Workflow** - State machine with validated transitions (Draft &rarr; Review &rarr; Published)
3. **Content Versioning** - Snapshots created on every change with diff tracking and rollback
4. **Query Complexity** - Field-weight scoring prevents expensive queries

### Publishing Workflow

```
    +--------+     +--------+     +----------+     +---------+
    |  DRAFT | --> | REVIEW | --> | PUBLISHED| --> | ARCHIVED|
    +--------+     +--------+     +----------+     +---------+
                      |    |
                      v    v
                  +---------+
                  | REJECTED|
                  +---------+
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Query Complexity

The server analyzes query complexity to prevent abuse:

| Field | Weight |
|-------|--------|
| articles / authors | 10 |
| search | 20 |
| stats | 15 |
| tags / categories | 5 |
| single entity | 2 |

Maximum allowed complexity: **1000**

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_EMAIL` | Email already exists |
| `INVALID_TRANSITION` | Invalid status transition |
| `HAS_DEPENDENCIES` | Resource has children |
| `BATCH_LOAD_ERROR` | DataLoader failed |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `NODE_ENV` | development | Environment mode |

## Screenshots

> ![GraphQL Playground](https://via.placeholder.com/800x400/311C87/FFFFFF?text=GraphQL+Playground)
>
> Interactive GraphQL Playground with schema introspection and query autocompletion

> ![Article Query](https://via.placeholder.com/800x400/10B981/FFFFFF?text=Article+Query+Example)
>
> Example query fetching articles with pagination and nested relations

> ![Publishing Workflow](https://via.placeholder.com/800x400/F59E0B/FFFFFF?text=Publishing+Workflow)
>
> Status transitions from draft to published with validation

## Future Improvements

- [ ] PostgreSQL/MongoDB database integration
- [ ] JWT authentication with role-based access control
- [ ] Redis caching layer for DataLoader
- [ ] File upload support for media assets
- [ ] Rate limiting based on query complexity
- [ ] Apollo Federation for microservices
- [ ] Docker containerization
- [ ] CI/CD pipeline with GitHub Actions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  Built with GraphQL and Apollo Server
</p>
