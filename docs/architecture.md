# GraphQL CMS - Architecture Documentation

## Overview

The GraphQL CMS Server is a content management system built on Apollo Server with a modular architecture designed for scalability, performance, and developer experience.

## System Architecture

```
                    Client
                      |
                      v
               +-------------+
               |   Apollo    |
               |   Server    |
               +------+------+
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
   +---------+  +-----------+  +-----------+
   | Schema  |  | Resolvers |  |  PubSub   |
   +---------+  +-----------+  +-----------+
        |             |             |
        v             v             v
   +---------+  +-----------+  +-----------+
   |  Types  |  | DataLoaders|  |    WS     |
   |  Enums  |  +-----------+  +-----------+
   | Inputs  |         |
   +---------+         v
                +-----------+
                |  Models   |
                +-----+-----+
                      |
                +-----v-----+
                |   JSON    |
                |  Files    |
                +-----------+
```

## Layer Descriptions

### 1. Schema Layer (`src/schema/`)

Defines the GraphQL type system using Schema Definition Language (SDL):

- **`enums.js`** - Enumeration types for status, roles, sort fields
- **`types.js`** - Core entity types (Article, Author, Tag, Category) and supporting types
- **`inputs.js`** - Input types for mutations and queries
- **`index.js`** - Root Query, Mutation, and Subscription type definitions

**Key Design Decisions:**
- Cursor-based pagination with `Connection` and `PageInfo` types
- Union types for search results (`SearchResultItem`) and subscription entities
- Separate input types for create and update operations

### 2. Resolver Layer (`src/resolvers/`)

Implements business logic for each field:

- **`articleResolver.js`** - Article CRUD, versioning, publishing workflow
- **`authorResolver.js`** - Author management with dependency checking
- **`tagResolver.js`** - Tag management
- **`categoryResolver.js`** - Category hierarchy with tree structure
- **`index.js`** - Root resolver merger, search, stats, complexity analysis

**Patterns:**
- Field-level resolvers for relational data
- Subscription publishing on mutations
- Error codes for client handling

### 3. DataLoader Layer (`src/dataloaders/`)

Eliminates N+1 query problem through batching and caching:

- **`authorLoader.js`** - Batches author lookups by ID
- **`tagLoader.js`** - Batches tag lookups by ID and article associations
- **`index.js`** - Factory for creating loaders per request

**How It Works:**
```
Without DataLoader:
  Query 100 articles -> 100 separate author queries (N+1)

With DataLoader:
  Query 100 articles -> 1 batched author query (batch)
```

### 4. Model Layer (`src/models/`)

Handles data persistence and validation:

- **`Article.js`** - Article CRUD with status transition validation
- **`Author.js`** - Author management with email uniqueness
- **`Tag.js`** - Tag management with slug normalization
- **`Category.js`** - Category hierarchy with tree operations

**Storage:**
- JSON file-based persistence for simplicity
- Automatic directory and file creation
- Atomic write operations

### 5. Utility Layer (`src/utils/`)

Shared functionality:

- **`search.js`** - Full-text search with relevance scoring and highlighting
- **`pagination.js`** - Offset and cursor-based pagination
- **`versionControl.js`** - Content versioning with snapshots and diffs

## Publishing Workflow

```
                    +-----------+
                    |   DRAFT   |
                    +-----+-----+
                          |
                    +-----v-----+
                    |  REVIEW   |
                    +-----+-----+
                    |     |     |
              +-----+     |     +-----+
              v           |           v
        +---------+       |      +----------+
        | PUBLISHED|      |      | REJECTED |
        +----+----+       |      +----+-----+
             |            |           |
             v            v           v
        +---------+  +----------+  +---------+
        | ARCHIVED |  |  DRAFT   |  | ARCHIVED|
        +----------+  +----------+  +---------+
```

**Valid Transitions:**
- DRAFT -> REVIEW, ARCHIVED
- REVIEW -> PUBLISHED, DRAFT, REJECTED
- PUBLISHED -> ARCHIVED, DRAFT
- REJECTED -> DRAFT, ARCHIVED
- ARCHIVED -> DRAFT

## Query Complexity Analysis

The server includes a query complexity analysis system:

```
Query: { articles { items { title author { name articles { items { title } } } } } }
Score: 45
Depth: 5
Max Allowed: 1000
Status: ALLOWED
```

**Field Weights:**
- `articles` / `authors`: 10
- `tags` / `categories`: 5
- `search`: 20
- `stats`: 15
- `content` / `versions`: 5
- `article` / `author` (single): 2

## Subscription Architecture

Uses `graphql-subscriptions` with in-memory PubSub:

```
Mutation -> PubSub.publish(EVENT, payload) -> Subscribers receive update
```

**Event Types:**
- `ARTICLE_CREATED`, `ARTICLE_UPDATED`, `ARTICLE_DELETED`
- `AUTHOR_CREATED`, `AUTHOR_UPDATED`
- `TAG_CREATED`, `CATEGORY_CREATED`

## Data Flow

### Query Flow
```
1. Client sends query
2. Apollo Server parses and validates
3. Root resolver delegates to entity resolver
4. Entity resolver loads data from model
5. Field resolvers use DataLoaders for relations
6. Response assembled and returned
```

### Mutation Flow
```
1. Client sends mutation
2. Input validated by model
3. Business logic executed
4. Data persisted to JSON files
5. Version snapshot created (for articles)
6. Subscription event published
7. Updated entity returned
```

## Performance Optimizations

1. **DataLoader Batching** - Single database query per request for N+1 scenarios
2. **Request-Scoped Caching** - DataLoader caches within a single request
3. **Query Complexity Limit** - Prevents expensive queries
4. **Pagination Defaults** - Default 20 items, max 100 per page
5. **Search Indexing** - Inverted index for fast full-text search

## Error Handling

Errors include machine-readable codes:

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Requested resource not found |
| `DUPLICATE_EMAIL` | Email already in use |
| `DUPLICATE_TAG` | Tag slug already exists |
| `INVALID_TRANSITION` | Invalid status transition |
| `HAS_DEPENDENCIES` | Resource has dependent children |
| `HAS_CHILDREN` | Category has subcategories |
| `CIRCULAR_REFERENCE` | Category references itself |
| `BATCH_LOAD_ERROR` | DataLoader batch failed |

## Future Enhancements

1. **Database Migration** - Replace JSON files with PostgreSQL/MongoDB
2. **Authentication** - JWT-based auth with role-based access control
3. **File Uploads** - GraphQL multipart for image/media uploads
4. **Caching Layer** - Redis for DataLoader caching and response caching
5. **Rate Limiting** - Query cost-based rate limiting
6. **Federation** - Apollo Federation for microservices architecture
