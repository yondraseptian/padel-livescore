'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Download, 
  Target, 
  TrendingUp, 
  Activity, 
  X,
  Star,
  Zap
} from 'lucide-react';

interface PlayerData {
  id: string;
  name: string;
  avatar_url?: string;
  total_points?: number;
  total_matches_played?: number;
  total_matches_won?: number;
  total_matches_lost?: number;
  total_games_won?: number;
  total_games_lost?: number;
  tournaments_played?: number;
  // For tournament specific
  points?: number;
  matches_played?: number;
  matches_won?: number;
  matches_lost?: number;
  games_won?: number;
  games_lost?: number;
}

interface PlayerCardModalProps {
  player: PlayerData | null;
  isOpen: boolean;
  onClose: () => void;
  isGlobal?: boolean;
}

export function PlayerCardModal({ player, isOpen, onClose, isGlobal = true }: PlayerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!player) return null;

  const points = isGlobal ? player.total_points : player.points;
  const played = isGlobal ? player.total_matches_played : player.matches_played;
  const won = isGlobal ? player.total_matches_won : player.matches_won;
  const gamesWon = isGlobal ? player.total_games_won : player.games_won;
  const gamesLost = isGlobal ? player.total_games_lost : player.games_lost;
  const winRate = played ? Math.round((won! / played!) * 100) : 0;
  const diff = (gamesWon || 0) - (gamesLost || 0);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      setDownloading(true);
      // Wait a bit for images to load if any
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#020617', // slate-950
      });
      
      const link = document.createElement('a');
      link.download = `player-card-${player.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 p-0 overflow-hidden sm:rounded-3xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Player Profile
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Personal statistics and achievement card
            </DialogDescription>
          </DialogHeader>

          {/* Card to be captured */}
          <div className="flex justify-center py-4">
            <div 
              ref={cardRef}
              className="relative w-80 aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-900 border-2 border-amber-500/30 p-1 shadow-2xl shadow-amber-500/10"
            >
              {/* Card Content */}
              <div className="h-full w-full rounded-[2.2rem] bg-gradient-to-b from-slate-800 to-slate-950 p-6 flex flex-col items-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                
                {/* Header Info */}
                <div className="w-full flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-amber-500 italic leading-none">{points}</span>
                    <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Points</span>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                {/* Player Avatar */}
                <div className="relative mb-6 z-10">
                  <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-slate-600">{player.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 right-0 bg-amber-500 text-slate-950 w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-slate-900 shadow-lg italic">
                    {winRate}%
                  </div>
                </div>

                {/* Player Name */}
                <div className="text-center mb-8 z-10">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight italic line-clamp-1">{player.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="h-px w-8 bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Padel Professional</span>
                    <div className="h-px w-8 bg-slate-700" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                  <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 flex flex-col items-center">
                    <span className="text-lg font-bold text-white">{played}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Matches</span>
                  </div>
                  <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 flex flex-col items-center">
                    <span className="text-lg font-bold text-white">{won}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Wins</span>
                  </div>
                  <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 flex flex-col items-center">
                    <span className={`text-lg font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Game Diff</span>
                  </div>
                  <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50 flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-lg font-bold text-white">Elite</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Rank Status</span>
                  </div>
                </div>

                {/* Footer Brand */}
                <div className="mt-auto flex items-center gap-2 opacity-30 z-10">
                  <Activity className="w-3 h-3 text-white" />
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Padel LiveScore 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              onClick={onClose}
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2 font-bold"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Loader2({ className }: { className?: string }) {
  return <div className={`border-2 border-white/30 border-t-white rounded-full ${className}`} />;
}
