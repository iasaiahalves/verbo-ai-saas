'use client';

import { useNavigation } from "@/components/common/navigation-progress";
import { Card } from "@/components/ui/card";
import { cn, formatFileName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, FileText, Loader } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteButton } from "./delete-button";

const SummaryHeader = ({ fileUrl, title, createdAt }:
  { fileUrl: string, title: string | null, createdAt: string }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
        <FileText className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="font-medium text-base text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight mb-1">
          {title || formatFileName(fileUrl)}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}
  
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          icon: CheckCircle,
          className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
          text: 'Completed'
        };
      case 'processing':
        return {
          icon: Loader,
          className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
          text: 'Processing'
        };
      default:
        return {
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
          text: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full",
      config.className
    )}>
      <Icon className={cn("h-3 w-3", status === 'processing' && "animate-spin")} />
      {config.text}
    </span>
  )
}

export function SummaryCard({ summary }: { summary: any }) {
  const { startNavigation } = useNavigation();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    startNavigation();
  };

  return (
    <Card 
      className="group relative overflow-hidden border-0 bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Delete button */}
      <div className={`absolute top-4 right-4 z-10 transition-all duration-200 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
      }`}>
        <DeleteButton summaryId={summary.id} />
      </div>

      <Link 
        href={`summaries/${summary.id}`}
        className="block p-6 h-full"
        onClick={handleClick}
      >
        <div className="flex flex-col gap-4 h-full">
          {/* Header */}
          <div className="min-h-[3rem]">
            <SummaryHeader
              fileUrl={summary.original_file_url}
              title={summary.title}
              createdAt={summary.created_at}
            />
          </div>

          {/* Summary preview */}
          <div className="flex-1 min-h-[3rem]">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                {summary.summary_text || "Summary is being generated..."}
              </p>
            </div>
          </div>

          {/* Status and metadata */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
            <StatusBadge status={summary.status} />
          </div>
        </div>
      </Link>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 via-transparent to-purple-500/0 group-hover:from-rose-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
    </Card>
  )
}