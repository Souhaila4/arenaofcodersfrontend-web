"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PlatformNavbar from "../../../components/PlatformNavbar";
import { getCompetitionById, joinCompetition, getMyParticipation, getToken, type Competition } from "../../../lib/api";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop";

export default function CompetitionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const comp = await getCompetitionById(id);
        setCompetition(comp);
        
        if (getToken()) {
          const participation = await getMyParticipation(id);
          if (participation) setIsJoined(true);
        }
      } catch (err: any) {
        setError(err.message || "Impossible de charger les détails.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleJoin = async () => {
    if (!getToken()) {
      router.push("/signin");
      return;
    }
    setJoining(true);
    try {
      await joinCompetition(id);
      setIsJoined(true);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'inscription.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
        <PlatformNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex flex-col">
        <PlatformNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Erreur</h2>
          <p className="text-white/60 mb-6">{error || "Hackathon introuvable."}</p>
          <Link href="/hackathon" className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">Retour à la liste</Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const isRunning = competition.status === "RUNNING";

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col font-sans">
      <PlatformNavbar />
      
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <Image 
          src={DEFAULT_IMAGE} 
          alt={competition.title} 
          fill 
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex gap-3">
              {competition.specialty && (
                <span className="px-3 py-1 bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest rounded">
                  {competition.specialty}
                </span>
              )}
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest rounded border border-white/10">
                {competition.difficulty}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">{competition.title}</h1>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-6xl mx-auto w-full p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left: Description & Details */}
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-black italic uppercase text-cyan-400 tracking-widest">Description du Challenge</h2>
            <p className="text-white/80 leading-relaxed text-lg font-light whitespace-pre-wrap">
              {competition.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoCard icon="📅" label="Début" value={startDate.toLocaleString('fr-FR')} />
            <InfoCard icon="🏁" label="Fin" value={endDate.toLocaleString('fr-FR')} />
            <InfoCard icon="🏆" label="Récompenses" value={competition.rewardPool > 0 ? `${competition.rewardPool.toLocaleString()} XC / €` : "Gloire & Honneur"} />
            <InfoCard icon="👥" label="Participants Max" value={competition.maxParticipants?.toString() || "Illimité"} />
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Règles & Conditions</h3>
            <ul className="space-y-3 text-sm text-white/60 list-disc pl-5">
              <li>Le travail doit être soumis via un lien GitHub valide.</li>
              <li>Le respect de la spécialité ({competition.specialty}) est obligatoire.</li>
              <li>{competition.antiCheatEnabled ? "L'anti-triche par IA est activé sur ce hackathon." : "Fair play exigé."}</li>
              <li>Une seule participation par utilisateur.</li>
            </ul>
          </div>
        </div>

        {/* Right: Actions sidebar */}
        <div className="space-y-6">
          <div className="sticky top-24 p-8 rounded-3xl bg-[#1a1f26] border border-white/10 shadow-2xl space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Statut actuel</p>
              <p className="text-xl font-bold text-white uppercase italic">{isJoined ? "Inscrit ✅" : "Non Inscrit"}</p>
            </div>

            <div className="h-px bg-white/5" />

            {isJoined ? (
              <div className="space-y-6">
                <p className="text-sm text-white/60 leading-relaxed font-light italic">
                  {isRunning 
                    ? "Le hackathon est en cours ! Rejoignez votre équipe dans la salle dédiée."
                    : "Vous êtes bien inscrit. La salle s'ouvrira automatiquement au démarrage de l'événement."}
                </p>
                {isRunning ? (
                  <Link 
                    href={`/hackathon/room-${competition.specialty}`}
                    className="block w-full bg-cyan-500 hover:bg-cyan-400 text-black p-4 rounded-2xl font-black uppercase tracking-[0.2em] text-center transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
                  >
                    Rejoindre la salle 🔥
                  </Link>
                ) : (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Compte à rebours</p>
                    <p className="text-lg font-mono text-cyan-400 mt-1">EN ATTENTE...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-white/60 leading-relaxed font-light">
                  Prêt à relever le défi ? Inscrivez-vous pour sécuriser votre place et accéder à la salle de collaboration.
                </p>
                <button
                  onClick={handleJoin}
                  disabled={joining || competition.status !== "OPEN_FOR_ENTRY"}
                  className="block w-full bg-cyan-500 hover:bg-cyan-400 text-black p-4 rounded-2xl font-black uppercase tracking-[0.2em] text-center transition-all shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  {joining ? "Inscription..." : competition.status === "OPEN_FOR_ENTRY" ? "S'inscrire Maintenant" : "Inscriptions Fermées"}
                </button>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
              <span>Réf ID: {competition.id.slice(0,8)}</span>
              <span>v1.0.2</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
