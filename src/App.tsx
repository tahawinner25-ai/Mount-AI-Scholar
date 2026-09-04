import React, { useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowUpRight, Bell, BookOpen, Brain, Check, ChevronRight, Clock3,
  FileText, Flame, Hash, Headphones, Heart, LayoutDashboard, Lightbulb,
  Link2, Lock, MessageCircle, MoreHorizontal, Paperclip, Play, Plus,
  Search, Send, Sparkles, Target, Trophy, Upload, Users, X, Zap,
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff, Maximize2, Wifi,
  UsersRound, ScreenShare, Circle
} from 'lucide-react';

const nav = [
  { id: 'home', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'learn', label: 'Mon apprentissage', icon: BookOpen },
  { id: 'community', label: 'Communauté', icon: Users },
  { id: 'live', label: 'Salle d’étude live', icon: Video },
  { id: 'challenges', label: 'Défis & compétitions', icon: Trophy },
];

const feed = [
  { id: 1, name: 'Amine L.', initials: 'AL', color: 'coral', time: 'il y a 8 min', tag: '#Physique', text: 'Je viens de comprendre la différence entre un champ électrique et une force. Cette carte mentale m’a sauvé.', likes: 24, comments: 6, type: 'post' },
  { id: 2, name: 'Clara S.', initials: 'CS', color: 'purple', time: 'il y a 22 min', tag: '#Méthodo', text: 'Mon espace de révision pour le bac est enfin prêt. Qui veut faire le sprint de 25 minutes avec moi ?', likes: 41, comments: 12, type: 'post' },
];

const recommendations = [
  { source: 'YouTube', icon: '▶', color: 'red', title: 'La relativité expliquée en 12 minutes', meta: 'Science Étonnante · 12 min', thumb: 'gradient-red' },
  { source: 'Instagram', icon: '◎', color: 'pink', title: '5 méthodes pour retenir un cours dense', meta: 'Study with Léa · Carousel', thumb: 'gradient-pink' },
  { source: 'Spotify', icon: '◉', color: 'green', title: 'Focus Flow · Deep study', meta: 'Playlist · 2 h 14', thumb: 'gradient-green' },
];

const initialMessages = [
  { who: 'Léa', initials: 'LM', color: 'orange', text: 'Tu as avancé sur le projet de bio ?', time: '09:41' },
  { who: 'Moi', initials: 'TM', color: 'blue', text: 'Oui, je viens de finir la partie sur l’ADN. Je t’envoie ma mindmap ?', time: '09:43' },
  { who: 'Léa', initials: 'LM', color: 'orange', text: 'Carrément, et on se fait le quiz après 🔥', time: '09:44' },
];

function Avatar({ initials, color = 'blue', small = false }: { initials: string; color?: string; small?: boolean }) {
  return <div className={`avatar avatar-${color} ${small ? 'avatar-small' : ''}`}>{initials}</div>;
}

function StatCard({ icon: Icon, label, value, hint, color }: any) {
  return <div className="stat-card">
    <div className={`stat-icon stat-${color}`}><Icon size={18} /></div>
    <div><p>{label}</p><strong>{value}</strong><span className="stat-hint">{hint}</span></div>
  </div>;
}

