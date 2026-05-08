/**
 * GraphQL CMS Server
 * Apollo Server with DataLoader, subscriptions, and query complexity analysis.
 */

'use strict';

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const { rootResolver, pubsub } = require('./resolvers');
const { createLoaders } = require('./dataloaders');
const config = require('./config');

/**
 * Create Apollo Server instance with full configuration.
 */
const server = new ApolloServer({
  typeDefs,
  resolvers: rootResolver,

  // Context function - creates fresh DataLoaders per request
  context: ({ req, connection }) => {
    // For HTTP requests
    if (req) {
      return {
        loaders: createLoaders(),
        pubsub,
        headers: req.headers,
      };
    }

    // For WebSocket subscriptions
    if (connection) {
      return {
        loaders: createLoaders(),
        pubsub,
        ...connection.context,
      };
    }

    return { loaders: createLoaders(), pubsub };
  },

  // Plugins
  plugins: [
    {
      // Request lifecycle plugin
      async requestDidStart() {
        return {
          async didResolveOperation({ request, document }) {
            // Log query in development
            if (config.graphql.tracing && request.operationName) {
              console.log(`[GraphQL] ${request.operationName}`);
            }
          },

          async didEncounterErrors({ errors, context }) {
            console.error('[GraphQL Errors]', errors.map(e => e.message));
          },
        };
      },
    },
  ],

  // Error formatting
  formatError: (err) => {
    // Don't leak internal errors in production
    if (config.server.nodeEnv === 'production') {
      return {
        message: err.message,
        code: err.extensions?.code || 'INTERNAL_ERROR',
        path: err.path,
      };
    }

    return {
      message: err.message,
      code: err.extensions?.code || err.originalError?.code || 'INTERNAL_ERROR',
      path: err.path,
      locations: err.locations,
      ...(err.originalError?.details && { details: err.originalError.details }),
    };
  },

  // Enable introspection and playground
  introspection: config.graphql.introspection,
  playground: config.graphql.playground,

  // Subscriptions configuration
  subscriptions: {
    path: config.subscriptions.path,
    onConnect: config.subscriptions.onConnect,
    onDisconnect: config.subscriptions.onDisconnect,
  },
});

/**
 * Start the server.
 */
async function startServer() {
  try {
    const { url, subscriptionsUrl } = await server.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`
    ╔══════════════════════════════════════════════════════════╗
    ║           GraphQL CMS Server Running                     ║
    ╠══════════════════════════════════════════════════════════╣
    ║  HTTP:        ${url.padEnd(47)}║
    ║  WS:          ${(subscriptionsUrl || url).padEnd(47)}║
    ║  Playground:  ${(url + '/graphql').padEnd(47)}║
    ║  Environment: ${config.server.nodeEnv.padEnd(47)}║
    ╚══════════════════════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Start if not in test mode
if (require.main === module) {
  startServer();
}

module.exports = { server, startServer };
