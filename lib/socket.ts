// Client-side Socket.io utilities
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(): Socket {
  if (socket) return socket;

  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Socket.io events for real-time scoring
export const SOCKET_EVENTS = {
  // Server -> Client events
  SCORE_UPDATED: 'score-updated',
  MATCH_STARTED: 'match-started',
  MATCH_COMPLETED: 'match-completed',
  STANDINGS_UPDATED: 'standings-updated',

  // Client -> Server events
  UPDATE_SCORE: 'update-score',
  START_MATCH: 'start-match',
  END_MATCH: 'end-match',
  JOIN_MATCH: 'join-match',
  LEAVE_MATCH: 'leave-match',
};

// Types for socket events
export interface ScoreUpdatePayload {
  matchId: string;
  setNumber: number;
  gameNumber: number;
  team1Points: number;
  team2Points: number;
}

export interface MatchStartedPayload {
  matchId: string;
  team1Id: string;
  team2Id: string;
  startedAt: string;
}

export interface MatchCompletedPayload {
  matchId: string;
  winnerId: string;
  finalScore: {
    team1Sets: number;
    team2Sets: number;
  };
  completedAt: string;
}

export interface StandingsUpdatePayload {
  teamId: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  gamesWon: number;
  gamesLost: number;
  setsWon: number;
  setsLost: number;
}
