'use client';

import { BookOpen, FileText } from "lucide-react";
import { useState } from "react";
import { Card } from "../ui/card";
import ContentSection from "./content-section";
import { NavigationControls } from "./navigation-controls";

const SectionHeader = ({ title, currentSection, totalSections }: { 
  title: string; 
  currentSection: number; 
  totalSections: number; 
}) => {
  return (
    <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl z-20 border-b border-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10 pb-4 mb-6">
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <BookOpen className="h-4 w-4" />
          <span>Section {currentSection + 1} of {totalSections}</span>
        </div>
      </div>
      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
        {title}
      </h2>
    </div>
  );
};

const ModernProgressBar = ({ sections, currentSection, onSectionSelect }: {
  sections: any[];
  currentSection: number;
  onSectionSelect: (index: number) => void;
}) => {
  return (
    <div className="px-6 pt-4 pb-2">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-4 w-4 text-rose-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary Progress</span>
      </div>
      <div className="flex gap-1">
        {sections.map((_, index) => (
          <button
            key={index}
            onClick={() => onSectionSelect(index)}
            className={`flex-1 h-2 rounded-full transition-all duration-300 ${
              index <= currentSection
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={sections[index]?.title}
          />
        ))}
      </div>
    </div>
  );
};

interface SummaryViewerProps {
  summary: string;
  pdfSummaryId?: string;
  summaryId?: string;
  className?: string;
}

export function SummaryViewer({ summary, pdfSummaryId, summaryId, className }: SummaryViewerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const effectiveSummaryId = pdfSummaryId || summaryId;

  const handleNext = () => setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
  const handlePrevious = () => setCurrentSection((prev) => Math.max(prev - 1, 0));

  // Process the summary into sections
  const sections = summary
    .split('\n**')
    .map((section, index) => {
      const [title, ...content] = section.split('\n');
      return {
        title: title.replace(/\*/g, '').trim(),
        points: content.map((line) => line.replace(/\*/g, '').trim()).filter(Boolean),
        key: `${title.trim()}-${index}`,
      };
    })
    .filter((section) => section.title && section.points.length > 0);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <Card className={`relative overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl
        w-full h-[600px] lg:h-[700px] flex flex-col ${className}`}>
        
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Modern Progress Bar */}
          <ModernProgressBar
            sections={sections}
            currentSection={currentSection}
            onSectionSelect={setCurrentSection}
          />

          {/* Section Header */}
          <div className="px-6">
            <SectionHeader 
              title={sections[currentSection]?.title || 'Loading Title...'}
              currentSection={currentSection}
              totalSections={sections.length}
            />
          </div>

          {/* Scrollable Content - Fixed height container */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="prose prose-gray dark:prose-invert max-w-none h-full">
              <ContentSection
                title={sections[currentSection]?.title || ''}
                points={sections[currentSection]?.points || []}
              />
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4">
            <NavigationControls
              currentSection={currentSection}
              totalSections={sections.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSectionSelect={setCurrentSection}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}