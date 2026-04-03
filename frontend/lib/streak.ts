export interface AnswerHistoryItem {
  date: string;
  status: 'CORRECT' | 'PARTIAL' | 'WRONG';
  questionId: string;
}

export interface StreakData {
  streak: number;
  lastAnsweredDate: string;
  lastResult: 'CORRECT' | 'PARTIAL' | 'WRONG' | null;
  longestStreak: number;
  totalGames: number;
  correctCount: number;
  partialCount: number;
  wrongCount: number;
  history: AnswerHistoryItem[];
  sessionHash?: string;
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getSessionHash(): string {
  if (typeof window === 'undefined') return '';
  let stored = localStorage.getItem('ihaveidea_session');
  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem('ihaveidea_session', stored);
  }
  return stored;
}

export function getStreakData(): StreakData {
  if (typeof window === 'undefined') return { streak: 0, lastAnsweredDate: '', lastResult: null, longestStreak: 0, totalGames: 0, correctCount: 0, partialCount: 0, wrongCount: 0, history: [] };
  
  const raw = localStorage.getItem('ihi_termo_streak');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      ensureSessionHash(data);
      return data;
    } catch(e) { }
  }
  return { streak: 0, lastAnsweredDate: '', lastResult: null, longestStreak: 0, totalGames: 0, correctCount: 0, partialCount: 0, wrongCount: 0, history: [], sessionHash: getSessionHash() };
}

function ensureSessionHash(data: StreakData) {
  if (!data.sessionHash) data.sessionHash = getSessionHash();
}

export function updateStreak(status: 'CORRECT' | 'PARTIAL' | 'WRONG', questionId: string) {
  if (typeof window === 'undefined') return;
  const data = getStreakData();
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (data.lastAnsweredDate === today) {
    return;
  }

  // Increment counters
  data.totalGames += 1;
  if (status === 'CORRECT') data.correctCount += 1;
  else if (status === 'PARTIAL') data.partialCount += 1;
  else data.wrongCount += 1;

  if (status === 'CORRECT' || status === 'PARTIAL') {
    if (data.lastAnsweredDate === yesterday) {
      data.streak += 1;
    } else {
      data.streak = 1;
    }
  } else {
    data.streak = 0; // Errou totalmente, quebra o streak
  }

  data.lastAnsweredDate = today;
  data.lastResult = status;
  if (data.streak > data.longestStreak) {
    data.longestStreak = data.streak;
  }

  data.history.unshift({ date: today, status, questionId });
  if (data.history.length > 30) data.history.pop();
  
  localStorage.setItem('ihi_termo_streak', JSON.stringify(data));
  return data;
}
