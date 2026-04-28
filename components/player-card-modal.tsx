'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Download, 
  Star,
  Zap,
  Check,
  Share2,
  Activity,
  Award,
  CircleDot
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

type Theme = 'dark' | 'light' | 'orange' | 'glass' | 'transparent';

export function PlayerCardModal({ player, isOpen, onClose, isGlobal = true }: PlayerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>('dark');

  if (!player) return null;

  const points = isGlobal ? player.total_points : player.points;
  const played = isGlobal ? player.total_matches_played : player.matches_played;
  const won = isGlobal ? player.total_matches_won : player.matches_won;
  const gamesWon = isGlobal ? player.total_games_won : player.games_won;
  const gamesLost = isGlobal ? player.total_games_lost : player.games_lost;
  const winRate = played ? Math.round((won! / played!) * 100) : 0;
  const diff = (gamesWon || 0) - (gamesLost || 0);

  const themes: { id: Theme; name: string; class: string; btn: string }[] = [
    { id: 'dark', name: 'Elite Dark', class: 'bg-slate-950 text-white', btn: 'bg-slate-800' },
    { id: 'light', name: 'Minimalist', class: 'bg-white text-slate-950', btn: 'bg-slate-200' },
    { id: 'orange', name: 'Padel Brand', class: 'bg-amber-500 text-slate-950', btn: 'bg-amber-600' },
    { id: 'glass', name: 'Cinematic', class: 'text-white overflow-hidden', btn: 'bg-slate-800/50' },
    { id: 'transparent', name: 'Text Only', class: 'bg-transparent text-white', btn: 'border-dashed border-slate-700' },
  ];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      setDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: activeTheme === 'transparent' ? null : undefined,
      });
      
      const link = document.createElement('a');
      link.download = `padel-stats-${player.name.toLowerCase().replace(/\s+/g, '-')}.png`;
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
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 p-0 overflow-hidden sm:rounded-[2rem]">
        {/* Hidden titles for accessibility */}
        <div className="sr-only">
          <DialogTitle>Player Achievement Card</DialogTitle>
          <p>This modal displays player statistics in a shareable card format.</p>
        </div>
        
        <div className="p-0 flex flex-col h-full max-h-[90vh]">
          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-900/50">
            <div 
              ref={cardRef}
              className={`relative w-80 aspect-[4/5] rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-500 ${
                activeTheme === 'dark' ? 'bg-slate-950 border border-slate-800' :
                activeTheme === 'light' ? 'bg-white border border-slate-200' :
                activeTheme === 'orange' ? 'bg-amber-500 border border-amber-600' :
                activeTheme === 'transparent' ? 'bg-transparent border-none shadow-none' :
                'bg-slate-900'
              }`}
            >
              {/* Glass Background Image */}
              {activeTheme === 'glass' && (
                <div className="absolute inset-0">
                  <img 
                    src="/images/padel-bg.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-60 scale-110 blur-[2px]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
                </div>
              )}

              {/* Theme specific overlays */}
              {activeTheme === 'dark' && (
                <>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px]" />
                </>
              )}

              {/* Content Layout (Strava Style) */}
              <div className={`relative z-10 h-full w-full p-8 flex flex-col ${
                activeTheme === 'transparent' ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : ''
              }`}>
                {/* Top: Branding */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${activeTheme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                      activeTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      Padel Livescore
                    </span>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                    activeTheme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/60'
                  }`}>
                    {isGlobal ? 'Global Ranking' : 'Tournament Stats'}
                  </div>
                </div>

                {/* Middle: Player Identity */}
                <div className="flex flex-col mb-12">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className={`w-4 h-4 ${activeTheme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span className={`text-[12px] font-bold uppercase tracking-widest ${
                      activeTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                    }`}>
                      Elite Competitor
                    </span>
                  </div>
                  <h3 className={`text-4xl font-black italic uppercase tracking-tighter leading-none mb-1 ${
                    activeTheme === 'light' ? 'text-slate-950' : 'text-white'
                  }`}>
                    {player.name}
                  </h3>
                </div>

                {/* Main Stats: The "Strava" Big Number Look */}
                <div className="grid grid-cols-2 gap-y-10 gap-x-4 mb-10">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      activeTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                    }`}>
                      Total Points
                    </span>
                    <span className={`text-4xl font-black italic tabular-nums leading-none ${
                      activeTheme === 'light' ? 'text-slate-950' : 
                      activeTheme === 'orange' ? 'text-slate-950' : 'text-amber-400'
                    }`}>
                      {points}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      activeTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                    }`}>
                      Win Rate
                    </span>
                    <span className={`text-4xl font-black italic tabular-nums leading-none ${
                      activeTheme === 'light' ? 'text-slate-950' : 'text-white'
                    }`}>
                      {winRate}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      activeTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                    }`}>
                      Matches
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-black italic tabular-nums leading-none ${
                        activeTheme === 'light' ? 'text-slate-950' : 'text-white'
                      }`}>
                        {played}
                      </span>
                      <span className={`text-[10px] font-bold ${activeTheme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                        ({won}W)
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                      activeTheme === 'light' ? 'text-slate-500' : 'text-white/50'
                    }`}>
                      Game Diff
                    </span>
                    <span className={`text-2xl font-black italic tabular-nums leading-none ${
                      diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : activeTheme === 'light' ? 'text-slate-400' : 'text-white/40'
                    }`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </div>
                </div>

                {/* Footer: Date & Tagline */}
                <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className={`text-[8px] font-bold uppercase tracking-widest mb-0.5 ${
                      activeTheme === 'light' ? 'text-slate-400' : 'text-white/30'
                    }`}>
                      Achieved on
                    </p>
                    <p className={`text-[10px] font-black uppercase ${
                      activeTheme === 'light' ? 'text-slate-600' : 'text-white/70'
                    }`}>
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <CircleDot className={`w-3 h-3 ${activeTheme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
                    <span className={`text-[8px] font-black uppercase italic ${
                      activeTheme === 'light' ? 'text-slate-950' : 'text-white'
                    }`}>
                      Unstoppable
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Selector (Strava Style) */}
          <div className="p-6 bg-slate-950 border-t border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest text-center">
              Choose Style
            </p>
            <div className="flex items-center justify-center gap-4 mb-8">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`relative w-12 h-12 rounded-xl transition-all duration-300 overflow-hidden border-2 ${
                    activeTheme === theme.id ? 'border-amber-500 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-slate-800'
                  }`}
                >
                  <div className={`absolute inset-0 ${theme.id === 'glass' ? 'bg-slate-700' : theme.id === 'transparent' ? 'bg-slate-900 border border-slate-800' : theme.class}`} />
                  {theme.id === 'glass' && (
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-orange-500/40" />
                  )}
                  {theme.id === 'transparent' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border border-dashed border-slate-500 rounded-md" />
                    </div>
                  )}
                  {activeTheme === theme.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 rounded-2xl h-12"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2 font-bold rounded-2xl h-12 shadow-lg shadow-amber-900/20"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Share Story
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
