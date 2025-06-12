/**
 * VS Presenter Page - Entry point for presentations
 */
'use client';

import { Suspense } from 'react';
import { VSPresenterDashboard } from '@/features/VSPresenter/components/VSPresenterDashboard';

function VSPresenterPageContent() {
  return <VSPresenterDashboard />;
}

export default function VSPresenterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading VS Presenter...</p>
        </div>
      </div>
    }>
      <VSPresenterPageContent />
    </Suspense>
  );
}