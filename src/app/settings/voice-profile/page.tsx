/**
 * Voice Profile Setup Page Route
 * Dedicated page for voice profile training
 */
'use client';

import { useRouter } from 'next/navigation';
import VoiceProfileSetup from '@/components/Settings/VoiceProfileSetup';

export default function VoiceProfileSetupPage() {
  const router = useRouter();

  const handleComplete = (profileId: string) => {
    router.push('/settings?section=account&success=voice-profile-trained');
  };

  const handleCancel = () => {
    router.push('/settings?section=account');
  };

  return (
    <VoiceProfileSetup 
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}