import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Users, Award, ExternalLink, RefreshCw, 
  Send, Plus, FileText, ArrowLeft, Brain, Sparkles, Check, CheckCircle, 
  AlertTriangle, ShieldCheck, LogOut, ChevronRight, Info, PlusCircle, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { connectClassroom, getCachedClassroomToken, auth } from '../services/firebase';
import { MainViewType } from '../types';

interface Course {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
}

interface CourseWork {
  id: string;
  title: string;
  description?: string;
  creationTime: string;
  alternateLink?: string;
}

interface Announcement {
  id: string;
  text: string;
  creationTime: string;
  alternateLink?: string;
}

interface GoogleClassroomHubProps {
  setMainView: (view: MainViewType) => void;
  onImportText?: (text: string, destination: 'dyslexia' | 'learning' | 'phonetic') => void;
}

export default function GoogleClassroomHub({ setMainView, onImportText }: GoogleClassroomHubProps) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseWorks, setCourseWorks] = useState<CourseWork[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info' | null; text: string }>({ type: null, text: '' });
  
  // Tab within the course detail view
  const [courseTab, setCourseTab] = useState<'announcements' | 'coursework' | 'publish'>('announcements');

  // Publish form states
  const [publishType, setPublishType] = useState<'announcement' | 'material'>('announcement');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishText, setPublishText] = useState('');
  const [publishLink, setPublishLink] = useState('');

  useEffect(() => {
    const cachedToken = getCachedClassroomToken();
    if (cachedToken) {
      setToken(cachedToken);
      setUserEmail(auth.currentUser?.email || null);
      fetchCourses(cachedToken);
    }
  }, []);

  const fetchCourses = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setToken(null);
          throw new Error("Session Google Classroom expirée. Veuillez vous reconnecter.");
        }
        throw new Error(`Impossible de récupérer vos cours (${res.status})`);
      }
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      console.error("Error loading Classroom courses:", err);
      setError(err.message || "Erreur de chargement des cours.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeToken = await connectClassroom();
      if (activeToken) {
        setToken(activeToken);
        setUserEmail(auth.currentUser?.email || null);
        fetchCourses(activeToken);
      }
    } catch (err: any) {
      console.error("Classroom authentication error:", err);
      setError("Échec de l'authentification avec Google Classroom.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setUserEmail(null);
    setCourses([]);
    setSelectedCourse(null);
    setCourseWorks([]);
    setAnnouncements([]);
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setCourseTab('announcements');
    if (token) {
      fetchCourseDetails(course.id, token);
    }
  };

  const fetchCourseDetails = async (courseId: string, accessToken: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch CourseWork
      const cwRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const cwData = cwRes.ok ? await cwRes.json() : {};
      setCourseWorks(cwData.courseWork || []);

      // 2. Fetch Announcements
      const annRes = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const annData = annRes.ok ? await annRes.json() : {};
      setAnnouncements(annData.announcements || []);
    } catch (err) {
      console.error("Error loading course details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourse) return;
    if (!publishText.trim()) {
      setStatusMsg({ type: 'error', text: 'Veuillez rédiger un texte avant de publier.' });
      return;
    }

    setIsLoading(true);
    setStatusMsg({ type: 'info', text: 'Publication en cours...' });

    try {
      if (publishType === 'announcement') {
        const res = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse.id}/announcements`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: publishText
          })
        });

        if (!res.ok) throw new Error(`Erreur lors de la publication de l'annonce (${res.status})`);
        
        setStatusMsg({ type: 'success', text: 'Annonce publiée avec succès sur Google Classroom !' });
      } else {
        const res = await fetch(`https://classroom.googleapis.com/v1/courses/${selectedCourse.id}/courseWorkMaterials`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: publishTitle || "Ressource Mount AI",
            description: publishText,
            materials: publishLink ? [{ link: { url: publishLink } }] : [],
            state: "PUBLISHED"
          })
        });

        if (!res.ok) throw new Error(`Erreur lors de la création du matériel de cours (${res.status})`);
        
        setStatusMsg({ type: 'success', text: 'Matériel pédagogique publié avec succès sur Google Classroom !' });
      }

      // Reset form
      setPublishTitle('');
      setPublishText('');
      setPublishLink('');
      
      // Refresh details
      fetchCourseDetails(selectedCourse.id, token);
    } catch (err: any) {
      console.error("Publishing error:", err);
      setStatusMsg({ type: 'error', text: err.message || "Échec de l'envoi vers Google Classroom." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = (text: string, dest: 'dyslexia' | 'learning' | 'phonetic') => {
    if (onImportText) {
      onImportText(text, dest);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (selectedCourse) {
                  setSelectedCourse(null);
                } else {
                  setMainView('hub');
                }
              }}
              className="p-2 glass-panel rounded-full hover:bg-white/10 transition-colors shadow-lg mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div className="p-3 bg-[#4285F4]/10 rounded-2xl border border-[#4285F4]/30">
              <BookOpen className="w-6 h-6 text-[#4285F4]" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                Connecteur <span className="text-[#4285F4]">Google Classroom</span>
              </h2>
              <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest mt-1">
                {selectedCourse ? `Classe active : ${selectedCourse.name}` : "L'intégration ultime avec vos espaces scolaires Google"}
              </p>
            </div>
          </div>
        </div>

        {/* CONNECTION STATUS & LOGOUT */}
        {token && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-left font-mono">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Utilisateur connecté</p>
              <p className="text-xs text-emerald-300 font-bold">{userEmail}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="ml-2 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors"
              title="Se déconnecter de Classroom"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between gap-3 animate-in slide-in-from-top-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : statusMsg.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
          <button 
            onClick={() => setStatusMsg({ type: null, text: '' })}
            className="text-[10px] uppercase font-bold hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl font-mono flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* BEFORE CONNECTION VIEW */}
      {!token ? (
        <div className="max-w-xl mx-auto p-10 bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-[#4285F4]/10 border border-[#4285F4]/30 flex items-center justify-center shadow-lg shadow-[#4285F4]/10">
            <BookOpen className="w-10 h-10 text-[#4285F4]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Activez votre flux académique</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connectez en toute sécurité votre compte scolaire pour synchroniser les cours, de devoirs, et publier des documents adaptés pour la dyslexie et l'apprentissage cognitif.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 transition-all font-mono text-sm tracking-wider uppercase active:scale-[0.98] disabled:opacity-40"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Se connecter à Google Classroom
          </button>
          <div className="pt-4 border-t border-white/5 w-full text-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Privacy by design — Aucune donnée d'évaluation n'est enregistrée hors de votre Cloud
            </span>
          </div>
        </div>
      ) : (
        /* AFTER CONNECTION: MAIN LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDE: COURSES DIRECTORY */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6 bg-[#121626]/40">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4285F4]" /> Vos Salles de Classes
                </h3>
                <button
                  onClick={() => fetchCourses(token)}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg bg-slate-950 border border-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoading && courses.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-[#4285F4] animate-spin" />
                  <span className="text-xs font-mono text-slate-400">Chargement des cours...</span>
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {courses.map((course) => {
                    const isSelected = selectedCourse?.id === course.id;
                    return (
                      <button
                        key={course.id}
                        onClick={() => selectCourse(course)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 group ${
                          isSelected
                            ? 'bg-[#4285F4]/15 border-[#4285F4] text-white shadow-lg'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-[#4285F4]/40 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-black text-sm truncate font-sans ${isSelected ? 'text-[#4285F4]' : 'text-slate-200'}`}>
                            {course.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            {course.section || 'Général'}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-[#4285F4]' : 'text-slate-600'}`} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl">
                  Aucun cours actif détecté.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: SELECTED COURSE CONTROLS */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedCourse ? (
                <motion.div
                  key={selectedCourse.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 bg-[#121626]/40 space-y-6">
                    
                    {/* COURSE BANNER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                      <div>
                        <span className="px-2.5 py-0.5 bg-[#4285F4]/10 border border-[#4285F4]/30 rounded text-[9px] font-mono text-blue-400 font-bold tracking-widest uppercase">
                          Sujet actif
                        </span>
                        <h3 className="text-2xl font-black text-white mt-1.5">{selectedCourse.name}</h3>
                        <p className="text-xs text-slate-400 font-medium font-sans">
                          {selectedCourse.descriptionHeading || "Pas de description additionnelle."}
                        </p>
                      </div>

                      {selectedCourse.alternateLink && (
                        <a
                          href={selectedCourse.alternateLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl text-[10px] font-mono font-bold transition-all self-start sm:self-auto"
                        >
                          Ouvrir Classroom <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* SUB-TABS SELECTOR */}
                    <div className="flex border-b border-white/5 pb-1 gap-6">
                      {[
                        { id: 'announcements', label: 'Annonces de classe' },
                        { id: 'coursework', label: 'Devoirs & Travaux' },
                        { id: 'publish', label: 'Publier du contenu' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCourseTab(t.id as any)}
                          className={`pb-3 text-xs font-black uppercase tracking-wider font-mono transition-all border-b-2 ${
                            courseTab === t.id
                              ? 'border-[#4285F4] text-white'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* DETAILED TAB VIEWS */}
                    {isLoading && (
                      <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 text-[#4285F4] animate-spin" />
                        <span className="text-xs font-mono text-slate-400">Récupération des éléments...</span>
                      </div>
                    )}

                    {!isLoading && courseTab === 'announcements' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {announcements.length > 0 ? (
                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {announcements.map((ann) => (
                              <div
                                key={ann.id}
                                className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3 hover:bg-slate-950 transition-all group relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#4285F4]/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start">
                                  <span className="text-[9px] font-mono text-slate-500">
                                    Publié le {new Date(ann.creationTime).toLocaleDateString()}
                                  </span>
                                  {ann.alternateLink && (
                                    <a href={ann.alternateLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#4285F4] transition-colors">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                                  {ann.text}
                                </p>
                                
                                {/* INTERACTIVE IMPORT CONTROLS */}
                                <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2.5">
                                  <button
                                    onClick={() => handleImportClick(ann.text, 'phonetic')}
                                    className="px-3 py-1.5 bg-[#4285F4]/10 border border-[#4285F4]/20 hover:bg-[#4285F4] hover:text-slate-950 text-xs font-bold text-blue-400 rounded-xl transition-all flex items-center gap-1.5"
                                    title="Corriger l'orthographe phonétiquement"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" /> Corriger (Phonétique)
                                  </button>
                                  <button
                                    onClick={() => handleImportClick(ann.text, 'learning')}
                                    className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500 text-xs font-bold text-violet-400 hover:text-white rounded-xl transition-all flex items-center gap-1.5"
                                    title="Résumer et créer des questions scolaires"
                                  >
                                    <Brain className="w-3.5 h-3.5" /> Résumer / Évaluer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl">
                            Aucune annonce de cours trouvée.
                          </div>
                        )}
                      </div>
                    )}

                    {!isLoading && courseTab === 'coursework' && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {courseWorks.length > 0 ? (
                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                            {courseWorks.map((work) => (
                              <div
                                key={work.id}
                                className="p-5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3 hover:bg-slate-950 transition-all group relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-md font-sans">
                                      {work.title}
                                    </h4>
                                    <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                                      Créé le {new Date(work.creationTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {work.alternateLink && (
                                    <a href={work.alternateLink} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#4285F4] transition-colors">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                
                                {work.description && (
                                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                                    {work.description}
                                  </p>
                                )}

                                {/* INTERACTIVE IMPORT CONTROLS */}
                                <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2.5">
                                  <button
                                    onClick={() => handleImportClick(work.description || work.title, 'phonetic')}
                                    className="px-3 py-1.5 bg-[#4285F4]/10 border border-[#4285F4]/20 hover:bg-[#4285F4] hover:text-slate-950 text-xs font-bold text-blue-400 rounded-xl transition-all flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" /> Corriger l'orthographe
                                  </button>
                                  <button
                                    onClick={() => handleImportClick(work.description || work.title, 'learning')}
                                    className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500 text-xs font-bold text-violet-400 hover:text-white rounded-xl transition-all flex items-center gap-1.5"
                                  >
                                    <Brain className="w-3.5 h-3.5" /> Résumer / Évaluer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl">
                            Aucun devoir assigné sur ce cours.
                          </div>
                        )}
                      </div>
                    )}

                    {!isLoading && courseTab === 'publish' && (
                      <form onSubmit={handlePublish} className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Type de publication :</label>
                            <div className="flex bg-slate-950 border border-white/5 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setPublishType('announcement')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
                                  publishType === 'announcement'
                                    ? 'bg-[#4285F4] text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Annonce
                              </button>
                              <button
                                type="button"
                                onClick={() => setPublishType('material')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
                                  publishType === 'material'
                                    ? 'bg-[#4285F4] text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Matériel / Cours
                              </button>
                            </div>
                          </div>
                          
                          {publishType === 'material' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Titre du matériel :</label>
                              <input
                                type="text"
                                value={publishTitle}
                                onChange={(e) => setPublishTitle(e.target.value)}
                                placeholder="Sujet, Lexique de cours..."
                                className="w-full bg-[#0b0e17] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#4285F4]/40 transition-all font-sans font-medium"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Contenu textuel :</label>
                          <textarea
                            rows={5}
                            value={publishText}
                            onChange={(e) => setPublishText(e.target.value)}
                            placeholder={publishType === 'announcement' 
                              ? "Publier une consigne, une correction phonétique ou un mot d'encouragement..."
                              : "Décrire le matériel pédagogique, y copier les questions de révision générées par Gemini..."
                            }
                            className="w-full bg-[#0b0e17] border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-[#4285F4]/40 transition-all font-mono resize-none leading-relaxed"
                          />
                        </div>

                        {publishType === 'material' && (
                          <div className="space-y-1.5 animate-in slide-in-from-top-2">
                            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Lien de document externe (Optionnel) :</label>
                            <input
                              type="url"
                              value={publishLink}
                              onChange={(e) => setPublishLink(e.target.value)}
                              placeholder="https://votre-drive-ou-lien.com"
                              className="w-full bg-[#0b0e17] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-[#4285F4]/40 transition-all font-mono"
                            />
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading || !publishText.trim()}
                            className="px-6 py-3 rounded-xl bg-[#4285F4] hover:bg-blue-400 disabled:opacity-40 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-[#4285F4]/10"
                          >
                            <Send className="w-4 h-4 text-slate-950" />
                            Publier sur Classroom
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                </motion.div>
              ) : (
                /* EMPTY STATE: SELECT A COURSE */
                <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-[2.5rem] text-center space-y-4 min-h-[300px]">
                  <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-slate-600">
                    <Info className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Aucune Classe Sélectionnée</h4>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      Veuillez sélectionner l'une de vos salles de classe actives dans le répertoire de gauche pour explorer son flux d'apprentissage.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

    </div>
  );
}
