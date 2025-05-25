'use client';

import { useState } from "react";
import { Card } from "../ui/card";
import { ChatOption } from "./chat-option";
import ContentSection from "./content-section";
import { NavigationControls } from "./navigation-controls";
import ProgressBar from "./progress-bar";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="sticky top-0 pt-2 pb-4 bg-background/95 backdrop-blur-md z-20 border-b border-rose-500/10 mb-6">
      <h2 className="text-3xl lg:text-4xl font-bold text-center flex items-center justify-center gap-2">
        {title}
      </h2>
    </div>
  );
};

interface SummaryViewerProps {
  summary: string;
  pdfSummaryId?: string; // Make pdfSummaryId optional
  summaryId?: string; // For backward compatibility
  className?: string; // Add className for styling
}

export function SummaryViewer({ summary, pdfSummaryId, summaryId, className }: SummaryViewerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const effectiveSummaryId = pdfSummaryId || summaryId; // Use whichever is provided

  const handleNext = () => setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
  const handlePrevious = () => setCurrentSection((prev) => Math.max(prev - 1, 0));

  // Process the summary into sections
  const sections = summary
    .split('\n**') // Adjusted to split by '**' for bold section titles
    .map((section, index) => {
      const [title, ...content] = section.split('\n'); // Extract title and content
      return {
        title: title.replace(/\*/g, '').trim(), // Remove all '*' characters from the title
        points: content.map((line) => line.replace(/\*/g, '').trim()).filter(Boolean), // Remove '*' from points and trim
        key: `${title.trim()}-${index}`, // Create a unique key by combining title and index
      };
    })
    .filter((section) => section.title && section.points.length > 0); // Filter out empty sections

  return (
    <Card className={`relative px-2 h-[500px] sm:h-[600px] lg:h-[700px]
    w-full xl:w-[600px] overflow-hidden bg-gradient-to-br from-background via-background/95 to-rose-500/5 backdrop-blur-lg shadow-2xl rounded-3xl border border-rose-500/10
    flex flex-col ${className}`}>
      {/* ProgressBar at the top */}
      <ProgressBar
        sections={sections}
        currentSection={currentSection}
      />

      {/* SectionTitle */}
      <div className="px-4 sm:px-6 pt-4">
        <SectionTitle title={sections[currentSection]?.title || 'Loading Title...'} />
      </div>

      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto scrollbar-hide pb-20 sm:pb-24">
        <div className="px-4 sm:px-6">
          <ContentSection
            title={sections[currentSection]?.title || ''}
            points={sections[currentSection]?.points || []}
          />
        </div>
      </div>

      {/* NavigationControls at the bottom */}
      <NavigationControls
        currentSection={currentSection}
        totalSections={sections.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSectionSelect={setCurrentSection}
      />

    {/* ChatOption positioned above NavigationControls, but only in summary view (not chat view) */}
      {effectiveSummaryId && (
        <ChatOption pdfSummaryId={effectiveSummaryId} className="bottom-24 right-4 sm:bottom-28" />
      )}
    </Card>
  );
}