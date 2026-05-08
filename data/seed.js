/**
 * Seed data script for GraphQL CMS.
 * Populates the JSON data store with sample content.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../src/config');

const DATA_DIR = config.data.basePath;

/**
 * Ensure data directory exists.
 */
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Write data to a JSON file.
 */
function writeFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  Written ${data.length} items to ${filename}`);
}

/**
 * Generate seed data.
 */
function seed() {
  console.log('Seeding GraphQL CMS data...');
  ensureDir();

  // Authors
  const authors = [
    {
      id: uuidv4(),
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      bio: 'Senior software engineer and technical writer specializing in distributed systems and cloud architecture.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'ADMIN',
      socialLinks: { twitter: '@sarahchen', github: 'sarahchen', linkedin: 'sarahchen' },
      isActive: true,
      articleCount: 3,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: uuidv4(),
      name: 'Marcus Johnson',
      email: 'marcus.j@example.com',
      bio: 'Full-stack developer with a passion for GraphQL and modern web technologies.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      role: 'EDITOR',
      socialLinks: { twitter: '@marcusj', github: 'marcusjohnson', website: 'https://marcus.dev' },
      isActive: true,
      articleCount: 2,
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
    },
    {
      id: uuidv4(),
      name: 'Elena Rodriguez',
      email: 'elena.r@example.com',
      bio: 'DevOps engineer and open-source contributor. Writing about CI/CD and infrastructure.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
      role: 'AUTHOR',
      socialLinks: { github: 'elenar', linkedin: 'elenarodriguez' },
      isActive: true,
      articleCount: 2,
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-02-01T09:00:00Z',
    },
    {
      id: uuidv4(),
      name: 'David Kim',
      email: 'david.kim@example.com',
      bio: 'Frontend developer focused on React, Vue, and modern CSS architecture.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      role: 'CONTRIBUTOR',
      socialLinks: { twitter: '@davidkim', github: 'davidkim' },
      isActive: true,
      articleCount: 1,
      createdAt: '2024-02-10T11:00:00Z',
      updatedAt: '2024-02-10T11:00:00Z',
    },
  ];
  writeFile(config.data.files.authors, authors);

  // Categories
  const categories = [
    {
      id: uuidv4(),
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about software development, tools, and tech trends.',
      parentId: null,
      color: '#3B82F6',
      icon: 'laptop',
      sortOrder: 1,
      articleCount: 4,
      isActive: true,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    },
    {
      id: uuidv4(),
      name: 'DevOps',
      slug: 'devops',
      description: 'Infrastructure, CI/CD, and deployment strategies.',
      parentId: null,
      color: '#10B981',
      icon: 'server',
      sortOrder: 2,
      articleCount: 2,
      isActive: true,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    },
    {
      id: uuidv4(),
      name: 'Frontend',
      slug: 'frontend',
      description: 'UI development, frameworks, and browser technologies.',
      parentId: null,
      color: '#F59E0B',
      icon: 'layout',
      sortOrder: 3,
      articleCount: 1,
      isActive: true,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    },
    {
      id: uuidv4(),
      name: 'Backend',
      slug: 'backend',
      description: 'Server-side development, APIs, and databases.',
      parentId: null,
      color: '#8B5CF6',
      icon: 'database',
      sortOrder: 4,
      articleCount: 1,
      isActive: true,
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-10T08:00:00Z',
    },
  ];
  writeFile(config.data.files.categories, categories);

  // Tags
  const tags = [
    { id: uuidv4(), name: 'GraphQL', slug: 'graphql', color: '#E535AB', description: 'GraphQL API topics', articleCount: 3, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'Node.js', slug: 'nodejs', color: '#339933', description: 'Node.js runtime and ecosystem', articleCount: 2, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'React', slug: 'react', color: '#61DAFB', description: 'React library and ecosystem', articleCount: 2, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'TypeScript', slug: 'typescript', color: '#3178C6', description: 'TypeScript language features', articleCount: 1, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'Docker', slug: 'docker', color: '#2496ED', description: 'Containerization with Docker', articleCount: 1, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'API Design', slug: 'api-design', color: '#FF6B6B', description: 'REST and API design patterns', articleCount: 1, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'Microservices', slug: 'microservices', color: '#6C5CE7', description: 'Microservices architecture', articleCount: 1, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
    { id: uuidv4(), name: 'Testing', slug: 'testing', color: '#00B894', description: 'Testing strategies and tools', articleCount: 1, createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-10T08:00:00Z' },
  ];
  writeFile(config.data.files.tags, tags);

  // Articles
  const articles = [
    {
      id: uuidv4(),
      title: 'Building Scalable GraphQL APIs with Apollo Server',
      content: 'GraphQL has revolutionized how we build APIs by allowing clients to request exactly the data they need. In this comprehensive guide, we will explore how to build scalable GraphQL APIs using Apollo Server. We will cover schema design, resolver optimization, DataLoader for batching, error handling, and subscription implementation. By the end, you will have a production-ready GraphQL server that can handle complex queries efficiently.',
      excerpt: 'Learn how to build production-ready GraphQL APIs with Apollo Server, covering schema design and optimization.',
      authorId: authors[0].id,
      categoryId: categories[0].id,
      tagIds: [tags[0].id, tags[1].id],
      status: 'PUBLISHED',
      version: 3,
      viewCount: 2450,
      createdAt: '2024-02-15T10:00:00Z',
      updatedAt: '2024-03-01T14:00:00Z',
      publishedAt: '2024-02-20T09:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'Advanced DataLoader Patterns for GraphQL',
      content: 'DataLoader is a powerful utility for batching and caching database queries in GraphQL applications. This article explores advanced patterns including prime caching, cache invalidation, multi-level batching, and custom cache keys. We will also examine how to handle authentication context within DataLoaders and implement request-scoped caching for optimal performance in high-traffic applications.',
      excerpt: 'Explore advanced DataLoader patterns including caching strategies and multi-level batching.',
      authorId: authors[1].id,
      categoryId: categories[0].id,
      tagIds: [tags[0].id, tags[6].id],
      status: 'PUBLISHED',
      version: 2,
      viewCount: 1870,
      createdAt: '2024-02-20T11:00:00Z',
      updatedAt: '2024-02-28T16:00:00Z',
      publishedAt: '2024-02-25T10:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'Docker Fundamentals for Node.js Developers',
      content: 'Containerization with Docker has become essential for modern Node.js applications. This guide walks through creating optimized Docker images for Node.js, multi-stage builds, docker-compose for local development, and deployment strategies. Learn how to reduce image sizes, implement health checks, and manage environment variables securely in containerized environments.',
      excerpt: 'Master Docker containerization for Node.js applications with practical examples.',
      authorId: authors[2].id,
      categoryId: categories[1].id,
      tagIds: [tags[1].id, tags[4].id],
      status: 'PUBLISHED',
      version: 1,
      viewCount: 980,
      createdAt: '2024-03-01T09:00:00Z',
      updatedAt: '2024-03-05T12:00:00Z',
      publishedAt: '2024-03-05T08:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'React Server Components Deep Dive',
      content: 'React Server Components represent a paradigm shift in how we build React applications. This article provides a deep dive into the architecture, benefits, and implementation patterns of server components. We will explore streaming SSR, client-server boundaries, caching strategies, and how to incrementally adopt server components in existing applications.',
      excerpt: 'A comprehensive deep dive into React Server Components architecture and patterns.',
      authorId: authors[3].id,
      categoryId: categories[2].id,
      tagIds: [tags[2].id, tags[3].id],
      status: 'REVIEW',
      version: 2,
      viewCount: 0,
      createdAt: '2024-03-10T13:00:00Z',
      updatedAt: '2024-03-12T15:00:00Z',
      publishedAt: null,
    },
    {
      id: uuidv4(),
      title: 'Content Versioning Strategies for CMS Systems',
      content: 'Implementing content versioning is crucial for any content management system. This article explores different versioning strategies including snapshot-based versioning, delta-based approaches, and Git-like branching models. We will discuss trade-offs between storage efficiency and retrieval speed, and provide a reference implementation using JSON-based persistence.',
      excerpt: 'Explore content versioning strategies for building robust CMS systems.',
      authorId: authors[0].id,
      categoryId: categories[3].id,
      tagIds: [tags[0].id, tags[5].id],
      status: 'DRAFT',
      version: 1,
      viewCount: 0,
      createdAt: '2024-03-15T08:00:00Z',
      updatedAt: '2024-03-15T08:00:00Z',
      publishedAt: null,
    },
    {
      id: uuidv4(),
      title: 'End-to-End Testing with Jest and Supertest',
      content: 'Testing GraphQL APIs requires a strategic approach to ensure both resolver logic and schema integrity. This guide demonstrates how to set up comprehensive testing with Jest and Supertest, covering unit tests for resolvers, integration tests for mutations, subscription testing, and mocking DataLoaders for isolated test environments.',
      excerpt: 'Learn comprehensive testing strategies for GraphQL APIs using Jest and Supertest.',
      authorId: authors[1].id,
      categoryId: categories[0].id,
      tagIds: [tags[1].id, tags[7].id],
      status: 'PUBLISHED',
      version: 1,
      viewCount: 720,
      createdAt: '2024-03-18T10:00:00Z',
      updatedAt: '2024-03-20T09:00:00Z',
      publishedAt: '2024-03-20T09:00:00Z',
    },
    {
      id: uuidv4(),
      title: 'Microservices Communication Patterns',
      content: 'When building microservices, choosing the right communication pattern is critical. This article compares synchronous REST/gRPC approaches with asynchronous message-based architectures using event buses and message queues. We analyze trade-offs in consistency, latency, fault tolerance, and operational complexity with real-world examples.',
      excerpt: 'Compare communication patterns for microservices architecture.',
      authorId: authors[2].id,
      categoryId: categories[1].id,
      tagIds: [tags[6].id, tags[1].id],
      status: 'DRAFT',
      version: 1,
      viewCount: 0,
      createdAt: '2024-03-22T11:00:00Z',
      updatedAt: '2024-03-22T11:00:00Z',
      publishedAt: null,
    },
    {
      id: uuidv4(),
      title: 'TypeScript Generics for API Development',
      content: 'TypeScript generics provide powerful type safety for API development. This article demonstrates practical patterns for building type-safe GraphQL resolvers, generic database access layers, and reusable middleware functions. Learn how to leverage conditional types, mapped types, and template literal types for robust API development.',
      excerpt: 'Master TypeScript generics for building type-safe APIs.',
      authorId: authors[0].id,
      categoryId: categories[0].id,
      tagIds: [tags[3].id, tags[5].id],
      status: 'PUBLISHED',
      version: 2,
      viewCount: 1540,
      createdAt: '2024-03-25T09:00:00Z',
      updatedAt: '2024-03-28T14:00:00Z',
      publishedAt: '2024-03-28T10:00:00Z',
    },
  ];
  writeFile(config.data.files.articles, articles);

  console.log('Seed complete!');
  console.log(`  ${authors.length} authors`);
  console.log(`  ${categories.length} categories`);
  console.log(`  ${tags.length} tags`);
  console.log(`  ${articles.length} articles`);
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };
