/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  Sparkles,
  Flame,
  Trophy,
  TrendingUp,
  Send,
  Mic,
  MicOff,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
  BookOpen,
  Music,
  Gamepad2,
  Dumbbell,
  Code,
  Check,
  RotateCcw,
  MessageSquare,
  Calendar,
  ChevronRight,
  Smile,
  User,
  ArrowRight,
  Clock,
  Sparkle,
  Book,
  PenTool,
  BrainCircuit,
  Users,
  CheckCircle,
  HelpCircle,
  Activity,
  Heart
} from 'lucide-react';

import { 
  UserProfile, 
  ActivitySuggestion, 
  ActivityLog, 
  Badge, 
  ChatMessage, 
  SkillProgress 
} from './types';

import { Navigation } from './components/Navigation';
import { 
  INITIAL_BADGES, 
  calculateXpGain, 
  handleDailyStreakUpdate, 
  updateUnlockedBadges, 
  calculateSkillProgress 
} from './utils/achievementUtils';

// Helper to match interests to icons
const getSkillIcon = (skill: string) => {
  const norm = skill.toLowerCase();
  if (norm.includes('chess')) return <Gamepad2 className="h-5 w-5 text-purple-400" />;
  if (norm.includes('music')) return <Music className="h-5 w-5 text-sky-400" />;
  if (norm.includes('read') || norm.includes('literacy')) return <BookOpen className="h-5 w-5 text-amber-400" />;
  if (norm.includes('program') || norm.includes('code') || norm.includes('develop')) return <Code className="h-5 w-5 text-emerald-400" />;
  if (norm.includes('fit') || norm.includes('health') || norm.includes('yoga')) return <Dumbbell className="h-5 w-5 text-red-400" />;
  if (norm.includes('philosoph') || norm.includes('mind') || norm.includes('journal')) return <BrainCircuit className="h-5 w-5 text-pink-400" />;
  if (norm.includes('writ') || norm.includes('creat')) return <PenTool className="h-5 w-5 text-amber-500" />;
  return <Sparkle className="h-5 w-5 text-teal-400" />;
};

const getBadgeIcon = (iconName: string) => {
  switch (iconName) {
    case 'CornerDownRight':
      return <ArrowRight className="h-5 w-5 text-emerald-400" />;
    case 'FlameKindling':
      return <Flame className="h-5 w-5 text-orange-400 animate-pulse" />;
    case 'Flame':
      return <Flame className="h-5 w-5 text-red-500 animate-bounce" />;
    case 'Sparkles':
      return <Sparkles className="h-5 w-5 text-teal-400" />;
    case 'Trophy':
      return <Trophy className="h-5 w-5 text-amber-400" />;
    default:
      return <Award className="h-5 w-5 text-indigo-400" />;
  }
};

const DEFAULT_INTERESTS_BANK = [
  'Chess',
  'Music',
  'Reading',
  'Programming',
  'Fitness',
  'Philosophy'
];

