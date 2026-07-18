import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, BookOpen, Calendar, RefreshCcw, Search, Filter, Sparkles, CheckCircle2 } from 'lucide-react';
import { Topic, Subject } from '../types';
import { formatHumanDate, getTodayDateStr } from '../utils';

interface TopicMasteryGridProps {
  subjects: Subject[];
  topics: Topic[];
  onManualConfidenceChange: (topicId: string, newConfidence: number) => void;
}

export default function TopicMasteryGrid({
  subjects,
  topics,
  onManualConfidenceChange
}: TopicMasteryGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedConfidenceFilter, setSelectedConfidenceFilter] = useState<string>('all');

  // Filter topics
  const filteredTopics = topics.filter((topic) => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubjectFilter === 'all' || topic.subjectId === selectedSubjectFilter;
    
    let matchesConfidence = true;
    if (selectedConfidenceFilter !== 'all') {
      matchesConfidence = topic.confidence === parseInt(selectedConfidenceFilter);
    }

    return matchesSearch && matchesSubject && matchesConfidence;
  });

  const getConfidenceBadge = (confidence: number) => {
    switch (confidence) {
      case 5:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 4:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 3:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 2:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 1:
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getConfidenceText = (confidence: number) => {
    switch (confidence) {
      case 5: return 'Mastered';
      case 4: return 'Strong';
      case 3: return 'Good';
      case 2: return 'Shaky';
      case 1:
      default: return 'Forgot';
    }
  };

  // Calculate stats
  const averageMastery = topics.length > 0 
    ? (topics.reduce((acc, curr) => acc + curr.confidence, 0) / topics.length) 
    : 0;

  const masteredCount = topics.filter((t) => t.confidence >= 4).length;

  return (
    <div className="space-y-6" id="topic_mastery_grid">
      {/* Search & Filters bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-zinc-700" />
              Topic Mastery & Insights
            </h2>
            <p className="text-xs text-zinc-500">
              Interactive bento grid. Click a star to manually recalibrate a topic's spaced review schedule immediately.
            </p>
          </div>

          {/* Quick Metrics display */}
          <div className="flex gap-4">
            <div className="px-3.5 py-2 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
              <span className="block text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">Avg Mastery</span>
              <span className="text-base font-bold text-zinc-800">
                {averageMastery.toFixed(1)} / 5.0
              </span>
            </div>
            <div className="px-3.5 py-2 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
              <span className="block text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">Strong/Mastered</span>
              <span className="text-base font-bold text-zinc-800">
                {masteredCount} / {topics.length}
              </span>
            </div>
          </div>
        </div>

        {/* Input selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="relative">
            <Star className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedConfidenceFilter}
              onChange={(e) => setSelectedConfidenceFilter(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Confidences</option>
              <option value="5">5 - Mastered</option>
              <option value="4">4 - Strong</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Shaky</option>
              <option value="1">1 - Forgot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid rendering */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-200 bg-white rounded-2xl">
          <BookOpen className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs text-zinc-400">No matching study topics found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => {
            const subject = subjects.find((s) => s.id === topic.subjectId);
            const todayStr = getTodayDateStr();
            const isReviewOverdue = topic.nextReviewDate <= todayStr;

            return (
              <motion.div
                key={topic.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition duration-150 relative overflow-hidden"
              >
                {/* Visual subject color bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${subject?.color || 'bg-zinc-100 text-zinc-700'}`}>
                      {subject?.name || 'Subject'}
                    </span>

                    {isReviewOverdue ? (
                      <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 rounded text-[9px] font-bold text-rose-600 uppercase tracking-wide">
                        Overdue Review
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Scheduled
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 tracking-tight leading-tight line-clamp-2">
                      {topic.name}
                    </h3>
                  </div>

                  {/* Metadata display */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl text-[11px] text-zinc-500 font-medium">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Interval</span>
                      <strong className="text-zinc-700">{topic.intervalDays} {topic.intervalDays === 1 ? 'day' : 'days'}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-400">Reviews Logged</span>
                      <strong className="text-zinc-700">{topic.repetitionCount} times</strong>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-zinc-100 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>Next review: <strong className="text-zinc-700">{formatHumanDate(topic.nextReviewDate)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Star Adjuster Footer */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  {/* Interactive Stars */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isGold = starValue <= topic.confidence;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => onManualConfidenceChange(topic.id, starValue)}
                          className={`p-0.5 transition hover:scale-115 cursor-pointer`}
                          title={`Set confidence to ${starValue} stars`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              isGold ? 'text-zinc-900 fill-zinc-900' : 'text-zinc-200 fill-none'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Quality Badge */}
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getConfidenceBadge(topic.confidence)}`}>
                    {getConfidenceText(topic.confidence)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
