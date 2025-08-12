const http = require('http');
const url = require('url');
const { randomUUID } = require('crypto');

const users = [];
const recommendations = [];
const friendships = [];
const watchlists = [];

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;

  if (method === 'POST' && parsed.pathname === '/users') {
    const body = await parseBody(req);
    if (!body.name || !body.email) return send(res, 400, { error: 'name and email required' });
    const user = {
      id: randomUUID(),
      name: body.name,
      email: body.email,
      profilePic: body.profilePic || '',
      bio: body.bio || '',
      favoriteGenres: body.favoriteGenres || [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
    return send(res, 201, user);
  }

  if (method === 'POST' && parsed.pathname === '/friends') {
    const body = await parseBody(req);
    if (!body.userId || !body.friendId) return send(res, 400, { error: 'userId and friendId required' });
    friendships.push({ userId1: body.userId, userId2: body.friendId });
    friendships.push({ userId1: body.friendId, userId2: body.userId });
    return send(res, 201, { status: 'friends' });
  }

  if (method === 'POST' && parsed.pathname === '/recommendations') {
    const body = await parseBody(req);
    if (!body.userId || !body.title || !body.type) return send(res, 400, { error: 'userId, title, type required' });
    const rec = {
      id: randomUUID(),
      userId: body.userId,
      title: body.title,
      type: body.type,
      releaseYear: body.releaseYear || null,
      cast: body.cast || [],
      director: body.director || '',
      genres: body.genres || [],
      languages: body.languages || [],
      duration: body.duration || '',
      platform: body.platform || [],
      rating: body.rating || null,
      reviewText: body.reviewText || '',
      spoilerFlag: body.spoilerFlag || false,
      imageUrl: body.imageUrl || '',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    recommendations.push(rec);
    return send(res, 201, rec);
  }

  if (method === 'POST' && /^\/recommendations\/[^\/]+\/like$/.test(parsed.pathname)) {
    const recId = parsed.pathname.split('/')[2];
    const body = await parseBody(req);
    if (!body.userId) return send(res, 400, { error: 'userId required' });
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return send(res, 404, { error: 'not found' });
    if (!rec.likes.includes(body.userId)) rec.likes.push(body.userId);
    return send(res, 200, { likes: rec.likes.length });
  }

  if (method === 'POST' && /^\/recommendations\/[^\/]+\/comment$/.test(parsed.pathname)) {
    const recId = parsed.pathname.split('/')[2];
    const body = await parseBody(req);
    if (!body.userId || !body.text) return send(res, 400, { error: 'userId and text required' });
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return send(res, 404, { error: 'not found' });
    const comment = { id: randomUUID(), userId: body.userId, text: body.text, createdAt: new Date().toISOString() };
    rec.comments.push(comment);
    return send(res, 201, comment);
  }

  if (method === 'GET' && parsed.pathname === '/feed') {
    const userId = parsed.query.userId;
    if (!userId) return send(res, 400, { error: 'userId required' });
    const friendIds = friendships.filter(f => f.userId1 === userId).map(f => f.userId2);
    const feed = recommendations
      .filter(r => r.userId === userId || friendIds.includes(r.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return send(res, 200, feed);
  }

  if (method === 'POST' && parsed.pathname === '/watchlist') {
    const body = await parseBody(req);
    if (!body.userId || !body.recId) return send(res, 400, { error: 'userId and recId required' });
    const wl = { id: randomUUID(), userId: body.userId, recId: body.recId, status: 'planned', watchedDate: null };
    watchlists.push(wl);
    return send(res, 201, wl);
  }

  if (method === 'GET' && parsed.pathname === '/watchlist') {
    const userId = parsed.query.userId;
    if (!userId) return send(res, 400, { error: 'userId required' });
    const wl = watchlists.filter(w => w.userId === userId);
    return send(res, 200, wl);
  }

  send(res, 404, { error: 'Not found' });
});

if (require.main === module) {
  server.listen(3000, () => console.log('ReelShare server running on port 3000'));
}

module.exports = { server, users, recommendations, friendships, watchlists };