export default function App() {
  const [active, setActive] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [chat, setChat] = useState(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [liked, setLiked] = useState<number[]>([]);
  const [file, setFile] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [search, setSearch] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [liveJoined, setLiveJoined] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const [liveMessages, setLiveMessages] = useState([
    { name: 'Léa', text: 'On commence par 25 min de focus ?', color: 'orange' },
    { name: 'Yanis', text: 'Oui, je partage mon écran avec le plan du projet.', color: 'green' },
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredFeed = useMemo(() => feed.filter((item) => !search || `${item.name} ${item.tag} ${item.text}`.toLowerCase().includes(search.toLowerCase())), [search]);

  const generate = () => { setIsGenerating(true); setTimeout(() => { setIsGenerating(false); setGenerated(true); }, 900); };
  const sendLiveMessage = () => { if (!liveMessage.trim()) return; setLiveMessages([...liveMessages, { name: 'Moi', text: liveMessage.trim(), color: 'blue' }]); setLiveMessage(''); };
  const joinLiveRoom = async () => {
    setLiveJoined(true);
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ video: true, audio: true });
      if (stream) setCameraOn(true);
    } catch {
      // The demo room remains usable when permissions are unavailable.
    }
  };
  const toggleSharing = async () => {
    if (sharing) { setSharing(false); return; }
    try {
      const displayStream = await navigator.mediaDevices?.getDisplayMedia({ video: true });
      if (displayStream) { setSharing(true); displayStream.getVideoTracks()[0]?.addEventListener('ended', () => setSharing(false)); }
    } catch {
      // Keep the live room usable when screen sharing is cancelled or unavailable.
    }
  };
  const leaveLiveRoom = () => { setLiveJoined(false); setCameraOn(false); setSharing(false); };
  const sendMessage = () => { if (!chatInput.trim()) return; setChat([...chat, { who: 'Moi', initials: 'TM', color: 'blue', text: chatInput.trim(), time: 'maintenant' }]); setChatInput(''); };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><span>mount<span className="brand-accent">.</span>ai</span></div>
      <div className="profile-mini"><Avatar initials="TM" color="blue" small /><div><strong>Thomas Martin</strong><span>Licence · Sciences</span></div><MoreHorizontal size={16} /></div>
      <p className="nav-label">ESPACE DE TRAVAIL</p>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(id)}><Icon size={18} /><span>{label}</span>{id === 'community' && <b className="nav-badge">3</b>}</button>)}</nav>
      <p className="nav-label nav-label-tools">OUTILS IA</p>
      <button className="nav-item" onClick={() => { setActive('learn'); setGenerated(false); }}><Brain size={18} /><span>Studio de synthèse</span><span className="new-pill">IA</span></button>
      <button className="nav-item" onClick={() => setActive('learn')}><Link2 size={18} /><span>Mindmaps & quiz</span></button>
      <button className="nav-item" onClick={() => setActive('challenges')}><Target size={18} /><span>Analyse de projet</span></button>
      <div className="sidebar-bottom"><div className="streak-card"><div className="streak-top"><Flame size={17} fill="currentColor" /><span>Ta série</span><strong>12 jours</strong></div><div className="streak-bar"><i style={{ width: '76%' }} /></div><small>Encore 18 min pour garder ta série</small></div><button className="settings-btn"><div className="avatar avatar-blue avatar-small">TM</div><span>Mon profil</span><ChevronRight size={16} /></button></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><span>Mon espace</span><ChevronRight size={14} /><strong>{active === 'home' ? 'Vue d’ensemble' : nav.find(n => n.id === active)?.label}</strong></div><div className="top-actions"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un cours, une personne..." /></div><button className="icon-button"><Bell size={18} /><i className="notification-dot" /></button><button className="invite-btn" onClick={() => setShowChat(true)}><MessageCircle size={16} /> Messages</button></div></header>

      {active === 'home' && <>
        <section className="hero"><div><p className="eyebrow"><span className="live-dot" /> BONJOUR THOMAS</p><h1>Prêt à faire<br /><em>progresser tes idées ?</em></h1><p className="hero-sub">Ton espace pour apprendre, partager et relever<br />les défis qui comptent.</p><button className="primary-btn" onClick={() => setActive('learn')}>Reprendre ma session <ArrowUpRight size={17} /></button></div><div className="hero-orbit"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-note note-one"><Brain size={15} /><span>Focus mode</span><strong>25:00</strong></div><div className="hero-note note-two"><Zap size={15} /><span>Énergie</span><strong>+240 XP</strong></div><div className="hero-core"><Sparkles size={29} /><span>ton<br />moment</span></div></div></section>
        <section className="stats-grid"><StatCard icon={Activity} label="Temps d’étude" value="4h 32" hint="+18% cette semaine" color="blue" /><StatCard icon={Trophy} label="XP gagnés" value="2 840" hint="Top 8% de ta promo" color="orange" /><StatCard icon={Target} label="Objectif semaine" value="72%" hint="2 sessions restantes" color="purple" /><StatCard icon={Users} label="Dans ta communauté" value="128" hint="+12 nouveaux cette semaine" color="green" /></section>
        <div className="section-heading"><div><p className="eyebrow">LE FIL DE TA COMMUNAUTÉ</p><h2>Ce qui se passe autour de toi</h2></div><button className="text-btn" onClick={() => setActive('community')}>Voir tout <ArrowUpRight size={16} /></button></div>
        <section className="dashboard-grid"><div className="feed-column"><div className="composer"><Avatar initials="TM" color="blue" /><button onClick={() => setActive('community')}>Partager une idée, une victoire ou une question...</button><button className="composer-action"><Paperclip size={18} /></button></div>{filteredFeed.map(item => <article className="feed-card" key={item.id}><div className="feed-header"><Avatar initials={item.initials} color={item.color} /><div><strong>{item.name}</strong><span>{item.time} · <b>{item.tag}</b></span></div><MoreHorizontal size={18} className="muted-icon" /></div><p className="feed-text">{item.text}</p><div className="feed-actions"><button className={liked.includes(item.id) ? 'liked' : ''} onClick={() => setLiked(liked.includes(item.id) ? liked.filter(id => id !== item.id) : [...liked, item.id])}><Heart size={16} fill={liked.includes(item.id) ? 'currentColor' : 'none'} /> {item.likes + (liked.includes(item.id) ? 1 : 0)}</button><button onClick={() => setShowChat(true)}><MessageCircle size={16} /> {item.comments}</button><button><ShareIcon /> Partager</button></div></article>)}</div><aside className="right-column"><div className="panel focus-panel"><div className="panel-title"><div><p className="eyebrow">SESSION EN COURS</p><h3>Révision biologie</h3></div><span className="status-pill"><span /> En ligne</span></div><div className="focus-timer"><div className="timer-ring"><span>18</span><small>MIN</small></div><div><strong>ADN & génétique</strong><span>Objectif : consolider les bases</span><button onClick={() => setActive('learn')}><Play size={13} fill="currentColor" /> Reprendre</button></div></div><div className="focus-progress"><div><span>Progression</span><strong>68%</strong></div><div className="progress-track"><i style={{ width: '68%' }} /></div></div></div><div className="panel"><div className="panel-title"><div><p className="eyebrow">POUR TOI</p><h3>À découvrir ensuite</h3></div><button className="dots-btn"><MoreHorizontal size={18} /></button></div><div className="recommendations">{recommendations.map((rec, i) => <div className="recommendation" key={rec.title}><div className={`rec-thumb ${rec.thumb}`}><span>{rec.icon}</span><small>{i === 0 ? '12:04' : i === 1 ? '5 slides' : '2 h 14'}</small></div><div><span className={`source source-${rec.color}`}>{rec.source}</span><strong>{rec.title}</strong><small>{rec.meta}</small></div><button><ArrowUpRight size={15} /></button></div>)}</div></div></aside></section>
      </>}

      {active === 'learn' && <section className="learn-page"><div className="page-title"><div><p className="eyebrow">STUDIO DE SYNTHÈSE IA</p><h1>Transforme tes cours<br /><em>en super-pouvoirs.</em></h1><p>Importe un document volumineux et obtiens en quelques secondes un résumé, une mindmap et un quiz personnalisés.</p></div><div className="ai-badge"><Sparkles size={18} /> MOTEUR IA ACTIF</div></div><div className="studio-grid"><div className="upload-card"><div className="upload-art"><FileText size={34} /><div className="upload-orb" /></div><h2>Dépose ton cours ici</h2><p>PDF, Word, PowerPoint ou texte brut<br /><span>Jusqu’à 200 Mo par fichier</span></p><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" hidden onChange={e => setFile(e.target.files?.[0]?.name || null)} /><button className="primary-btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> {file || 'Choisir un fichier'}</button>{file && <div className="file-ready"><Check size={15} /> {file} est prêt à être analysé</div>}<div className="privacy-note"><Lock size={14} /> Tes documents restent privés et sécurisés.</div></div><div className="generation-card"><div className="card-header"><div><p className="eyebrow">WORKFLOW INTELLIGENT</p><h2>Que veux-tu créer ?</h2></div><span className="sparkle-small"><Sparkles size={15} /></span></div><div className="mode-options"><button className="mode-option selected"><div className="mode-icon mode-blue"><FileText size={19} /></div><span><strong>Résumé express</strong><small>Les idées essentielles en 2 min</small></span><Check size={16} /></button><button className="mode-option"><div className="mode-icon mode-purple"><Link2 size={19} /></div><span><strong>Mindmap visuelle</strong><small>Relie les concepts entre eux</small></span><ChevronRight size={16} /></button><button className="mode-option"><div className="mode-icon mode-orange"><Target size={19} /></div><span><strong>Quiz adaptatif</strong><small>Teste ta compréhension</small></span><ChevronRight size={16} /></button></div><button className="generate-btn" onClick={generate}>{isGenerating ? <><span className="loader" /> Analyse en cours...</> : <><Sparkles size={17} /> Générer avec l’IA</>}</button>{generated && <div className="generated-preview"><span className="success-badge"><Check size={13} /> Généré</span><strong>ADN & génétique — synthèse express</strong><p>3 concepts clés, 5 connexions, 10 questions disponibles.</p><div className="preview-actions"><button onClick={() => setActive('home')}>Voir le résultat <ArrowUpRight size={14} /></button><button>Exporter</button></div></div>}</div></div><div className="recent-row"><div><p className="eyebrow">TES CRÉATIONS RÉCENTES</p><h2>Reprendre là où tu t’es arrêté</h2></div><div className="recent-cards"><div className="recent-card"><div className="recent-icon purple-bg"><Link2 size={18} /></div><div><strong>Physique quantique</strong><span>Mindmap · il y a 2 h</span></div><ChevronRight size={16} /></div><div className="recent-card"><div className="recent-icon orange-bg"><Target size={18} /></div><div><strong>Histoire moderne</strong><span>Quiz · hier</span></div><ChevronRight size={16} /></div></div></div></section>}

      {active === 'community' && <section className="community-page"><div className="page-title compact"><div><p className="eyebrow">LA PLACE PUBLIQUE</p><h1>Apprendre ensemble,<br /><em>aller plus loin.</em></h1><p>Partage tes progrès, trouve ton groupe et transforme l’émulation en moteur.</p></div><button className="primary-btn"><Plus size={16} /> Créer une publication</button></div><div className="community-layout"><div className="community-feed"><div className="community-tabs"><button className="active">Pour toi</button><button>Suivis</button><button>Groupes</button><div className="tab-search"><Search size={15} /> Explorer</div></div>{feed.concat({ id: 3, name: 'Yanis K.', initials: 'YK', color: 'green', time: 'il y a 1 h', tag: '#Challenge', text: 'Notre équipe cherche une personne forte en Python pour le challenge Climate Data. Départ lundi !', likes: 18, comments: 9, type: 'post' }).map(item => <article className="feed-card community-post" key={item.id}><div className="feed-header"><Avatar initials={item.initials} color={item.color} /><div><strong>{item.name}</strong><span>{item.time} · <b>{item.tag}</b></span></div><MoreHorizontal size={18} className="muted-icon" /></div><p className="feed-text">{item.text}</p><div className="feed-actions"><button><Heart size={16} /> {item.likes}</button><button onClick={() => setShowChat(true)}><MessageCircle size={16} /> {item.comments}</button><button><ShareIcon /> Partager</button></div></article>)}</div><aside className="community-side"><div className="panel group-panel"><div className="group-cover" /><div className="group-content"><div className="group-avatars"><Avatar initials="AL" color="coral" small /><Avatar initials="CS" color="purple" small /><Avatar initials="YK" color="green" small /><span>+24</span></div><h3>Study Lab · Sciences</h3><p>Un groupe pour avancer sans pression, mais avec ambition.</p><button className="outline-btn">Rejoindre le groupe</button></div></div><div className="panel"><p className="eyebrow">MEMBRES ACTIFS</p><h3>Les esprits du moment</h3>{[['AL','Amine L.','+420 XP','coral'],['CS','Clara S.','+380 XP','purple'],['YK','Yanis K.','+310 XP','green']].map(([initials,name,xp,color]) => <div className="member-row" key={name}><Avatar initials={initials} color={color} small /><div><strong>{name}</strong><span>{xp} cette semaine</span></div><button><MessageCircle size={15} /></button></div>)}</div></aside></div></section>}

      {active === 'challenges' && <section className="challenge-page"><div className="page-title compact"><div><p className="eyebrow">ARÈNE COGNITIVE</p><h1>Les défis qui font<br /><em>grandir les idées.</em></h1><p>Travaille en équipe, soumets un projet et reçois une analyse IA utile, pas juste une note.</p></div><div className="rank-card"><Trophy size={20} /><span>Ton classement</span><strong>#18</strong><small>+6 places ce mois</small></div></div><div className="challenge-grid"><div className="challenge-main"><div className="challenge-banner"><div><span className="challenge-live"><span /> OUVERT AUX INSCRIPTIONS</span><h2>Climate Data Sprint</h2><p>Construis une visualisation qui raconte l’évolution climatique de ta région.</p><div className="challenge-meta"><span><Clock3 size={14} /> 5 jours restants</span><span><Users size={14} /> 842 participants</span><span><Trophy size={14} /> 2 000 XP</span></div><button className="light-btn">Découvrir le défi <ArrowUpRight size={15} /></button></div><div className="banner-shape"><Activity size={66} /></div></div><div className="section-heading inner"><div><p className="eyebrow">AUTRES DÉFIS</p><h2>À ton niveau</h2></div><button className="text-btn">Voir le catalogue <ArrowUpRight size={16} /></button></div><div className="challenge-list"><div className="challenge-row"><div className="challenge-symbol purple-bg"><Brain size={21} /></div><div><strong>Explain like I’m 5 · Physique</strong><span>Débutant · 3 jours · 640 participants</span></div><div className="challenge-xp">+800 XP</div><ChevronRight size={17} /></div><div className="challenge-row"><div className="challenge-symbol orange-bg"><CodeIcon /></div><div><strong>Build in public · Python</strong><span>Intermédiaire · 12 jours · 214 participants</span></div><div className="challenge-xp">+1 500 XP</div><ChevronRight size={17} /></div></div></div><aside className="challenge-side"><div className="panel analysis-panel"><div className="analysis-icon"><Sparkles size={20} /></div><p className="eyebrow">ANALYSE IA DE PROJET</p><h3>Un regard juste sur ton travail.</h3><p>Dépose ton projet de compétition. L’IA analyse la clarté, la structure et l’impact — avec des pistes d’amélioration actionnables.</p><button className="primary-btn" onClick={() => setActive('learn')}><Upload size={15} /> Analyser mon projet</button></div><div className="panel mini-rank"><div className="panel-title"><h3>Top de la semaine</h3><Trophy size={17} className="gold" /></div>{[['01','Sofia B.','2 940','coral'],['02','Amine L.','2 810','purple'],['03','Thomas M.','2 840','blue']].map(([rank,name,xp,color]) => <div className="rank-row" key={rank}><span>{rank}</span><Avatar initials={name.split(' ').map(n => n[0]).join('')} color={color} small /><strong>{name}</strong><b>{xp} XP</b></div>)}</div></aside></div></section>}
    {active === 'live' && <section className="live-page">
      <div className="live-topline"><div><p className="eyebrow"><span className="live-dot" /> SESSION EN DIRECT · 4 PARTICIPANTS</p><h1>La salle d’étude<br /><em>où l’on avance ensemble.</em></h1><p>Un espace calme pour rester concentré, poser une question et repartir avec un plan clair.</p></div><div className="live-room-code"><span>CODE DE LA SALLE</span><strong>FOCUS-482</strong><button onClick={() => navigator.clipboard?.writeText('FOCUS-482')}><Link2 size={14} /> Copier</button></div></div>
      <div className="live-layout"><div className="live-stage"><div className="live-stage-head"><div><strong>Study Lab · Session du soir</strong><span><Wifi size={12} /> Connexion stable</span></div><div className="live-stage-actions"><button><Maximize2 size={15} /></button><span className="recording-pill"><Circle size={8} fill="currentColor" /> LIVE</span></div></div><div className="video-grid"><div className="video-tile video-me"><div className="video-placeholder"><Video size={28} /><span>{cameraOn ? 'Caméra active' : 'Active ta caméra'}</span></div><div className="video-name"><Avatar initials="TM" color="blue" small /> Thomas (toi) {micOn ? <Mic size={13} /> : <MicOff size={13} />}</div></div><div className="video-tile video-lea"><div className="participant-art art-lea"><span>LM</span><div className="focus-ring" /></div><div className="video-name"><Avatar initials="LM" color="orange" small /> Léa Martin <Mic size={13} /></div></div><div className="video-tile video-yanis"><div className="participant-art art-yanis"><span>YK</span><div className="focus-ring" /></div><div className="video-name"><Avatar initials="YK" color="green" small /> Yanis K. <Mic size={13} /></div></div><div className="video-tile video-clara"><div className="participant-art art-clara"><span>CS</span><div className="focus-ring" /></div><div className="video-name"><Avatar initials="CS" color="purple" small /> Clara S. <MicOff size={13} /></div></div></div><div className="live-controls"><button className={micOn ? 'control-btn' : 'control-btn off'} onClick={() => setMicOn(!micOn)}>{micOn ? <Mic size={18} /> : <MicOff size={18} />}</button><button className={cameraOn ? 'control-btn' : 'control-btn off'} onClick={() => setCameraOn(!cameraOn)}>{cameraOn ? <Video size={18} /> : <VideoOff size={18} />}</button><button className={sharing ? 'control-btn active-control' : 'control-btn'} onClick={toggleSharing}><MonitorUp size={18} /></button><button className="control-btn"><HandIcon /> <span className="control-label">Lever la main</span></button><button className="hangup-btn" onClick={leaveLiveRoom}><PhoneOff size={18} /></button></div>{!liveJoined && <div className="join-overlay"><div className="join-icon"><Video size={27} /></div><h2>Prêt pour une session focus ?</h2><p>Rejoins la salle pour voir les autres étudiants et participer au chat.</p><button className="primary-btn" onClick={joinLiveRoom}><Video size={16} /> Rejoindre la salle</button></div>}{sharing && <div className="sharing-banner"><ScreenShare size={15} /> Tu partages ton écran · les autres voient ton espace de travail</div>}</div><aside className="live-sidebar"><div className="live-tabs"><button className="active">Chat de groupe</button><button>Participants <b>4</b></button></div><div className="live-chat-body">{liveMessages.map((message, index) => <div className="live-message" key={`${message.name}-${index}`}><Avatar initials={message.name === 'Moi' ? 'TM' : message.name.slice(0,2).toUpperCase()} color={message.color} small /><div><strong>{message.name}</strong><p>{message.text}</p><small>{index + 1} min</small></div></div>)}</div><div className="live-composer"><input value={liveMessage} onChange={e => setLiveMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendLiveMessage()} placeholder="Écrire dans le groupe..." /><button onClick={sendLiveMessage}><Send size={15} /></button></div><div className="session-plan"><p className="eyebrow">PLAN DE SESSION</p><div><span className="plan-check"><Check size={11} /></span><strong>Tour de table · 5 min</strong></div><div><span className="plan-check"><Check size={11} /></span><strong>Focus silencieux · 25 min</strong></div><div><span className="plan-next"><Clock3 size={11} /></span><strong>Débrief collectif · 10 min</strong></div><button>Modifier le plan <ArrowUpRight size={13} /></button></div></aside></div><div className="live-bottom-cards"><div><UsersRound size={17} /><div><strong>Inviter ton groupe</strong><span>Partage le code FOCUS-482 à tes camarades.</span></div><button onClick={() => navigator.clipboard?.writeText('FOCUS-482')}>Copier le lien</button></div><div><Sparkles size={17} /><div><strong>Mode concentration activé</strong><span>Notifications silencieuses pendant la session.</span></div><span className="toggle-on">ON</span></div></div></section>}

    </main>

    {showChat && <div className="chat-drawer"><div className="chat-head"><div><p className="eyebrow">MESSAGES</p><h3>Ton espace de discussion</h3></div><button onClick={() => setShowChat(false)}><X size={18} /></button></div><div className="chat-contact"><Avatar initials="LM" color="orange" small /><div><strong>Léa Martin</strong><span><i /> En ligne · Projet biologie</span></div><MoreHorizontal size={17} /></div><div className="chat-body">{chat.map((message, index) => <div className={`message ${message.who === 'Moi' ? 'mine' : ''}`} key={`${message.time}-${index}`}><Avatar initials={message.initials} color={message.color} small /><div><span>{message.text}</span><small>{message.time}</small></div></div>)}</div><div className="chat-compose"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Écrire un message..." /><button onClick={sendMessage}><Send size={16} /></button></div></div>}
    <button className="floating-chat" onClick={() => setShowChat(true)}><MessageCircle size={19} /><span>Discuter avec ta communauté</span><b>3</b></button>
  </div>;
}

function HandIcon() { return <span className="hand-icon">✋</span>; }
function ShareIcon() { return <span className="share-icon">↗</span>; }
function CodeIcon() { return <span className="code-icon">&lt;/&gt;</span>; }
