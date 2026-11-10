export async function roomRequest(id, token, op, data) {
  let response;
  try {
    response = await fetch('https://kemono-karate-room.metoatama-gamepark.workers.dev/rooms/' + encodeURIComponent(id) + '/' + op, {
      method: data ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
  } catch {
    throw new Error('対戦サーバーに接続できません。ネットワークや端末のフィルタリング設定を確認してください。');
  }
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || '通信に失敗しました。'), {status:response.status});
  return result;
}
