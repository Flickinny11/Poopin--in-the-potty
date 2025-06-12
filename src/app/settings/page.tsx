/**
 * Settings Page Route
 * Main settings page with comprehensive configuration options
 */
import SettingsPage from '@/components/Settings/SettingsPage';

export default function Settings() {
  return <SettingsPage />;
}

export const metadata = {
  title: 'Settings - VidLiSync',
  description: 'Configure your VidLiSync preferences and settings',
};