/**
 * VS Friends App Route - Main entry point for VS Friends feature
 */

import { VSFriendsView } from '@/features/VSFriends/components/VSFriendsView';

export default function VSFriendsPage() {
  return <VSFriendsView />;
}

export const metadata = {
  title: 'VS Friends - VidLiSync',
  description: 'Instant tap-to-translate conversations with friends',
};