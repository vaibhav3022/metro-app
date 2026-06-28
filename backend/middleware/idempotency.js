const NodeCache = require('node-cache');
const idempotencyCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

/**
 * Blocks duplicate payment requests
 * Client should send X-Idempotency-Key header
 */
async function idempotency(req, res, next) {
  const key = req.headers['x-idempotency-key'];

  if (!key) {
    return res.status(400).json({ message: 'X-Idempotency-Key header required' });
  }

  const cacheKey = `idem:${req.user?.id || 'guest'}:${key}`;

  const cached = idempotencyCache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ ...cached, fromCache: true });
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(cacheKey, body);
    }
    return originalJson(body);
  };

  next();
}

module.exports = idempotency;
