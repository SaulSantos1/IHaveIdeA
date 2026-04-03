const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchTodayQuestion() {
  const res = await fetch(`${API_URL}/api/question/today`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch question');
  return res.json();
}

export async function submitAnswer(sessionHash: string, answer: string) {
  const res = await fetch(`${API_URL}/api/answer/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionHash, answer })
  });
  
  if (res.status === 409) {
    throw new Error('JÁ_RESPONDIDO');
  }
  
  if (!res.ok) throw new Error('Failed to submit answer');
  return res.json();
}

export async function checkAnswerStatus(sessionHash: string) {
  const res = await fetch(`${API_URL}/api/answer/status/${sessionHash}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to check status');
  return res.json();
}

export async function getNextReset() {
  const res = await fetch(`${API_URL}/api/question/next-reset`, { cache: 'no-store' });
  if (!res.ok) return { resetAt: new Date(Date.now() + 86400000).toISOString() };
  return res.json();
}
