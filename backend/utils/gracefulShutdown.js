const mongoose = require('mongoose');

/**
 * Clean shutdown on SIGTERM / SIGINT
 * @param {http.Server} server - Express server instance
 */
function setupGracefulShutdown(server) {
  async function shutdown(signal) {
    console.log(`\n[Shutdown] ${signal} received — closing gracefully...`);

    // 1. Stop new requests
    server.close(async () => {
      console.log('[Shutdown] HTTP server closed');

      try {
        // 2. Close DB connections
        await mongoose.connection.close();
        console.log('[Shutdown] MongoDB closed');

        console.log('[Shutdown] Done. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('[Shutdown] Error during cleanup:', err);
        process.exit(1);
      }
    });

    // Force exit after 30s if stuck
    setTimeout(() => {
      console.error('[Shutdown] Force exit after timeout');
      process.exit(1);
    }, 30_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    shutdown('unhandledRejection');
  });
}

module.exports = { setupGracefulShutdown };