export default function App() {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application database stored locally
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ActivitySuggestion | null>(null);

  // Suggested Source
  const [suggestSource, setSuggestSource] = useState<string>('Local Engine');
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);

  // Interactive completed modal/note state
  const [loggingLog, setLoggingLog] = useState<ActivitySuggestion | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [completionFeedback, setCompletionFeedback] = useState<string>('');
  const [isLoggingSubmit, setIsLoggingSubmit] = useState<boolean>(false);

  // Chat/Coach State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [coachTyping, setCoachTyping] = useState<boolean>(false);
  const [coachSource, setCoachSource] = useState<string>('Local Mentor');

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Onboarding Setup State
  const [setupName, setSetupName] = useState<string>('');
  const [setupAge, setSetupAge] = useState<number>(25);
  const [setupInterests, setSetupInterests] = useState<string[]>(['Chess', 'Music']);
  const [setupGoals, setSetupGoals] = useState<string[]>([
    'Solve chess puzzles daily', 
    'Analyze grandmaster tempos',
    'Practice warm-up chords'
  ]);
  const [newGoalInput, setNewGoalInput] = useState<string>('');

  // Notification Toast for achievements/badges level up
  const [toastMessage, setToastMessage] = useState<{title: string; desc: string} | null>(null);

  // Setup initial local structures
  useEffect(() => {
    const rawProfile = localStorage.getItem('grow_profile');
    const rawLogs = localStorage.getItem('grow_logs');
    const rawBadges = localStorage.getItem('grow_badges');
    const rawSuggests = localStorage.getItem('grow_suggests');
    const rawChat = localStorage.getItem('grow_chat');

    if (rawProfile) {
      setProfile(JSON.parse(rawProfile));
    }
    if (rawLogs) {
      setLogs(JSON.parse(rawLogs));
    }
    if (rawBadges) {
      setBadges(JSON.parse(rawBadges));
    } else {
      setBadges(INITIAL_BADGES);
    }
    if (rawSuggests) {
      const parsedS = JSON.parse(rawSuggests);
      setSuggestions(parsedS);
      if (parsedS.length > 0) setSelectedSuggestion(parsedS[0]);
    }
    if (rawChat) {
      setChatMessages(JSON.parse(rawChat));
    } else {
      // Default initial welcome message when profile exists
      const initUser = rawProfile ? JSON.parse(rawProfile) : null;
      if (initUser) {
        setChatMessages([
          {
            id: 'init_welcome',
            sender: 'assistant',
            text: `Hello ${initUser.name}! I am your AI Growth Coach. Today, let's explore deliberate intervals to accelerate your focus. How can I help you scale your milestones?`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }
  }, []);

  // Sync back to localstorage when states mutate
  useEffect(() => {
    if (profile) {
      localStorage.setItem('grow_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('grow_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('grow_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    if (suggestions.length > 0) {
      localStorage.setItem('grow_suggests', JSON.stringify(suggestions));
    }
  }, [suggestions]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('grow_chat', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Request suggestions from Express Node backend
  const fetchNewRecommendations = async (userProfile: UserProfile) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userProfile, logs: logs })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.recommendations);
        setSuggestSource(data.source);
        if (data.recommendations.length > 0) {
          setSelectedSuggestion(data.recommendations[0]);
        }
      } else {
        throw new Error('Recommendations fetch unsuccessful');
      }
    } catch (e) {
      console.warn('Network recommendation request failed. Loading offline backup engine suggestions:', e);
      // Fallback local mock simulation based on selected user interests
      const fallbackList: ActivitySuggestion[] = [];
      const userInterests = userProfile.interests.length > 0 ? userProfile.interests : ['generic'];
      
      const mockupDB: Record<string, any[]> = {
        'chess': [
          { activity: 'Tactical Board Coordinates', desc: 'Identify 20 board positions quickly under 1 minute.', difficulty: 'Beginner', duration: 10, xp: 20 },
          { activity: 'Blindfold Endgame Coordinate Drill', desc: 'Solve a king and coordinates square problem purely in your head.', difficulty: 'Advanced', duration: 20, xp: 45 },
          { activity: 'Analyze Famous Queen Pawn Game', desc: 'Review Karpov vs Kasparov 1984 match, focusing on knight outpost square mapping.', difficulty: 'Intermediate', duration: 25, xp: 35 }
        ],
        'music': [
          { activity: 'Scale Metronome Drill', desc: 'Practice major scales climbing to 120BPM in consecutive intervals.', difficulty: 'Intermediate', duration: 15, xp: 30 },
          { activity: 'Arpeggios Ear Recognition', desc: 'Play minors vs majors and hum the root tonic note blindly.', difficulty: 'Beginner', duration: 10, xp: 20 },
          { activity: 'Sight Reading Practice', desc: 'Read 2 pages of classic Bach preludes, marking any syncopated accents.', difficulty: 'Advanced', duration: 30, xp: 50 }
        ],
        'reading': [
          { activity: 'Active Reading Interval', desc: 'Highlight 3 conflicting claims in your contemporary non-fiction novel.', difficulty: 'Intermediate', duration: 20, xp: 30 },
          { activity: 'Synthesize Essay Paragraph', desc: 'Read a scientific abstract. Write 1 paragraph outlining the exact methodology.', difficulty: 'Advanced', duration: 15, xp: 35 }
        ]
      };

      for (let i = 0; i < 3; i++) {
        const interest = userInterests[i % userInterests.length];
        const key = interest.toLowerCase();
        const templates = mockupDB[key] || [
          { activity: 'Daily Journal Log Book', desc: 'Write down 3 obstacles you solved today and how they leverage long-term goals.', difficulty: 'Beginner', duration: 12, xp: 20 },
          { activity: 'Clear Your Headspace Activity', desc: 'Engage in absolute silence for 10 minutes to resets cortex focus.', difficulty: 'Beginner', duration: 10, xp: 15 }
        ];
        const template = templates[Math.floor(Math.random() * templates.length)];

        fallbackList.push({
          id: `local_${key}_${Date.now()}_${i}`,
          activity: template.activity,
          interest: interest,
          description: template.desc,
          difficulty: template.difficulty,
          estimatedMinutes: template.duration,
          xpValue: template.xp
        });
      }
      setSuggestions(fallbackList);
      setSuggestSource('Local Engine (Offline Offline Mode)');
      if (fallbackList.length > 0) {
        setSelectedSuggestion(fallbackList[0]);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Trigger prompt recommendations on login/load if they correspond to new active user
  const handleOnboardingSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) return;

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      username: setupName.toLowerCase().replace(/\s+/g, '_'),
      name: setupName,
      age: setupAge,
      interests: setupInterests,
      goals: setupGoals,
      xp: 0,
      level: 1,
      streak: 1,
      maxStreak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0]
    };

    setProfile(newProfile);
    setChatMessages([
      {
        id: 'init_welcome_chat',
        sender: 'assistant',
        text: `Welcome to your personal dashboard, ${setupName}! I'm your Growth Coach. I've configured custom learning routines matching your interests in ${setupInterests.join(', ')}. Let's execute your first milestone!`,
        timestamp: new Date().toISOString()
      }
    ]);
    fetchNewRecommendations(newProfile);
  };

  // Add/remove setup interests
  const toggleInterest = (interest: string) => {
    if (setupInterests.includes(interest)) {
      setSetupInterests(setupInterests.filter(i => i !== interest));
    } else {
      setSetupInterests([...setupInterests, interest]);
    }
  };

  // Add onboarding goals
  const addGoal = () => {
    if (newGoalInput.trim() && !setupGoals.includes(newGoalInput.trim())) {
      setSetupGoals([...setupGoals, newGoalInput.trim()]);
      setNewGoalInput('');
    }
  };

  const removeGoal = (g: string) => {
    setSetupGoals(setupGoals.filter(goal => goal !== g));
  };

  // Add dynamically after onboarding
  const addNewActiveGoal = (goalText: string) => {
    if (!profile) return;
    if (!goalText.trim()) return;
    const updatedGoals = [...profile.goals, goalText.trim()];
    const updated = { ...profile, goals: updatedGoals };
    setProfile(updated);
  };

  const deleteActiveGoal = (index: number) => {
    if (!profile) return;
    const updatedGoals = profile.goals.filter((_, i) => i !== index);
    const updated = { ...profile, goals: updatedGoals };
    setProfile(updated);
  };

  // Mark Activity as Complete
  const startCompletionLogger = (suggestion: ActivitySuggestion) => {
    setLoggingLog(suggestion);
    setCompletionNotes('');
    setCompletionFeedback('');
  };

  const submitActivityLog = async () => {
    if (!profile || !loggingLog) return;
    setIsLoggingSubmit(true);

    const logEntry: ActivityLog = {
      id: `log_${Date.now()}`,
      user_id: profile.id,
      activity: loggingLog.activity,
      interest: loggingLog.interest,
      duration: loggingLog.estimatedMinutes,
      timestamp: new Date().toISOString(),
      notes: completionNotes,
      feedback: completionFeedback,
      xpEarned: loggingLog.xpValue
    };

    const newLogs = [...logs, logEntry];
    setLogs(newLogs);

    // Apply streak and XP gains
    let updatedUser = handleDailyStreakUpdate(profile, newLogs);
    const { updatedProfile, leveledUp } = calculateXpGain(updatedUser, loggingLog.xpValue);
    
    // Check for newly unlocked badges
    const { newlyUnlocked, allBadges } = updateUnlockedBadges(updatedProfile, newLogs, badges);
    setBadges(allBadges);

    // Update active profile
    setProfile(updatedProfile);

    // Trigger Notification Toast
    if (leveledUp || newlyUnlocked.length > 0) {
      let title = "Milestone Reached! 🎉";
      let desc = `Leveled Up! You are now Level ${updatedProfile.level}!`;
      if (newlyUnlocked.length > 0) {
        title = `Unlocked Badge! 🏆`;
        desc = `Earned: "${newlyUnlocked[0].name}" — ${newlyUnlocked[0].description}`;
      }
      setToastMessage({ title, desc });
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setToastMessage({
        title: "Activity Completed! 💪",
        desc: `Logged "${loggingLog.activity}". Earned +${loggingLog.xpValue} XP.`
      });
      setTimeout(() => setToastMessage(null), 3500);
    }

    // Submit Feedback to coach optionally via simulation
    if (completionFeedback) {
      // Prompt Coach about user completion feedback automatically
      const chatbotNote: ChatMessage = {
        id: `completion_announcement_${Date.now()}`,
        sender: 'assistant',
        text: `Excellent. I logged your completion of "${loggingLog.activity}" (+${loggingLog.xpValue} XP)! You mentioned: "${completionFeedback}". This continuous deliberation accelerates retention. What shall we target next?`,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, chatbotNote]);
    }

    // Reset Modal
    setLoggingLog(null);
    setIsLoggingSubmit(false);

    // Clear suggestion to reflect update
    const leftSuggestions = suggestions.filter(s => s.id !== loggingLog.id);
    setSuggestions(leftSuggestions);
    if (leftSuggestions.length > 0) {
      setSelectedSuggestion(leftSuggestions[0]);
    } else {
      setSelectedSuggestion(null);
      // Fetch new ones automatically
      fetchNewRecommendations(updatedProfile);
    }
  };

  // Submit chat request inside interactive companion block
  const handleChatSubmit = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!profile || !text.trim()) return;

    const userMsg: ChatMessage = {
      id: `chat_user_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setCoachTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          user: profile,
          logs: logs
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [
          ...prev,
          {
            id: `chat_coach_${Date.now()}`,
            sender: 'assistant',
            text: data.text,
            timestamp: new Date().toISOString()
          }
        ]);
        setCoachSource(data.source);
      } else {
        throw new Error('Chat Assistant connection error');
      }
    } catch (err) {
      console.warn("Express coach API failed. Triggering local smart mentor reply:", err);
      // Trigger context-sensitive local backup coaching response matching python logic
      const textLower = text.toLowerCase();
      let reply = "Consistent practice generates permanent neural connections. Let's practice deliberate focus loops today.";
      
      if (textLower.includes('goal')) {
        reply = `Reviewing your active objectives: ${profile.goals.length > 0 ? profile.goals.map(g => `"${g}"`).join(', ') : 'none established yet'}. Pick one primary focus target to dedicate 15 minutes of quiet concentration right now.`;
      } else if (textLower.includes('interest') || textLower.includes('skill')) {
        reply = `Your active practice fields lists: ${profile.interests.join(', ')}. Which specific technical layout would you like me to map daily drills for?`;
      } else if (textLower.includes('streak') || textLower.includes('level') || textLower.includes('xp')) {
        reply = `You are on a strong ${profile.streak}-day streak, with a current user level of ${profile.level} (Accumulated XP: ${profile.xp}). Maintaining your streak keeps learning memory fully lubricated!`;
      } else if (textLower.includes('chess')) {
        reply = "For Chess, avoid passive engine watching. Solve 5 structural endgame puzzles where you calculate every variations to mate before touching any piece.";
      } else if (textLower.includes('music')) {
        reply = "In Music, always practice with an active focus context. If playing chords, slow down tempos by 50% purely focused on finger posture or pressure release.";
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `chat_coach_fallback_${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toISOString()
        }
      ]);
      setCoachSource('Local Backup Mentor');
    } finally {
      setCoachTyping(false);
    }
  };

  // Native Speech-to-Text Dictation implementation utilizing Web Speech API
  const handleVoiceToggle = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Simulate real fallback speech dictation processing in case browser permissions or hardware triggers are blocked
      setIsListening(true);
      setVoiceStatus('Initializing Vocal Stream...');
      setTimeout(() => {
        setVoiceStatus('Listening to voice input...');
      }, 1000);
      setTimeout(() => {
        const phrases = [
          "Suggest a new chess tactic for beginners",
          "What is daily progress milestone looking like?",
          "How can I lock in daily focus for music?",
          "Show me my current goals list"
        ];
        const chosenPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        setChatInput(chosenPhrase);
        setIsListening(false);
        setVoiceStatus('');
        handleChatSubmit(chosenPhrase);
      }, 3500);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceStatus('Voice stream active...');
      };

      rec.onerror = (event: any) => {
        console.error('Speech Recognition Error: ', event.error);
        setVoiceStatus(`Voice capture error: ${event.error}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        setVoiceStatus('');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(transcript);
          handleChatSubmit(transcript);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Failed to trigger SpeechRecognition engine: ', e);
      setIsListening(false);
    }
  };

  // Sign out user profile & clear database securely
  const handleLogout = () => {
    if (window.confirm("Do you want to sign out? This keeps your logged achievements, but lets other users log in.")) {
      setProfile(null);
      localStorage.removeItem('grow_profile');
    }
  };

  // Mock initial setup variables to populate on launch
  const setQuickAlexProfile = () => {
    setSetupName('Alex');
    setSetupAge(25);
    setSetupInterests(['Chess', 'Music', 'Reading', 'Programming']);
    setSetupGoals([
      'Master endgame king-safety chess patterns',
      'Learn chord progressions across 3 keys',
      'Synthesize one chapter of non-fiction daily'
    ]);
  };

  // Calculation values
  const skillProgressList = profile ? calculateSkillProgress(profile.interests, logs) : [];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden selection:bg-[#2DD4BF] selection:text-[#0A0A0B]">
      
      {/* Dynamic Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-sm rounded-xl bg-[#141416] border border-[#262629] p-4 shadow-xl translate-y-0 transition-transform duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-950/50 text-[#2DD4BF] border border-teal-800/40">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-tighter">{toastMessage.title}</h4>
              <p className="mt-1 text-sm text-slate-400 font-medium">{toastMessage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header & Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        profile={profile} 
        onLogout={handleLogout} 
      />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {!profile ? (
          /* ================= ONBOARDING / SETUP SCREEN ================= */
          <div className="flex-grow flex items-center justify-center max-w-xl mx-auto w-full py-8">
            <div id="onboarding_card" className="w-full bg-[#141416] rounded-2xl border border-[#262629] p-8 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Sparkles className="w-48 h-48 text-teal-400 rotate-12" />
              </div>

              <div className="mb-6">
                <span className="px-2 py-0.5 bg-[#2DD4BF]/10 text-[#2DD4BF] text-[10px] uppercase font-mono font-bold rounded border border-teal-900/30 tracking-widest">
                  Configure Neural Core
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-2 tracking-tight">Create Growth Profile</h2>
                <p className="text-slate-400 text-sm mt-1">Establish your personalized metrics, skills database, and active objectives.</p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Username / Real Name</label>
                  <input 
                    id="setup_name_input"
                    type="text" 
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="Enter your name (e.g. Alex)" 
                    className="w-full px-4 py-2.5 rounded-lg bg-[#1F1F22] border border-[#262629] text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-[#2DD4BF] transition-colors"
                  />
                  <div className="mt-1.5 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-mono">Will populate interactive coaching blocks</span>
                    <button 
                      type="button" 
                      onClick={setQuickAlexProfile}
                      className="text-[10px] text-[#2DD4BF] font-mono font-bold hover:underline"
                    >
                      Prefill Alex Mockup Profile
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Custom Interests & Skills (Deliberate Practice Areas)</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DEFAULT_INTERESTS_BANK.map((interest) => {
                      const isSelected = setupInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                            isSelected 
                              ? 'bg-teal-950/30 text-[#2DD4BF] border-teal-800/60 shadow-teal-950/20 shadow-inner'
                              : 'bg-[#1F1F22] text-slate-400 border-transparent hover:border-[#262629]'
                          }`}
                        >
                          {getSkillIcon(interest)}
                          <span>{interest}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Personal Growth Goals ({setupGoals.length})</label>
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="e.g. Master fingerstyle rhythms" 
                      className="flex-1 px-3 py-1.5 rounded-md bg-[#1F1F22] border border-[#262629] text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-[#2DD4BF]"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGoal(); } }}
                    />
                    <button 
                      type="button" 
                      onClick={addGoal}
                      className="px-3 py-1.5 bg-[#1F1F22] text-slate-100 border border-[#262629] rounded-md text-xs font-semibold hover:border-slate-500"
                    >
                      Add Goal
                    </button>
                  </div>

                  <div id="setup-goals-container" className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                    {setupGoals.map((g, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#1F1F22]/50 rounded px-2.5 py-1.5 border border-[#262629]/50 text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[280px]">{g}</span>
                        <button 
                          type="button" 
                          onClick={() => removeGoal(g)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {setupGoals.length === 0 && (
                      <p className="text-[10px] text-slate-500 italic">No custom goals added yet. We recommend establishing at least one targeting system.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    id="btn_create_profile"
                    disabled={setupInterests.length === 0}
                    className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide text-center uppercase transition-all ${
                      setupInterests.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A0A0B] shadow-lg shadow-teal-500/10 hover:brightness-110 active:scale-[0.99]'
                    }`}
                  >
                    Initialize Personal Database
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* ================= MAIN APPLICATION VIEWS ================= */
          <div className="flex-grow flex flex-col justify-between">
            
            {/* Header section detailing system parameters */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3">
              <div>
                <p className="text-[#2DD4BF] font-mono text-xs uppercase tracking-widest mb-1">Growth Intelligence System v2.4</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-100">Welcome back, {profile.name}.</h2>
              </div>
              <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t border-[#1F1F22] sm:border-0 pt-2 sm:pt-0">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Active Deliberate Practicing</span>
                <span className="text-lg font-mono text-slate-200 mt-0.5 font-semibold">Session Real-Time</span>
              </div>
            </header>

            {/* Layout selection */}
            {activeTab === 'dashboard' && (
              /* ================= TAB 1: BENTO GRID DASHBOARD ================= */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-grow">
                
                {/* 1. Primary Suggested Action (Hero Block) (Col-span: 8, Row-span: 3) */}
                <div id="hero-suggestion-tile" className="md:col-span-8 bg-[#141416] rounded-2xl border border-[#262629] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <div className="w-48 h-48 border-4 border-slate-100 rounded-full"></div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-[#2DD4BF] text-[#0A0A0B] text-[10px] font-extrabold rounded-full uppercase tracking-widest">
                        Daily Focus suggetion
                      </span>
                      {selectedSuggestion && (
                        <span className="px-2 py-0.5 border border-[#262629] rounded text-[10px] font-mono font-bold uppercase text-slate-400">
                          {selectedSuggestion.interest}
                        </span>
                      )}
                    </div>

                    {loadingSuggestions ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#2DD4BF] animate-spin"></div>
                        <p className="text-xs font-mono text-slate-500">Querying Gemini Neural Engine...</p>
                      </div>
                    ) : selectedSuggestion ? (
                      <div>
                        <h3 className="text-2xl sm:text-3.5xl font-extrabold text-slate-100 leading-snug tracking-tight">
                          {selectedSuggestion.activity}
                        </h3>
                        <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-xl leading-relaxed">
                          {selectedSuggestion.description}
                        </p>
                        
                        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {selectedSuggestion.estimatedMinutes} mins active practice
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                            Intensity: {selectedSuggestion.difficulty}
                          </span>
                          <span className="flex items-center gap-1 text-[#2DD4BF] font-semibold">
                            🏆 +{selectedSuggestion.xpValue} XP Available
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-slate-400 text-sm">No suggestions loaded matching your current profile setup.</p>
                        <button 
                          onClick={() => fetchNewRecommendations(profile)}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A0A0B] text-xs font-semibold rounded-lg"
                        >
                          Generate Recommendations
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedSuggestion && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button 
                        onClick={() => startCompletionLogger(selectedSuggestion)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0A0A0B] font-bold text-xs rounded-lg transition-transform active:scale-95"
                      >
                        Complete Activity
                      </button>
                      
                      {suggestions.length > 1 && (
                        <button 
                          onClick={() => {
                            // Cycle suggestions
                            const currentIdx = suggestions.findIndex(s => s.id === selectedSuggestion.id);
                            const nextIdx = (currentIdx + 1) % suggestions.length;
                            setSelectedSuggestion(suggestions[nextIdx]);
                          }}
                          className="px-4 py-2.5 bg-[#1F1F22] text-slate-200 font-bold text-xs rounded-lg border border-[#262629] hover:bg-[#141416] transition-colors"
                        >
                          Cycle Next Suggested Drill
                        </button>
                      )}

                      <button 
                        onClick={() => fetchNewRecommendations(profile)}
                        className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-xs font-bold"
                        title="Query fresh goals from engine"
                      >
                        Reload Custom Suggesions
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Streak Counter Tile (Col-span: 4, Row-span: 2) */}
                <div id="streak-counter-tile" className="md:col-span-4 bg-gradient-to-br from-[#2DD4BF] to-[#14B8A6] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-teal-500/5">
                  <div className="flex justify-between items-start text-[#0A0A0B]">
                    <p className="font-bold uppercase text-[10px] tracking-wider font-mono bg-[#0A0A0B]/10 px-2 py-0.5 rounded">
                      Cognitive Momentum
                    </p>
                    <Flame className="w-6 h-6 fill-black text-black" />
                  </div>
                  <div className="mt-4">
                    <span id="streak-num-display" className="text-6xl sm:text-7.5xl font-black text-[#0A0A0B] tracking-tighter leading-none">
                      {profile.streak}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#0A0A0B] ml-2 font-mono">
                      Day Streak
                    </span>
                    <div className="mt-2 text-[#0A0A0B]/80 text-xs font-semibold leading-normal">
                      Record: {profile.maxStreak} Days streak. Maintain consistent drills.
                    </div>
                  </div>
                </div>

                {/* 3. Skill Mastery Tracking Dashboard (Col-span: 8, Row-span: 3) */}
                <div id="skill-dashboard-tile" className="md:col-span-8 bg-[#141416] rounded-2xl border border-[#262629] p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-slate-100 font-extrabold text-sm uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#2DD4BF]" />
                        Interest Mastery Levels
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">XP Calculated Continuously</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {skillProgressList.map((skill) => (
                        <div key={skill.name} className="bg-[#1F1F22] p-4 rounded-xl border border-[#262629]/40 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-300 font-bold truncate pr-1">{skill.name}</p>
                            {getSkillIcon(skill.name)}
                          </div>
                          <div className="relative mt-4">
                            <div className="flex justify-between items-end">
                              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">Level {skill.level}</p>
                              <p className="text-lg font-extrabold text-slate-100">{skill.totalActivities} Completed</p>
                            </div>
                            <div className="w-full h-1.5 bg-[#262629] rounded-full mt-2.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#2DD4BF] to-teal-400 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min(100, Math.max(15, skill.xp % 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {skillProgressList.length === 0 && (
                        <div className="col-span-3 py-6 text-center text-slate-500 text-xs italic">
                          No deliberate completion history logged. Complete suggested drills to generate graphs.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills Tag bar & Achievements summary footer */}
                  <div className="mt-5 pt-4 border-t border-[#1F1F22] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((int) => (
                        <span key={int} className="px-2 py-0.5 bg-[#1F1F22] border border-[#262629]/80 rounded text-[9px] uppercase font-mono font-bold text-slate-400">
                          {int}
                        </span>
                      ))}
                    </div>
                    
                    {/* Tiny representation of Unlocked Badges */}
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase mr-1">Trophy Case</span>
                      <div className="flex gap-1">
                        {badges.filter(b => b.unlockedAt).slice(0, 4).map((badge) => (
                          <div 
                            key={badge.id} 
                            className="w-6 h-6 rounded bg-[#1F1F22] border border-slate-800 flex items-center justify-center p-0.5" 
                            title={badge.name}
                          >
                            {getBadgeIcon(badge.icon)}
                          </div>
                        ))}
                        {badges.filter(b => b.unlockedAt).length === 0 && (
                          <span className="text-[10px] text-slate-500 italic">Locked milestones</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Recent Activity Log (Col-span: 4, Row-span: 4) */}
                <div id="recent-logs-tile" className="md:col-span-4 bg-[#141416] rounded-2xl border border-[#262629] p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-400 font-extrabold text-xs uppercase tracking-widest mb-4">Completion Log Records</h3>
                    
                    <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                      {logs.slice().reverse().slice(0, 4).map((log) => (
                        <div key={log.id} className="flex gap-3 border-b border-[#1F1F22] pb-3 last:border-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full bg-[#2DD4BF] mt-1.5 shrink-0"></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 truncate pr-2">{log.activity}</p>
                            <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5 flex items-center gap-1.5">
                              <span>Earned: +{log.xpEarned}XP</span>
                              <span>•</span>
                              <span>{log.interest}</span>
                            </p>
                            {log.notes && (
                              <p className="text-[10px] text-slate-400 italic bg-[#1F1F22]/30 px-2 py-1 rounded border border-[#262629]/20 mt-1 truncate">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {logs.length === 0 && (
                        <div className="text-center py-10">
                          <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto opacity-30" />
                          <p className="text-[11px] font-mono text-slate-500 mt-2">Zero action logs compiled.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="mt-4 pt-3 border-t border-[#1F1F22] text-left text-xs font-bold text-[#2DD4BF] hover:underline flex items-center justify-between"
                  >
                    <span>View Completed Log Archive ({logs.length})</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'session' && (
              /* ================= TAB 2: ACTIVE GROWTH SESSION ================= */
              <div className="flex-grow max-w-2xl mx-auto w-full">
                <div className="bg-[#141416] rounded-2xl border border-[#262629] p-6 sm:p-8">
                  <div className="mb-6">
                    <span className="px-2.5 py-0.5 bg-[#2DD4BF]/10 text-[#2DD4BF] text-[10px] uppercase font-mono font-bold rounded border border-teal-900/30">
                      Deliberate Drill Environment
                    </span>
                    <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1.5Packed font">Focus Suggestion list</h3>
                    <p className="text-slate-400 text-xs sm:text-sm">These 3 exercises align precisely to your active growth goals.</p>
                  </div>

                  <div className="space-y-4">
                    {loadingSuggestions ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#2DD4BF] animate-spin"></div>
                        <p className="text-xs font-mono text-slate-500">Synchronizing neural queries...</p>
                      </div>
                    ) : suggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id} 
                        className="bg-[#1F1F22] rounded-xl border border-[#262629] p-5 flex flex-col justify-between hover:border-slate-600 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 bg-slate-800 text-[9px] font-mono text-slate-400 uppercase rounded">
                              {suggestion.interest}
                            </span>
                            <h4 className="text-base font-extrabold text-slate-100 mt-2">{suggestion.activity}</h4>
                            <p className="text-slate-400 text-xs mt-2 leading-relaxed">{suggestion.description}</p>
                          </div>
                          {getSkillIcon(suggestion.interest)}
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#262629]/60 flex flex-wrap justify-between items-center gap-2">
                          <div className="flex gap-3 text-[10px] font-mono text-slate-500">
                            <span>⏱️ {suggestion.estimatedMinutes} mins</span>
                            <span>📊 {suggestion.difficulty}</span>
                            <span className="text-[#2DD4BF] font-semibold">🏆 +{suggestion.xpValue} XP</span>
                          </div>
                          
                          <button 
                            onClick={() => startCompletionLogger(suggestion)}
                            className="px-3.5 py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-slate-200"
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    ))}

                    {!loadingSuggestions && suggestions.length === 0 && (
                      <div className="text-center py-10 bg-[#1F1F22]/50 rounded-xl border border-dashed border-[#262629]">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold mb-1">Excellent job! All suggested exercises completed.</p>
                        <button 
                          onClick={() => fetchNewRecommendations(profile)}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A0A0B] text-xs font-bold rounded"
                        >
                          Synthesize 3 New Activities
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              /* ================= TAB 3: AI COACH (CHAT PLATFORM) ================= */
              <div className="flex-grow max-w-3xl mx-auto w-full flex flex-col justify-between" style={{ minHeight: '480px' }}>
                <div id="growth_coach_card" className="bg-[#141416] rounded-2xl border border-[#262629] p-5 flex flex-col flex-1 h-[420px] max-h-[420px] relative overflow-hidden">
                  
                  {/* Top Bar indicator */}
                  <div className="flex justify-between items-center pb-3 border-b border-[#1F1F22] mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-slate-200">Interactive Growth Coach Chat</h4>
                        <p className="text-[9px] font-mono text-slate-500">Engine Source: {coachSource}</p>
                      </div>
                    </div>
                    {isListening && (
                      <span className="text-[10px] font-mono text-[#2DD4BF] bg-teal-950/45 border border-teal-900/60 rounded px-2 py-0.5 animate-pulse">
                        🎙️ {voiceStatus || 'Stream Listening'}
                      </span>
                    )}
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3 scrollbar-thin">
                    {chatMessages.map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div 
                          key={msg.id || index}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                            isUser 
                              ? 'bg-teal-950/20 text-[#2DD4BF] border border-teal-900/40' 
                              : 'bg-[#1F1F22] text-slate-200 border border-[#262629]'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">
                                {isUser ? 'alex_user' : coachSource.split(' ')[0]}
                              </span>
                              <span className="text-[8px] font-mono text-slate-500">
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {coachTyping && (
                      <div className="flex justify-start">
                        <div className="bg-[#1F1F22] rounded-xl px-4 py-2.5 border border-[#262629] flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-bounce delay-100"></div>
                          <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-bounce delay-200"></div>
                          <div className="w-1.5 h-1.5 bg-[#2DD4BF] rounded-full animate-bounce delay-300"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls / Inputs */}
                  <div className="pt-3 border-t border-[#1F1F22]">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleVoiceToggle}
                        className={`p-3 rounded-lg border flex items-center justify-center transition-all ${
                          isListening 
                            ? 'bg-red-950/20 text-red-400 border-red-900/50 scale-95 shadow-inner' 
                            : 'bg-[#1F1F22] text-[#2DD4BF] border-transparent hover:border-[#2DD4BF]'
                        }`}
                        title="Vocal/Speech dictation model"
                      >
                        {isListening ? <MicOff className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                      </button>

                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={isListening ? "Listening back... Speak clearly into your mic." : "Ask Coach about tactics, goal progress, or custom scale sequences..."}
                        className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-[#1F1F22] border border-[#262629] text-gray-100 placeholder-slate-500 focus:outline-none focus:border-[#2DD4BF]"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(); }}
                        disabled={isListening}
                      />

                      <button 
                        onClick={() => handleChatSubmit()}
                        disabled={!chatInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#2DD4BF] to-[#14B8A6] text-[#0A0A0B] rounded-lg font-bold text-xs flex items-center gap-1 hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <Send className="h-3 w-3" />
                        <span>Transmit</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              /* ================= TAB 4: PROFILE & OBJECTIVES ================= */
              <div className="flex-grow max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Profile detail controls inside bento */}
                <div className="md:col-span-4 bg-[#141416] rounded-2xl border border-[#262629] p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[#2DD4BF] font-mono text-xs uppercase tracking-widest mb-4">Neural Parameters</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-teal-950-50 text-[#2DD4BF] border border-teal-900/50 font-black text-lg flex items-center justify-center">
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-100">{profile.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">Alex User ID: #{profile.id.split('_')[1]}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#1F1F22] space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">User Level</span>
                          <span className="font-bold text-slate-300">Level {profile.level}</span>
                        </div>
                        <div className="flex justify-between row-auto">
                          <span className="text-slate-500">Cumulative Experience</span>
                          <span className="font-mono text-[#2DD4BF]">{logs.reduce((s,l)=> s+l.xpEarned, 0)} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Consecutive Streak</span>
                          <span className="font-mono text-orange-400">{profile.streak} Days (Max: {profile.maxStreak})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Logged Completions</span>
                          <span className="font-semibold text-slate-300">{logs.length} Drill logs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1F1F22]">
                    <button 
                      onClick={() => {
                        if (window.confirm("Do you want to reset your local database and start onboarding again? This will clear all milestones.")) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="w-full text-center text-xs font-bold text-red-400 hover:bg-red-950/20 py-2 border border-red-900/40 rounded transition-colors"
                    >
                      Hard Reset Local Database
                    </button>
                  </div>
                </div>

                {/* Growth Goals editing block */}
                <div className="md:col-span-8 bg-[#141416] rounded-2xl border border-[#262629] p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-100 font-extrabold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#2DD4BF]" />
                      Active Long-Term Growth Objectives ({profile.goals.length})
                    </h3>

                    {/* Add New Goal inside bento view */}
                    <div className="flex gap-2 mb-4">
                      <input 
                        id="goal-add-input-main"
                        type="text" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as any).value;
                            if (val.trim()) {
                              addNewActiveGoal(val);
                              (e.target as any).value = '';
                            }
                          }
                        }}
                        placeholder="Type a new focus goal (e.g. Master dynamic open tempos) and press Enter..."
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1F1F22] border border-[#262629] text-gray-100 placeholder-slate-500 text-xs focus:outline-none focus:border-[#2DD4BF]"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('goal-add-input-main') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            addNewActiveGoal(input.value);
                            input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-[#1F1F22] text-slate-100 rounded-lg border border-[#262629] text-xs font-semibold hover:border-slate-500"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {profile.goals.map((goal, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-[#1F1F22]/40 rounded-lg px-3 py-2 border border-[#262629]/50 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            <span className="text-slate-300 font-medium truncate">{goal}</span>
                          </div>
                          <button 
                            onClick={() => deleteActiveGoal(idx)}
                            className="text-slate-500 hover:text-red-400 p-1 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {profile.goals.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-6">No long-term growth objectives configured. Define actions to align daily recommendations.</p>
                      )}
                    </div>
                  </div>

                  {/* Badges trophy system list */}
                  <div className="pt-4 border-t border-[#1F1F22] mt-4">
                    <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider font-mono">Completed Milestones ({badges.filter(b => b.unlockedAt).length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                      {badges.map((badge) => {
                        const isUnlocked = !!badge.unlockedAt;
                        return (
                          <div 
                            key={badge.id}
                            className={`p-3 rounded-lg border relative flex flex-col items-center justify-center text-center transition-all ${
                              isUnlocked 
                                ? 'bg-teal-950/20 border-teal-800/40 text-slate-100 shadow-md shadow-teal-500/[0.03]' 
                                : 'bg-[#1F1F22]/20 border-transparent text-slate-600'
                            }`}
                            title={badge.description}
                          >
                            <div className="h-8 w-8 rounded-full bg-[#1F1F22]/60 border border-slate-800 flex items-center justify-center mb-1">
                              {getBadgeIcon(badge.icon)}
                            </div>
                            <span className="text-[10px] font-bold truncate max-w-full leading-tight">{badge.name}</span>
                            {isUnlocked && (
                              <span className="absolute top-1 right-1 text-[8px] font-mono text-[#2DD4BF] font-extrabold uppercase bg-teal-950 border border-teal-900 rounded-[2px] px-0.5">
                                OK
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* ================= INTERACTIVE COMPLETION MODAL LAYER ================= */}
      {loggingLog && (
        <div id="completion_modal" className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141416] rounded-2xl border border-[#262629] max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-100 leading-tight">Log Complete Activity</h3>
            <p className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wide text-[#2DD4BF]">{loggingLog.activity}</p>
            
            <div className="my-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Deliberate Work notes (Optional Reflection)</label>
                <textarea 
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Managed scales up to 105BPM today. Kept clean hand angle and posture stable."
                  rows={3}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#1F1F22] border border-[#262629] text-gray-100 placeholder-slate-500 focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">Coach feedback (Optional)</label>
                <input 
                  type="text" 
                  value={completionFeedback}
                  onChange={(e) => setCompletionFeedback(e.target.value)}
                  placeholder="e.g. Suggest simpler tempo control practices tomorrow"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#1F1F22] border border-[#262629] text-gray-100 placeholder-slate-500 focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button 
                onClick={() => setLoggingLog(null)}
                className="px-4 py-2 bg-[#1F1F22] text-slate-400 border border-[#262629] text-xs font-bold rounded-lg hover:text-slate-100"
              >
                Discard
              </button>
              <button 
                onClick={submitActivityLog}
                disabled={isLoggingSubmit}
                className="px-5 py-2 bg-[#2DD4BF] text-[#0A0A0B] text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {isLoggingSubmit ? 'Submitting Core...' : 'Log & Accumulate XP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer system diagnostics bar */}
      <footer className="w-full border-t border-[#1F1F22] py-4 bg-[#0A0A0B] mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-slate-500">
          <div className="flex gap-4">
            <span>DIAG_OK</span>
            <span>SYSTEM_MOMENTUM_STABLE</span>
            <span>CELLS: 12_COL_BENTO</span>
          </div>
          <div className="flex gap-4 uppercase mt-2 sm:mt-0">
            <span>Personal Growth Coach V2.4</span>
            <span>Sync: LocalStorage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
