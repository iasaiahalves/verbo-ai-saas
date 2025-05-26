'use client';

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
        <h2 className="text-2xl font-bold">Loading pricing options...</h2>
        <p className="text-gray-500">Just a moment while we prepare our best offers for you</p>
      </div>
    </div>
  );
}
