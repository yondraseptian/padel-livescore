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
  rank?: number;
}

type Theme = 'dark' | 'light' | 'brand' | 'teal' | 'transparent';

export function PlayerCardModal({ player, isOpen, onClose, isGlobal = true, rank }: PlayerCardModalProps) {
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

  const themes: { id: Theme; name: string; previewClass: string }[] = [
    { id: 'dark',        name: 'Brand Dark',   previewClass: 'bg-[#282c90]' },
    { id: 'light',       name: 'Minimalist',   previewClass: 'bg-[#fefefe]' },
    { id: 'brand',       name: 'Brand Blue',   previewClass: 'bg-gradient-to-br from-[#282c90] to-[#48c4c4]' },
    { id: 'teal',        name: 'Brand Teal',   previewClass: 'bg-[#48c4c4]' },
    { id: 'transparent', name: 'Text Only',    previewClass: 'bg-slate-900 border border-dashed border-slate-600' },
  ];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      setDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!cardRef.current) throw new Error('Card element not found');

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        skipFonts: false,
      });
      
      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Generated image is invalid');
      }

      const link = document.createElement('a');
      link.download = `padel-stats-${player.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('Download error details:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      alert('Gagal mengunduh gambar. Pastikan semua gambar profil sudah termuat dengan benar.');
    } finally {
      setDownloading(false);
    }
  };

  // Theme-derived helpers
  const isLight = activeTheme === 'light';
  const isTeal  = activeTheme === 'teal';
  const isTransparent = activeTheme === 'transparent';

  const accentText   = isLight ? 'text-[#282c90]' : isTeal ? 'text-[#282c90]' : 'text-[#48c4c4]';
  const primaryText  = isLight ? 'text-[#282c90]' : 'text-[#fefefe]';
  const mutedText    = isLight ? 'text-[#282c90]/50' : 'text-[#fefefe]/40';
  const veryMuted    = isLight ? 'text-[#282c90]/40' : 'text-[#fefefe]/30';
  const accentBar    = isLight ? 'bg-[#282c90]' : isTeal ? 'bg-[#282c90]' : 'bg-[#48c4c4]';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md bg-[#1a1e6e] border-[#282c90] p-0 overflow-hidden rounded-none sm:rounded-[2rem] mx-0 sm:mx-auto" aria-describedby={undefined}>
        {/* Hidden titles for accessibility */}
        <div className="sr-only">
          <DialogTitle>Player Achievement Card</DialogTitle>
          <p>This modal displays player statistics in a shareable card format.</p>
        </div>
        
        <div className="p-0 flex flex-col h-full max-h-[90dvh]">
          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col items-center justify-center bg-[#282c90]/30">
            <div 
              ref={cardRef}
              className={`relative w-full max-w-[400px] aspect-[1.1/1] rounded-[1.2rem] sm:rounded-[1.5rem] shadow-2xl overflow-hidden transition-all duration-500 border-2 ${
                activeTheme === 'dark'        ? 'bg-[#282c90] border-[#48c4c4]/30' :
                activeTheme === 'light'       ? 'bg-[#fefefe] border-[#282c90]/20' :
                activeTheme === 'brand'       ? 'bg-[#282c90] border-[#48c4c4]/50' :
                activeTheme === 'teal'        ? 'bg-[#48c4c4] border-[#282c90]/30' :
                'bg-transparent border-none shadow-none'
              }`}
            >
              {/* Background Layer */}
              {activeTheme !== 'transparent' && (
                <div className="absolute inset-0">
                  <div className={`absolute inset-0 ${
                    activeTheme === 'dark'  ? 'bg-gradient-to-br from-[#282c90] via-[#1e2275] to-[#282c90]' :
                    activeTheme === 'light' ? 'bg-gradient-to-br from-[#fefefe] via-[#f0f4ff] to-[#e8eeff]' :
                    activeTheme === 'brand' ? 'bg-gradient-to-br from-[#282c90] via-[#1e2275] to-[#48c4c4]' :
                    /* teal */                'bg-gradient-to-br from-[#48c4c4] via-[#3bb8b8] to-[#282c90]'
                  }`} />
                  {/* Subtle teal glow accent top-right */}
                  {(activeTheme === 'dark' || activeTheme === 'brand') && (
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#48c4c4]/10 blur-3xl" />
                  )}
                </div>
              )}

              {/* Content Layout */}
              <div className={`relative z-10 h-full w-full flex flex-col p-4 sm:p-6 ${
                isTransparent ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : ''
              }`}>
                {/* Top: Branding & Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src="/logo/logo.png" alt="Logo" className="w-20 h-auto drop-shadow-sm" />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest ${
                      isLight ? 'bg-[#282c90]/10 text-[#282c90]/60' : 'bg-[#fefefe]/10 text-[#fefefe]/60'
                    }`}>
                      {isGlobal ? 'Global Ranking' : 'Tournament Standing'}
                    </div>
                    <span className={`text-2xl font-black italic ${accentText}`}>
                      #{rank || (player as any).rank || 1}
                    </span>
                  </div>
                </div>

                {/* Player Identity */}
                <div className="mb-4">
                  <h3 className={`text-4xl font-black italic uppercase tracking-tighter leading-tight ${primaryText} ${
                    isTransparent ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,1)]' : ''
                  }`}>
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`h-1 w-12 rounded-full ${accentBar}`} />
                    <span className={`text-[11px] font-bold uppercase tracking-[0.3em] opacity-60 ${primaryText}`}>
                      Pro Player
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-4">
                  <div className={`flex flex-col ${isTransparent ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,1)]' : ''}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${mutedText}`}>Ranking Points</span>
                    <span className={`text-5xl font-black italic tabular-nums leading-none ${accentText}`}>{points}</span>
                  </div>
                  <div className={`flex flex-col ${isTransparent ? 'drop-shadow-[0_2px_8px_rgba(0,0,0,1)]' : ''}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${mutedText}`}>Performance Rate</span>
                    <span className={`text-5xl font-black italic tabular-nums leading-none ${primaryText}`}>{winRate}%</span>
                  </div>
                  
                  <div className={`col-span-2 grid grid-cols-3 gap-2 py-3 border-y mt-2 ${
                    isLight ? 'border-[#282c90]/10' : 'border-[#fefefe]/10'
                  }`}>
                    <div className={`flex flex-col ${isTransparent ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : ''}`}>
                      <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${veryMuted}`}>Record</span>
                      <span className={`text-2xl font-black italic tabular-nums leading-none ${primaryText}`}>
                        {won}W - {(played ?? 0) - (won ?? 0)}L
                      </span>
                    </div>
                    <div className={`flex flex-col ${isTransparent ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : ''}`}>
                      <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${veryMuted}`}>Total Matches</span>
                      <span className={`text-2xl font-black italic tabular-nums leading-none ${primaryText}`}>
                        {played}
                      </span>
                    </div>
                    <div className={`flex flex-col ${isTransparent ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)]' : ''}`}>
                      <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${veryMuted}`}>Game Diff</span>
                      <span className={`text-2xl font-black italic tabular-nums leading-none ${
                        diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : mutedText
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="p-4 sm:p-6 bg-[#1a1e6e] border-t border-[#282c90]">
            <p className="text-[10px] font-bold uppercase text-[#48c4c4]/60 mb-4 tracking-widest text-center">
              Choose Style
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`relative w-12 h-12 rounded-xl transition-all duration-300 overflow-hidden border-2 ${
                    activeTheme === theme.id
                      ? 'border-[#48c4c4] scale-110 shadow-[0_0_15px_rgba(72,196,196,0.35)]'
                      : 'border-[#282c90]'
                  }`}
                >
                  <div className={`absolute inset-0 ${theme.previewClass}`} />
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
                className="flex-1 bg-[#282c90]/50 border-[#48c4c4]/30 text-[#fefefe] hover:bg-[#282c90] rounded-2xl h-12"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-[#48c4c4] hover:bg-[#3bb8b8] text-[#282c90] gap-2 font-bold rounded-2xl h-12 shadow-lg shadow-[#48c4c4]/20"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <div className="w-5 h-5 border-2 border-[#282c90]/30 border-t-[#282c90] rounded-full animate-spin" />
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
