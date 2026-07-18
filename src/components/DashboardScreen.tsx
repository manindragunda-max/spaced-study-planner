import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, CheckCircle, RefreshCw, Plus, Clock, Award, BookOpen, AlertCircle, ChevronDown, ListTodo } from 'lucide-react';
import { StudyPlan, Session, Topic, Subject, Flashcard, ActiveRecallTechnique } from '../types';
import { formatHumanDate, getTodayDateStr, addDays, calculateNextReview, generateId, SUBJECT_COLORS } from '../utils';
import ActiveRecallWorkspace from './ActiveRecallWorkspace';
import TopicMasteryGrid from './TopicMasteryGrid';

interface DashboardScreenProps {
  plan: StudyPlan;
  onUpdatePlan: (plan: StudyPlan) => void;
  onResetPlan: () => void;
}

export default function DashboardScreen({
  plan,
  onUpdatePlan,
  onResetPlan
}: DashboardScreenProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Dialog / Quick add states directly inside dashboard
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Celebrate animation state
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [celebratedTopicName, setCelebratedTopicName] = useState('');

  const todayStr = getTodayDateStr();

  // Sort sessions chronologically
  const sortedSessions = [...plan.sessions].sort((a, b) => a.date.localeCompare(b.date));

  // Filter sessions
  const filteredSessions = sortedSessions.filter((s) => {
    // Only show sessions from today onwards, OR past uncompleted sessions!
    const isPastUncompleted = s.date < todayStr && !s.completed;
    const isTodayOrFuture = s.date >= todayStr;
    if (!isPastUncompleted && !isTodayOrFuture) return false;

    if (sessionFilter === 'pending') return !s.completed;
    if (sessionFilter === 'completed') return s.completed;
    return true;
  });

  // Group sessions by date for neat timeline grouping
  const sessionsByDate: Record<string, Session[]> = {};
  filteredSessions.forEach((session) => {
    if (!sessionsByDate[session.date]) {
      sessionsByDate[session.date] = [];
    }
    sessionsByDate[session.date].push(session);
  });

  const orderedDates = Object.keys(sessionsByDate).sort();

  // Find currently selected session details
  const activeSession = plan.sessions.find((s) => s.id === selectedSessionId) || null;
  const activeTopic = activeSession ? plan.topics.find((t) => t.id === activeSession.topicId) || null : null;
  const activeSubject = activeTopic ? plan.subjects.find((s) => s.id === activeTopic.subjectId) || null : null;

  // Active recall techniques cycle
  const TECHNIQUES_CYCLE: ActiveRecallTechnique[] = ['Blurting', 'Flashcards', 'Feynman', 'PracticeQuestions'];

  // Logging confidence handler
  const handleLogConfidence = (
    sessionId: string,
    score: number,
    blurtDraft?: string,
    feynmanDraft?: string
  ) => {
    const updatedSessions = plan.sessions.map((session) => {
      if (session.id === sessionId) {
        return {
          ...session,
          completed: true,
          loggedConfidence: score,
          blurtDraft,
          feynmanDraft
        };
      }
      return session;
    });

    const session = plan.sessions.find((s) => s.id === sessionId)!;
    const topic = plan.topics.find((t) => t.id === session.topicId)!;

    // Recalculate spaced repetition next review date
    const repCount = topic.repetitionCount + 1;
    const { nextInterval, easinessFactor } = calculateNextReview(score, topic.intervalDays, repCount);
    
    const nextReviewDate = addDays(todayStr, nextInterval);

    const updatedTopics = plan.topics.map((t) => {
      if (t.id === topic.id) {
        return {
          ...t,
          confidence: score,
          lastReviewed: todayStr,
          intervalDays: nextInterval,
          repetitionCount: repCount,
          nextReviewDate,
          easinessFactor
        };
      }
      return t;
    });

    // Automatically generate next session on that review date!
    const nextTechnique = TECHNIQUES_CYCLE[repCount % TECHNIQUES_CYCLE.length];
    const newSession: Session = {
      id: generateId(),
      topicId: topic.id,
      date: nextReviewDate,
      technique: nextTechnique,
      completed: false,
      loggedConfidence: null
    };

    // Trigger celebration banner
    setCelebratedTopicName(topic.name);
    setShowCelebrate(true);
    setTimeout(() => setShowCelebrate(false), 3500);

    // Save
    onUpdatePlan({
      ...plan,
      sessions: [...updatedSessions, newSession],
      topics: updatedTopics
    });

    // Clear active selection
    setSelectedSessionId(null);
  };

  // Add individual flashcard
  const handleAddFlashcard = (topicId: string, front: string, back: string) => {
    const newCard: Flashcard = {
      id: generateId(),
      topicId,
      front,
      back,
      confidence: 3
    };

    onUpdatePlan({
      ...plan,
      flashcards: [...plan.flashcards, newCard]
    });
  };

  // Manual topic confidence adjust from Bento Grid
  const handleManualConfidenceChange = (topicId: string, newConfidence: number) => {
    const topic = plan.topics.find((t) => t.id === topicId)!;
    const { nextInterval, easinessFactor } = calculateNextReview(newConfidence, topic.intervalDays, topic.repetitionCount + 1);
    const nextReviewDate = addDays(todayStr, nextInterval);

    const updatedTopics = plan.topics.map((t) => {
      if (t.id === topicId) {
        return {
          ...t,
          confidence: newConfidence,
          intervalDays: nextInterval,
          nextReviewDate,
          easinessFactor
        };
      }
      return t;
    });

    // Update the next uncompleted scheduled session for this topic to match the rescheduled review date!
    let sessionRescheduled = false;
    const updatedSessions = plan.sessions.map((session) => {
      if (session.topicId === topicId && !session.completed && !sessionRescheduled) {
        sessionRescheduled = true;
        return {
          ...session,
          date: nextReviewDate
        };
      }
      return session;
    });

    // If no upcoming uncompleted session existed, create a new scheduled session for them
    if (!sessionRescheduled) {
      const nextTechnique = TECHNIQUES_CYCLE[(topic.repetitionCount + 1) % TECHNIQUES_CYCLE.length];
      const newSession: Session = {
        id: generateId(),
        topicId: topicId,
        date: nextReviewDate,
        technique: nextTechnique,
        completed: false,
        loggedConfidence: null
      };
      updatedSessions.push(newSession);
    }

    onUpdatePlan({
      ...plan,
      topics: updatedTopics,
      sessions: updatedSessions
    });
  };

  // Quick-Add Topic via modal
  const handleQuickAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubjectId) return;

    const topicId = generateId();
    const newTopic: Topic = {
      id: topicId,
      subjectId: selectedSubjectId,
      name: newTopicName.trim(),
      confidence: 1,
      lastReviewed: null,
      intervalDays: 1,
      repetitionCount: 0,
      nextReviewDate: addDays(todayStr, 1), // tomorrow
      easinessFactor: 2.5
    };

    // Create an initial Day 1 review session for it
    const newSession: Session = {
      id: generateId(),
      topicId,
      date: addDays(todayStr, 1),
      technique: 'Blurting',
      completed: false,
      loggedConfidence: null
    };

    onUpdatePlan({
      ...plan,
      topics: [...plan.topics, newTopic],
      sessions: [...plan.sessions, newSession]
    });

    setNewTopicName('');
    setShowAddModal(false);
  };

  // Progress metrics calculations
  const daysLeft = Math.max(0, addDays(plan.examDate, 0) === todayStr ? 0 : addDays(plan.examDate, 0) < todayStr ? -1 : (new Date(plan.examDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
  const completedSessionsCount = plan.sessions.filter((s) => s.completed).length;
  const totalSessionsCount = plan.sessions.length;
  const completionPercent = totalSessionsCount > 0 ? Math.round((completedSessionsCount / totalSessionsCount) * 100) : 0;

  const averageMastery = plan.topics.reduce((acc, t) => acc + t.confidence, 0) / plan.topics.length;
  const averageMasteryPercent = Math.round((averageMastery / 5) * 100);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8" id="dashboard_screen">
      
      {/* Dynamic celebration banner */}
      <AnimatePresence>
        {showCelebrate && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-zinc-800"
          >
            <div className="p-2 bg-zinc-800 rounded-full text-amber-400">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider">Session Logged!</h4>
              <p className="text-sm font-semibold text-zinc-100">
                Rescheduled <span className="text-zinc-300 font-bold">"{celebratedTopicName}"</span> based on spaced intervals!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Core Exam Countdown & Intro */}
        <div className="md:col-span-2 bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
          {/* Subtle design grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
          
          <div className="space-y-4 relative z-10">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
              Current Active Plan
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              Science-Backed Study Dashboard
            </h1>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Spaced repetition intervals dynamically stretch as you master topics, while active recall task workouts prevent memory decay.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 relative z-10 pt-4 border-t border-zinc-800">
            <div>
              <span className="block text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">Target Exam Date</span>
              <span className="text-sm font-bold text-zinc-100">{formatHumanDate(plan.examDate)}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (plan.subjects.length > 0) {
                    setSelectedSubjectId(plan.subjects[0].id);
                    setShowAddModal(true);
                  }
                }}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition duration-150 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Topic
              </button>

              <button
                onClick={onResetPlan}
                className="px-3.5 py-2 bg-zinc-900/50 hover:bg-rose-950 hover:text-rose-200 border border-zinc-800/80 hover:border-rose-900 text-zinc-400 text-xs font-semibold rounded-xl transition duration-150 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Plan
              </button>
            </div>
          </div>
        </div>

        {/* Circular Progress Ring Stats Card */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Days to Exam</span>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1">{Math.round(daysLeft)} days</h3>
            </div>
            <Calendar className="w-5 h-5 text-zinc-400" />
          </div>

          <div className="py-4 flex justify-center">
            {/* Visual SVG Progress Gauge */}
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-zinc-100"
                />
                {/* Completion Indicator */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * completionPercent) / 100}
                  className="text-zinc-900 transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-zinc-950">{completionPercent}%</span>
                <span className="text-[9px] font-medium text-zinc-400">Sessions</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-zinc-500 font-medium text-center">
            {completedSessionsCount} of {totalSessionsCount} active recall loops completed.
          </div>
        </div>

        {/* Mastery Indicator Bento Card */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-6 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Overall Retention</span>
              <h3 className="text-2xl font-bold text-zinc-900 mt-1">{averageMasteryPercent}% Mastery</h3>
            </div>
            <Award className="w-5 h-5 text-zinc-400" />
          </div>

          {/* Grid indicators representing topic progress */}
          <div className="grid grid-cols-4 gap-1.5 py-4 max-w-[140px] mx-auto">
            {plan.topics.slice(0, 12).map((topic, i) => {
              const bg = topic.confidence === 5 ? 'bg-emerald-500' : topic.confidence === 4 ? 'bg-emerald-400' : topic.confidence === 3 ? 'bg-amber-400' : topic.confidence === 2 ? 'bg-orange-300' : 'bg-rose-400';
              return (
                <div
                  key={topic.id + i}
                  title={`${topic.name}: confidence ${topic.confidence}/5`}
                  className={`w-5 h-5 rounded-md ${bg} transition`}
                />
              );
            })}
            {plan.topics.length > 12 && (
              <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-[9px] font-bold text-zinc-500">
                +{plan.topics.length - 12}
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-500 font-medium text-center">
            Weighted average confidence rating: <strong>{averageMastery.toFixed(1)} / 5.0</strong>
          </div>
        </div>

      </div>

      {/* Main Core Columns: Daily Timeline & Active Recall Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Study Calendar Timeline */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-950 tracking-tight flex items-center gap-1.5">
              <ListTodo className="w-4.5 h-4.5 text-zinc-500" />
              Recall Schedule
            </h2>

            {/* Completion Filter Selector */}
            <div className="flex bg-zinc-100 rounded-lg p-0.5 border border-zinc-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSessionFilter('pending')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  sessionFilter === 'pending' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('completed')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  sessionFilter === 'completed' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Logged
              </button>
              <button
                type="button"
                onClick={() => setSessionFilter('all')}
                className={`px-2.5 py-1 rounded-md cursor-pointer ${
                  sessionFilter === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Timeline Scroll List */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2" id="timeline_list">
            {orderedDates.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <CheckCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-zinc-600">All caught up!</h4>
                <p className="text-xs text-zinc-400 mt-1">No pending active recall sessions found. Great work keeping on track!</p>
              </div>
            ) : (
              orderedDates.map((dateKey) => {
                const sessions = sessionsByDate[dateKey];
                return (
                  <div key={dateKey} className="space-y-2.5 relative">
                    {/* Floating Date Header */}
                    <div className="sticky top-0 bg-white/95 backdrop-blur-xs py-1 z-10 flex items-center justify-between border-b border-zinc-100 mb-2">
                      <span className="text-xs font-bold text-zinc-950 tracking-tight">
                        {formatHumanDate(dateKey)}
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">
                        {sessions.length} scheduled
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {sessions.map((session) => {
                        const topic = plan.topics.find((t) => t.id === session.topicId)!;
                        const subject = plan.subjects.find((s) => s.id === topic.subjectId)!;
                        const isSelected = session.id === selectedSessionId;

                        return (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setSelectedSessionId(session.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition duration-150 relative block cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-950 border-zinc-950 text-white shadow-md'
                                : 'bg-zinc-50/40 hover:bg-zinc-50 border-zinc-200 text-zinc-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                isSelected ? 'bg-zinc-800 text-zinc-300' : subject.color
                              }`}>
                                {subject.name}
                              </span>

                              {session.completed && (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                  isSelected ? 'text-emerald-400' : 'text-emerald-600'
                                }`}>
                                  <CheckCircle className="w-3.5 h-3.5 fill-current bg-white rounded-full text-zinc-950" />
                                  <span>{session.loggedConfidence}/5</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold mt-2.5 leading-tight tracking-tight line-clamp-2">
                              {topic.name}
                            </h4>

                            {/* Spaced Interval Detail Tag */}
                            <div className="mt-3 flex items-center justify-between text-[10px] font-medium opacity-80 pt-2 border-t border-zinc-200/20">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {session.technique}
                              </span>
                              <span>
                                {topic.repetitionCount === 0 ? 'Initial Review' : `Repetition ${topic.repetitionCount}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Evidence-Based Active Recall Workspace */}
        <div className="lg:col-span-2 h-full">
          {activeSession && activeTopic && activeSubject ? (
            <ActiveRecallWorkspace
              key={activeSession.id}
              session={activeSession}
              topic={activeTopic}
              subject={activeSubject}
              flashcards={plan.flashcards}
              onAddFlashcard={handleAddFlashcard}
              onLogConfidence={handleLogConfidence}
            />
          ) : (
            <div className="bg-zinc-50 border border-zinc-200 border-dashed rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center h-full min-h-[420px]">
              <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs mb-4 text-zinc-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Active Recall Workout Space</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed mx-auto">
                Select any pending study session from your schedule calendar on the left to activate its high-yield recall workspace (Blurting timer, flashcard cards, or Feynman pad).
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Bento Section: Mastery overview grid */}
      <TopicMasteryGrid
        subjects={plan.subjects}
        topics={plan.topics}
        onManualConfidenceChange={handleManualConfidenceChange}
      />

      {/* QUICK ADD TOPIC MODAL DIALOG */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">Add Study Topic</h3>
                <p className="text-xs text-zinc-500 mt-1">Append a new target concept to your active study deck.</p>
              </div>

              <form onSubmit={handleQuickAddTopic} className="space-y-4">
                {/* Topic Name */}
                <div className="space-y-1.5">
                  <label htmlFor="modal_topic_name" className="block text-xs font-bold text-zinc-600 uppercase tracking-wider">Topic Name</label>
                  <input
                    id="modal_topic_name"
                    type="text"
                    required
                    placeholder="e.g., Mitosis & Meiosis phases"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm focus:outline-zinc-900"
                  />
                </div>

                {/* Subject Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="modal_subject_select" className="block text-xs font-bold text-zinc-600 uppercase tracking-wider">Select Subject Category</label>
                  <select
                    id="modal_subject_select"
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs focus:outline-zinc-900 cursor-pointer"
                  >
                    {plan.subjects.map((subj) => (
                      <option key={subj.id} value={subj.id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition duration-150 cursor-pointer"
                  >
                    Save Topic
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
