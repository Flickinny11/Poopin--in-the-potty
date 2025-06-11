/**
 * Keyboard Shortcuts Modal Component
 */
'use client';

import { Fragment } from 'react';
import { XIcon, KeyboardIcon } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Call Controls',
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'D'], description: 'Toggle microphone' },
      { keys: ['Cmd/Ctrl', 'E'], description: 'Toggle camera' },
      { keys: ['Cmd/Ctrl', 'S'], description: 'Toggle screen share' },
      { keys: ['Space'], description: 'Push to talk (when muted)' },
    ],
  },
  {
    category: 'Interface',
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'K'], description: 'Show keyboard shortcuts' },
      { keys: ['Escape'], description: 'Exit fullscreen' },
      { keys: ['P'], description: 'Toggle participants panel' },
      { keys: ['C'], description: 'Toggle chat' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Tab'], description: 'Navigate between controls' },
      { keys: ['Enter'], description: 'Activate focused control' },
      { keys: ['?'], description: 'Show help' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <KeyboardIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 id="shortcuts-title" className="text-xl font-semibold text-gray-900">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              aria-label="Close shortcuts modal"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-80">
            <div className="space-y-6">
              {shortcuts.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, shortcutIndex) => (
                      <div 
                        key={shortcutIndex}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-gray-700">{shortcut.description}</span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-gray-400 text-sm">+</span>
                              )}
                              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                                {key}
                              </kbd>
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Accessibility note */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Accessibility Features
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• All controls are keyboard accessible</li>
                <li>• Screen reader announcements for all actions</li>
                <li>• High contrast mode available in settings</li>
                <li>• Focus indicators for all interactive elements</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-200 border rounded">Cmd/Ctrl + K</kbd> anytime to view these shortcuts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}