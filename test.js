const { server } = require('./server');

async function run() {
  await new Promise(resolve => server.listen(3000, resolve));
  const headers = { 'Content-Type': 'application/json' };

  let res = await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Alice', email: 'alice@example.com' })
  });
  const user1 = await res.json();

  res = await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Bob', email: 'bob@example.com' })
  });
  const user2 = await res.json();

  await fetch('http://localhost:3000/friends', {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: user1.id, friendId: user2.id })
  });

  res = await fetch('http://localhost:3000/recommendations', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId: user1.id,
      title: 'Inception',
      type: 'Movie',
      platform: ['Netflix'],
      rating: 5
    })
  });
  const rec = await res.json();

  res = await fetch(`http://localhost:3000/feed?userId=${user2.id}`);
  const feed = await res.json();
  if (feed.length !== 1 || feed[0].id !== rec.id) throw new Error('Feed not working');

  await fetch(`http://localhost:3000/recommendations/${rec.id}/like`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: user2.id })
  });

  await fetch(`http://localhost:3000/recommendations/${rec.id}/comment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: user2.id, text: 'Great!' })
  });

  await fetch('http://localhost:3000/watchlist', {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: user2.id, recId: rec.id })
  });

  res = await fetch(`http://localhost:3000/watchlist?userId=${user2.id}`);
  const wl = await res.json();
  if (wl.length !== 1) throw new Error('Watchlist not working');

  console.log('All tests passed');
  server.close();
}

run();
