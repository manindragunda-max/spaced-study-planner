import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Plus, Check, Eye, ChevronRight, ChevronLeft, HelpCircle, Star, Sparkles, BookOpen, Clock, Lightbulb } from 'lucide-react';
import { Session, Topic, Subject, Flashcard } from '../types';
import { TECHNIQUES, TechniqueDetails } from '../utils';

interface ActiveRecallWorkspaceProps {
  key?: string;
  session: Session;
  topic: Topic;
  subject: Subject;
  flashcards: Flashcard[];
  onAddFlashcard: (topicId: string, front: string, back: string) => void;
  onLogConfidence: (sessionId: string, confidence: number, blurtDraft?: string, feynmanDraft?: string) => void;
}

export default function ActiveRecallWorkspace({
  session,
  topic,
  subject,
  flashcards,
  onAddFlashcard,
  onLogConfidence
}: ActiveRecallWorkspaceProps) {
  const technique = session.technique;
  const details = TECHNIQUES[technique];

  // Global confidence level logging
  const [hoverConfidence, setHoverConfidence] = useState<number | null>(null);

  // Technique: Blurting State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [blurtText, setBlurtText] = useState(session.blurtDraft || '');
  const [isBlurtSubmitted, setIsBlurtSubmitted] = useState(false);
  const [blurtCorrections, setBlurtCorrections] = useState('');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Technique: Feynman State
  const [feynmanText, setFeynmanText] = useState(session.feynmanDraft || '');
  const [feynmanChecklist, setFeynmanChecklist] = useState({
    noJargon: false,
    analogyUsed: false,
    gapsFilled: false
  });

  // Technique: Flashcards State
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const topicCards = flashcards.filter((card) => card.topicId === topic.id);

  // Technique: Practice Questions State
  const [practiceQuestions, setPracticeQuestions] = useState([
    { question: 'State the core mechanism/definition of this topic.', answer: '' },
    { question: 'Why does this process/concept happen? Explain the cause/effect relationship.', answer: '' },
    { question: 'Apply this concept to a real-world scenario or solve a sample problem.', answer: '' }
  ]);
  const [showPracticeGuide, setShowPracticeGuide] = useState(false);

  // Timer Effect for Blurting
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  // Reset timer
  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(300);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add card
  const handleCreateFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    onAddFlashcard(topic.id, newFront.trim(), newBack.trim());
    setNewFront('');
    setNewBack('');
    
    // Auto jump to the newly added card if it is the first card
    if (topicCards.length === 0) {
      setCurrentCardIndex(0);
    }
  };

  // Save drafts when changing session (optional but helpful)
  useEffect(() => {
    // Reset states when session changes
    setBlurtText(session.blurtDraft || '');
    setIsBlurtSubmitted(false);
    setBlurtCorrections('');
    setFeynmanText(session.feynmanDraft || '');
    setFeynmanChecklist({ noJargon: false, analogyUsed: false, gapsFilled: false });
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setShowPracticeGuide(false);
    setTimerSeconds(300);
    setIsTimerRunning(false);
  }, [session.id]);

  const triggerConfidenceLogging = (score: number) => {
    // Save draft data along with completion
    onLogConfidence(
      session.id,
      score,
      technique === 'Blurting' ? blurtText : undefined,
      technique === 'Feynman' ? feynmanText : undefined
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col h-full overflow-hidden" id="active_recall_workspace">
      {/* Session Header Card */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${subject.color}`}>
                {subject.name}
              </span>
              <span className="text-zinc-400 text-xs font-semibold">•</span>
              <span className="inline-flex items-center gap-1 text-zinc-500 text-xs font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                {details.durationMinutes} mins recommended
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight">{topic.name}</h1>
          </div>

          <div className="inline-flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
            <span className="font-semibold">{technique} Task</span>
          </div>
        </div>

        {/* Short introduction explanation of Active Recall technique */}
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed bg-zinc-50 p-3 rounded-lg border border-zinc-100">
          <strong>How this works:</strong> {details.shortDesc}
        </p>
      </div>

      {/* Main Interactive Space */}
      <div className="flex-1 p-6 overflow-y-auto min-h-[380px]">
        {/* Technique Specific Content */}
        
        {/* BLURTING METHOD */}
        {technique === 'Blurting' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-zinc-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-800">Recall Timer</h3>
                  <p className="text-[11px] text-zinc-500">Dump everything you know before the clock runs out.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-zinc-900 bg-white border border-zinc-300 px-3 py-1 rounded-lg">
                  {formatTimer(timerSeconds)}
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2 rounded-full cursor-pointer transition ${
                    isTimerRunning ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full cursor-pointer transition"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isBlurtSubmitted ? (
              <div className="space-y-3">
                <label htmlFor="blurt_textarea" className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider">Memory Dump Pad</label>
                <textarea
                  id="blurt_textarea"
                  value={blurtText}
                  onChange={(e) => setBlurtText(e.target.value)}
                  placeholder="Start writing out everything you remember. Key terms, pathways, definitions, diagrams described in words..."
                  className="w-full h-48 px-4 py-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 font-sans text-sm bg-zinc-50/30 leading-relaxed"
                />
                
                <button
                  type="button"
                  onClick={() => {
                    setIsBlurtSubmitted(true);
                    setIsTimerRunning(false);
                  }}
                  disabled={!blurtText.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-tight inline-flex items-center justify-center gap-2 cursor-pointer transition ${
                    blurtText.trim() ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Submit Memory Dump & Reveal Gaps
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <h4 className="text-sm font-bold text-emerald-800 inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Review and Correct
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Now, look up your textbook or lecture notes. Using a "red pen" style approach, evaluate what you missed or what was slightly incorrect. Log those corrections below.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="blurt_corrections" className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider">Omissions & Corrections (Red Ink)</label>
                  <textarea
                    id="blurt_corrections"
                    value={blurtCorrections}
                    onChange={(e) => setBlurtCorrections(e.target.value)}
                    placeholder="e.g., I missed the 3rd phase transition of the pathway; got the enzyme name wrong..."
                    className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 font-sans text-sm bg-zinc-50/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsBlurtSubmitted(false)}
                  className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs text-zinc-600 font-medium cursor-pointer transition"
                >
                  Edit Memory Dump
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* FLASHCARD STUDY LAB */}
        {technique === 'Flashcards' && (
          <div className="space-y-6">
            {/* Create New Card Dialog */}
            <form onSubmit={handleCreateFlashcard} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Add Active-Recall Card
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Question / Term (Front)"
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-zinc-900"
                />
                <input
                  type="text"
                  placeholder="Answer / Definition (Back)"
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-zinc-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newFront.trim() || !newBack.trim()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition ${
                    newFront.trim() && newBack.trim()
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Card
                </button>
              </div>
            </form>

            {/* Deck View */}
            {topicCards.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <HelpCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-zinc-600">No cards in this deck yet</h4>
                <p className="text-xs text-zinc-400 mt-1">Write your first question-answer recall cards above to begin testing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Recall Card Box */}
                <div className="perspective-1000 h-52 w-full max-w-sm mx-auto">
                  <motion.button
                    type="button"
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="w-full h-full relative preserve-3d cursor-pointer text-left font-sans block"
                    animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Front Face */}
                    <div className="absolute inset-0 backface-hidden bg-zinc-900 text-white border border-zinc-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-400">Question</span>
                      <div className="text-center py-4 font-bold text-base leading-relaxed">
                        {topicCards[currentCardIndex].front}
                      </div>
                      <div className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                        <RotateCcw className="w-3 h-3" />
                        Click to Reveal Answer
                      </div>
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 backface-hidden bg-white text-zinc-900 border border-zinc-300 rounded-2xl p-6 shadow-md flex flex-col justify-between transform rotateY-180">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold text-zinc-500">Answer</span>
                      <div className="text-center py-4 font-semibold text-base text-zinc-800 leading-relaxed">
                        {topicCards[currentCardIndex].back}
                      </div>
                      <div className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                        <RotateCcw className="w-3 h-3" />
                        Click to Show Question
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Deck Navigation Controls */}
                <div className="flex items-center justify-between max-w-sm mx-auto p-2 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCardFlipped(false);
                      setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : topicCards.length - 1));
                    }}
                    className="p-2 hover:bg-zinc-200 text-zinc-600 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-semibold text-zinc-700">
                    Card {currentCardIndex + 1} of {topicCards.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCardFlipped(false);
                      setCurrentCardIndex((prev) => (prev < topicCards.length - 1 ? prev + 1 : 0));
                    }}
                    className="p-2 hover:bg-zinc-200 text-zinc-600 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEYNMAN SIMPLIFIER TASK */}
        {technique === 'Feynman' && (
          <div className="space-y-5">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider inline-flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                The Golden Rule: Teach a Child
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                If you cannot explain a topic in plain, child-like English without confusing terminology, you do not fully grasp it yet. Focus on creating clear, visual explanations and helpful analogies.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="feynman_simplifier_pad" className="block text-xs font-semibold text-zinc-600 uppercase tracking-wider">Feynman Simplified teaching pad</label>
              <textarea
                id="feynman_simplifier_pad"
                value={feynmanText}
                onChange={(e) => setFeynmanText(e.target.value)}
                placeholder="Type your simple explanation here. Keep sentences short. Avoid jargon. (e.g., 'A cell is like a tiny busy city. The DNA is the library holding all the building blueprints...')"
                className="w-full h-44 px-4 py-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 font-sans text-sm bg-zinc-50/30 leading-relaxed"
              />
            </div>

            {/* Feynman Verification Checklist */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Concept Self-Audit:</h4>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feynmanChecklist.noJargon}
                    onChange={(e) => setFeynmanChecklist({ ...feynmanChecklist, noJargon: e.target.checked })}
                    className="rounded-sm border-zinc-300 focus:ring-zinc-900 w-4 h-4 text-zinc-900"
                  />
                  <span>Did I completely strip out unnecessary complex words?</span>
                </label>
                
                <label className="flex items-center gap-3 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feynmanChecklist.analogyUsed}
                    onChange={(e) => setFeynmanChecklist({ ...feynmanChecklist, analogyUsed: e.target.checked })}
                    className="rounded-sm border-zinc-300 focus:ring-zinc-900 w-4 h-4 text-zinc-900"
                  />
                  <span>Did I invent or use a clear analogy (e.g., mitochondria is like a powerhouse)?</span>
                </label>

                <label className="flex items-center gap-3 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feynmanChecklist.gapsFilled}
                    onChange={(e) => setFeynmanChecklist({ ...feynmanChecklist, gapsFilled: e.target.checked })}
                    className="rounded-sm border-zinc-300 focus:ring-zinc-900 w-4 h-4 text-zinc-900"
                  />
                  <span>Did I look back at the source material for any details I explained poorly?</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* PRACTICE QUESTIONS */}
        {technique === 'PracticeQuestions' && (
          <div className="space-y-5">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Test your boundaries. Formulate active answers to these three strategic diagnostic questions, then compare them to your reference keys.
              </p>
            </div>

            <div className="space-y-4">
              {practiceQuestions.map((pq, index) => (
                <div key={pq.question} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50/20 space-y-2">
                  <h4 className="text-xs font-bold text-zinc-800">Q{index + 1}: {pq.question}</h4>
                  <textarea
                    placeholder="Draft your retrieval answer..."
                    value={pq.answer}
                    onChange={(e) => {
                      const updated = [...practiceQuestions];
                      updated[index].answer = e.target.value;
                      setPracticeQuestions(updated);
                    }}
                    className="w-full h-20 px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-zinc-900"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPracticeGuide(!showPracticeGuide)}
                className="text-xs font-bold text-zinc-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPracticeGuide ? 'Hide Evaluation Prompt' : 'Reveal Self-Evaluation Guide'}
              </button>
            </div>

            {showPracticeGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-800 leading-relaxed"
              >
                <strong>Evaluation Prompts:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>For Q1: Check if you named all core components and enzyme/phase classifications correctly.</li>
                  <li>For Q2: Ensure you drew a direct chain of cause and effect without jumping steps.</li>
                  <li>For Q3: Confirm your scenario follows physical laws or core formulas exactly.</li>
                </ul>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Spaced Repetition Core Confidence Logging Bar */}
      <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-4">
        <div className="text-center">
          <span className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-widest block mb-2">
            Finish Recall Session & Log Mastery Level
          </span>
          <h2 className="text-sm font-bold text-zinc-900">How would you rate your recall confidence?</h2>
          <p className="text-xs text-zinc-500 mt-1">This directly adjusts how soon this topic will return in your schedule.</p>
        </div>

        {/* 1-5 Custom Stars Grid */}
        <div className="flex justify-center gap-2 max-w-sm mx-auto" id="confidence_stars_rating">
          {[1, 2, 3, 4, 5].map((score) => {
            const isFilled = hoverConfidence !== null ? score <= hoverConfidence : false;
            
            // Score textual feedback
            const scoreLabels: Record<number, string> = {
              1: 'Forgot (Resets interval to Day 1)',
              2: 'Shaky (Re-schedule in 2 days)',
              3: 'Good (Keeps/advances slowly)',
              4: 'Strong (Advances interval 1.8x)',
              5: 'Mastered! (Jumps interval 2.5x)'
            };

            return (
              <button
                key={score}
                type="button"
                onMouseEnter={() => setHoverConfidence(score)}
                onMouseLeave={() => setHoverConfidence(null)}
                onClick={() => triggerConfidenceLogging(score)}
                className={`flex-1 p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  isFilled
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-400 hover:text-zinc-700 border-zinc-200'
                }`}
                title={scoreLabels[score]}
              >
                <Star className={`w-5 h-5 ${isFilled ? 'fill-current' : ''}`} />
                <span className="text-xs font-bold mt-1">{score}</span>
              </button>
            );
          })}
        </div>

        {/* Reactive tooltip/text on hover */}
        {hoverConfidence !== null && (
          <div className="text-center text-xs font-semibold text-zinc-800 animate-fadeIn">
            {hoverConfidence === 1 && '1 - Forgot (Resets interval to Day 1)'}
            {hoverConfidence === 2 && '2 - Shaky (Re-schedule in 2 days)'}
            {hoverConfidence === 3 && '3 - Good (Spaced advance slowly)'}
            {hoverConfidence === 4 && '4 - Strong (Advances interval 1.8x)'}
            {hoverConfidence === 5 && '5 - Mastered! (Jumps interval 2.5x)'}
          </div>
        )}
      </div>
    </div>
  );
}
