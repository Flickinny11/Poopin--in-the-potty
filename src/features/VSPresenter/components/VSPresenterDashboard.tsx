/**
 * VS Presenter Dashboard - Main presentation interface
 * Professional presenter controls with real-time participant management
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useVSPresenterStore } from '../stores/vsPresenterStore';
import { PresenterSetup } from './PresenterSetup';
import { ActivePresentation } from './ActivePresentation';
import { PresentationEnded } from './PresentationEnded';

export const VSPresenterDashboard: React.FC = () => {
  const { presentationState } = useVSPresenterStore();

  // Render appropriate component based on presentation state
  switch (presentationState) {
    case 'setup':
      return <PresenterSetup />;
    case 'active':
      return <ActivePresentation />;
    case 'ended':
      return <PresentationEnded />;
    default:
      return <PresenterSetup />;
  }
};