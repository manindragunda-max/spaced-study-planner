import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, BrainCircuit } from 'lucide-react';
import { StudyPlan } from './types';
import SetupScreen from './components/SetupScreen';
import DashboardScreen from './components/DashboardScreen';

const LOCAL_STORAGE_KEY = 'spaced_study_planner_plan_v2';

export default function App() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load study plan from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setPlan(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load study plan from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save plan to localStorage on update
  const handleUpdatePlan = (newPlan: StudyPlan) => {
    setPlan(newPlan);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPlan));
    } catch (e) {
      console.error('Failed to save study plan to localStorage:', e);
    }
  };

  // Clear/Reset study plan
  const handleResetPlan = () => {
    if (window.confirm('Are you sure you want to reset your study plan? This will delete all logged confidence levels, reviews, and custom topics.')) {
      setPlan(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear study plan from localStorage:', e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <BrainCircuit className="w-10 h-10 text-zinc-900 animate-spin" />
          <span className="text-sm font-semibold text-zinc-600">Loading Study Deck...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Universal Soft Clean Nav Bar */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-900 rounded-xl text-white shadow-xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-zinc-900">Spaced Study</span>
              <span className="text-xs text-zinc-500 font-semibold ml-1.5 px-1.5 py-0.5 bg-zinc-100 rounded-md border border-zinc-200">v1.2</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold bg-zinc-100/80 border border-zinc-200 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Active Recall Active</span>
          </div>
        </div>
      </header>

      {/* Primary Dynamic Stage */}
      <main className="pb-16">
        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <SetupScreen onPlanCreated={handleUpdatePlan} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DashboardScreen
                plan={plan}
                onUpdatePlan={handleUpdatePlan}
                onResetPlan={handleResetPlan}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
