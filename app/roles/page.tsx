'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, Users, Clock, Trophy, Shield } from 'lucide-react';

const rules = [
  {
    category: 'Dasar Permainan',
    icon: BookOpen,
    rules: [
      {
        title: 'Format Pertandingan',
        description: 'Padel dimainkan dalam format double (2v2). Setiap tim terdiri dari 2 pemain yang bermain di lapangan bersama.'
      },
      {
        title: 'Ukuran Lapangan',
        description: 'Lapangan padel berukuran 20m x 10m, setengah dari ukuran lapangan tenis. Lapangan dikelilingi dinding kaca dan tembok yang menjadi bagian dari bermain.'
      },
      {
        title: 'Poin dan Skor',
        description: 'Urutan Poin: 0, 15, 30, 40, Game.Penentuan Pemenang Game: Jika skor mencapai 40-40, poin berikutnya langsung menentukan pemenang game tersebut (penerima servis berhak memilih sisi lapangan servis). Tidak ada deuce atau advantage.'
      }
    ]
  },
  {
    category: 'Servis dan Permainan',
    icon: Clock,
    rules: [
      {
        title: 'Servis',
        description: 'Servis dilakukan dengan underhand (tangan di bawah pinggang). Bola harus dipukul di bawah tinggi pinggang pemain yang melayani.'
      },
      {
        title: 'Bounce Servis',
        description: 'Servis harus bounce di kotak servis diagonal. Jika servis keluar atau tidak bounce di kotak yang tepat, dianggap fault. Dua fault berturut-turut = poin untuk lawan.'
      },
      {
        title: 'Rally dan Pengembalian',
        description: 'Bola harus dikembalikan sebelum memantul dua kali di lapangan. Pemain dapat menggunakan dinding dan kaca sebagai bagian dari permainan setelah pukulan pertama mereka.'
      }
    ]
  },
  {
    category: 'Dinding dan Kaca',
    icon: Shield,
    rules: [
      {
        title: 'Penggunaan Dinding',
        description: 'Bola yang menyentuh dinding atau kaca bagian belakang lapangan masih dianggap dalam permainan jika belum memantul dua kali di lapangan.'
      },
      {
        title: 'Bola di Dinding Samping',
        description: 'Jika bola menyentuh dinding samping dan kembali ke dalam lapangan, permainan berlanjut. Bola tidak perlu kembali melewati net.'
      },
      {
        title: 'Service Box Dinding',
        description: 'Servis yang menyentuh dinding di area servis bagian belakang dianggap as a let dan dapat diulang, bukan fault.'
      }
    ]
  },
  {
    category: 'Perilaku Pemain',
    icon: Users,
    rules: [
      {
        title: 'Fair Play',
        description: 'Semua pemain harus menunjukkan sportivitas tinggi. Bisikan, intimidasi, dan perilaku tidak profesional tidak diperbolehkan.'
      },
      {
        title: 'Keselamatan',
        description: 'Pemain harus selalu waspada terhadap keselamatan lawan. Jangan mengarahkan bola ke pemain lain dengan niat melukai.'
      },
      {
        title: 'Kerja Sama Tim',
        description: 'Komunikasi yang baik dengan partner sangat penting. Koordinasi gerakan dan strategi dengan jelas selama permainan.'
      }
    ]
  },
  {
    category: 'Pelanggaran dan Hukuman',
    icon: AlertCircle,
    rules: [
      {
        title: 'Code Violation',
        description: 'Perilaku tidak profesional seperti melempar raket, mengucapkan kata kasar, atau mengganggu lawan dapat mengakibatkan hukuman poin.'
      },
      {
        title: 'Tiebreak',
        description: 'Jika skor mencapai 6-6 dalam sebuah set, dimainkan tiebreak (first to 7 points, dengan selisih minimal 2 poin).'
      },
      {
        title: 'Keterlambatan',
        description: 'Pemain yang terlambat lebih dari 10 menit dianggap forfeit (kalah tanpa bermain). Istirahat antar set maksimal 90 detik.'
      }
    ]
  },
  {
    category: 'Pemenang dan Ranking',
    icon: Trophy,
    rules: [
      {
        title: 'Format Perlombaan',
        description: 'Pertandingan biasanya best of 3 sets (first to win 2 sets). Set ketiga jika diperlukan bisa diformat tiebreak tersendiri atau match tiebreak.'
      },
      {
        title: 'Sistem Ranking',
        description: 'Ranking didasarkan pada performa dalam turnamen. Pemain mendapatkan poin berdasarkan posisi akhir dan lawan yang dikalahkan.'
      },
      {
        title: 'Tie in Ranking',
        description: 'Jika ada tie di ranking, head-to-head record digunakan sebagai tiebreaker pertama.'
      }
    ]
  }
];

export default function AturanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Header />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Aturan Permainan Padel</h1>
          <p className="text-slate-300 text-lg">
            Pelajari semua aturan dan regulasi untuk memastikan Anda bermain dengan benar dan fair.
          </p>
        </div>

        {/* Rules Grid */}
        <div className="space-y-8">
          {rules.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <Card key={index} className="bg-slate-900 border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <IconComponent className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{section.category}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.rules.map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="pb-4 border-b border-slate-700 last:border-b-0 md:last:border-b-0">
                        <h3 className="text-lg font-semibold text-amber-400 mb-2">{rule.title}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Important Notes */}
        <Card className="mt-12 bg-amber-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Catatan Penting
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-3">
            <p>
              • Semua pemain harus mematuhi peraturan yang berlaku di turnamen ini.
            </p>
            <p>
              • Arbitrase final atas setiap keputusan berada di tangan officials/referee yang ditunjuk.
            </p>
            <p>
              • Pemain yang melakukan pelanggaran serius dapat didiskualifikasi dari turnamen.
            </p>
            <p>
              • Untuk pertanyaan lebih lanjut tentang aturan, silahkan hubungi official tournament organizer.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
