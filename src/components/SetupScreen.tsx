import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Trash2, ArrowRight, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { Subject, Topic, StudyPlan, Flashcard } from '../types';
import { PRESET_TEMPLATES, SUBJECT_COLORS, generateId, getTodayDateStr, addDays, daysBetween, generateInitialSessions } from '../utils';

interface SetupScreenProps {
  onPlanCreated: (plan: StudyPlan) => void;
}

export default function SetupScreen({ onPlanCreated }: SetupScreenProps) {
  // Plan setup state
  const [examDate, setExamDate] = useState<string>(addDays(getTodayDateStr(), 30));
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Local form inputs
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [newTopicNames, setNewTopicNames] = useState<Record<string, string>>({}); // subjectId -> topicName

  const todayStr = getTodayDateStr();
  const daysUntilExam = daysBetween(todayStr, examDate);

  // Apply a preset template
  const applyPreset = (key: string) => {
    const preset = PRESET_TEMPLATES[key];
    if (!preset) return;

    const newSubjects: Subject[] = [];
    const newTopics: Topic[] = [];

    preset.subjects.forEach((subj, idx) => {
      const subjectId = generateId();
      const color = SUBJECT_COLORS[subj.colorIndex % SUBJECT_COLORS.length].bgClass;
      
      newSubjects.push({
        id: subjectId,
        name: subj.name,
        color: color
      });

      subj.topics.forEach((topicName) => {
        newTopics.push({
          id: generateId(),
          subjectId: subjectId,
          name: topicName,
          confidence: 1, // Start with confidence 1
          lastReviewed: null,
          intervalDays: 1,
          repetitionCount: 0,
          nextReviewDate: addDays(todayStr, 1), // Initial review scheduled for tomorrow
          easinessFactor: 2.5
        });
      });
    });

    setSubjects(newSubjects);
    setTopics(newTopics);
  };

  // Add custom subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const subjectId = generateId();
    const color = SUBJECT_COLORS[selectedColorIndex % SUBJECT_COLORS.length].bgClass;

    const newSubj: Subject = {
      id: subjectId,
      name: newSubjectName.trim(),
      color: color
    };

    setSubjects([...subjects, newSubj]);
    setNewSubjectName('');
    setSelectedColorIndex((prev) => (prev + 1) % SUBJECT_COLORS.length);
  };

  // Delete subject and its topics
  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(subjects.filter((s) => s.id !== subjectId));
    setTopics(topics.filter((t) => t.subjectId !== subjectId));
  };

  // Add custom topic to a subject
  const handleAddTopic = (subjectId: string) => {
    const topicName = newTopicNames[subjectId]?.trim();
    if (!topicName) return;

    const newTopic: Topic = {
      id: generateId(),
      subjectId,
      name: topicName,
      confidence: 1,
      lastReviewed: null,
      intervalDays: 1,
      repetitionCount: 0,
      nextReviewDate: addDays(todayStr, 1),
      easinessFactor: 2.5
    };

    setTopics([...topics, newTopic]);
    setNewTopicNames({
      ...newTopicNames,
      [subjectId]: ''
    });
  };

  // Delete individual topic
  const handleDeleteTopic = (topicId: string) => {
    setTopics(topics.filter((t) => t.id !== topicId));
  };

  // Submit and build full StudyPlan
  const handleGeneratePlan = () => {
    if (subjects.length === 0) return;
    if (topics.length === 0) return;
    if (daysUntilExam <= 0) return;

    // Generate initial spacing sessions
    const sessions = generateInitialSessions(topics, todayStr, examDate);

    const studyPlan: StudyPlan = {
      examDate,
      startDate: todayStr,
      subjects,
      topics,
      sessions,
      flashcards: [] // empty default
    };

    onPlanCreated(studyPlan);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6" id="setup_screen">
      {/* Intro Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-4 border border-zinc-200">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
          Evidence-Based Learning
        </div>
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight sm:text-5xl">
          Spaced Study Planner
        </h1>
        <p className="mt-3 text-lg text-zinc-600 max-w-xl mx-auto">
          Maximize your retention and bypass cramming cycles using scientific Spaced Repetition (intervals) paired with Active Recall.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Controls Column */}
        <div className="md:col-span-1 space-y-6">
          {/* Exam Date Selector */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-zinc-500" />
              1. Exam Date
            </h2>
            <div className="space-y-3">
              <label htmlFor="exam_date_input" className="block text-xs text-zinc-500 font-medium">Select target examination date</label>
              <input
                id="exam_date_input"
                type="date"
                min={addDays(todayStr, 1)}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-zinc-900 focus:border-zinc-950 font-sans text-sm bg-zinc-50 font-medium"
              />
              
              {daysUntilExam > 0 ? (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 animate-pulse" />
                  <span><strong>{daysUntilExam} days</strong> remaining for study</span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please pick a future date.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick-Start Presets */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-zinc-500" />
              Quick-Start Presets
            </h2>
            <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
              Instantly seed the planner with standard, high-yield study topics:
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => applyPreset('computerScience')}
                className="w-full px-4 py-3 text-left border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl transition duration-150 flex flex-col"
              >
                <span className="text-sm font-semibold text-zinc-800">Computer Science</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Algorithms, Data Structures, Systems</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('mcat')}
                className="w-full px-4 py-3 text-left border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl transition duration-150 flex flex-col"
              >
                <span className="text-sm font-semibold text-zinc-800">Pre-Med & Biology</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">MCAT prep: Cells, Org Chemistry, Physics</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('barExam')}
                className="w-full px-4 py-3 text-left border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-xl transition duration-150 flex flex-col"
              >
                <span className="text-sm font-semibold text-zinc-800">Legal Studies</span>
                <span className="text-[11px] text-zinc-500 mt-0.5">Bar Exam: Constitutional, Criminal, Contracts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Planner Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Custom Subjects & Topics Creation */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight mb-2">
              2. Custom Subjects & Topics
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Create your subjects first, then enter key exam topics for each. Spaced sessions will schedule for every topic independently.
            </p>

            {/* Create Subject Form */}
            <form onSubmit={handleAddSubject} className="mb-8 p-4 bg-zinc-50 rounded-xl border border-zinc-200 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
              <div className="flex-1 w-full">
                <label htmlFor="subject_name_input" className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">New Subject Name</label>
                <input
                  id="subject_name_input"
                  type="text"
                  placeholder="e.g., Biochemistry, Calculus..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-950 bg-white"
                />
              </div>

              {/* Color Tag Selection */}
              <div className="w-full sm:w-auto">
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5 uppercase tracking-wider">Color Tag</label>
                <div className="flex gap-2">
                  {SUBJECT_COLORS.map((col, index) => (
                    <button
                      key={col.name}
                      type="button"
                      title={col.name}
                      onClick={() => setSelectedColorIndex(index)}
                      className={`w-6 h-6 rounded-full border transition duration-150 relative flex items-center justify-center`}
                      style={{ backgroundColor: col.accentHex }}
                    >
                      {selectedColorIndex === index && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition duration-150 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>

            {/* Subjects and Topics Lists */}
            {subjects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl">
                <p className="text-sm text-zinc-400">No subjects added yet. Select a preset template or add custom ones above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {subjects.map((subject) => {
                    const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border border-zinc-200 rounded-xl overflow-hidden"
                      >
                        {/* Subject Header Bar */}
                        <div className={`px-4 py-3 border-b border-zinc-200 flex justify-between items-center ${subject.color}`}>
                          <span className="font-bold text-sm tracking-tight">{subject.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="p-1 hover:bg-zinc-200/50 rounded-md text-zinc-600 transition"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Subject Content */}
                        <div className="p-4 bg-white space-y-4">
                          {/* List of current topics */}
                          {subjectTopics.length > 0 && (
                            <ul className="space-y-2">
                              {subjectTopics.map((topic) => (
                                <li
                                  key={topic.id}
                                  className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg flex justify-between items-center text-xs group"
                                >
                                  <span className="text-zinc-700 font-medium">{topic.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-600 transition"
                                    title="Delete Topic"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Quick Add Topic Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add key topic (e.g., Mitosis phases)"
                              value={newTopicNames[subject.id] || ''}
                              onChange={(e) =>
                                setNewTopicNames({
                                  ...newTopicNames,
                                  [subject.id]: e.target.value
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTopic(subject.id);
                                }
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs focus:ring-1 focus:ring-zinc-950 bg-zinc-50/50"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddTopic(subject.id)}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold transition duration-150 cursor-pointer"
                            >
                              Add Topic
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Core study plan initiator */}
          <div className="flex justify-end">
            <button
              onClick={handleGeneratePlan}
              disabled={subjects.length === 0 || topics.length === 0 || daysUntilExam <= 0}
              className={`px-6 py-3.5 rounded-xl font-bold text-sm tracking-tight inline-flex items-center gap-2 cursor-pointer transition ${
                subjects.length > 0 && topics.length > 0 && daysUntilExam > 0
                  ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-md shadow-zinc-950/10'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              Initialize Spaced Study Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
