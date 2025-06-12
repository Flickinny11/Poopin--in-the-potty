/**
 * Instructions Modal Component
 */

'use client';

import React from 'react';
import { X, Smartphone, Headphones, Users, Zap } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export function InstructionsModal({ onClose }: InstructionsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">How VS Friends Works</h2>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 transition-colors duration-200 rounded-lg p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="bg-blue-500/20 rounded-full p-3 flex-shrink-0">
              <Headphones className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">1. Put on Earbuds</h3>
              <p className="text-white/70 text-sm">
                VS Friends works best with earbuds or headphones. This prevents echo 
                and ensures clear private conversation.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="bg-purple-500/20 rounded-full p-3 flex-shrink-0">
              <Smartphone className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">2. Tap Phones Together</h3>
              <p className="text-white/70 text-sm">
                Make sure your friend also opens VS Friends. Bring your phones close 
                together (within 6 inches) and tap &quot;Add Friends&quot; when you see their device.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="bg-green-500/20 rounded-full p-3 flex-shrink-0">
              <Users className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">3. Start Talking</h3>
              <p className="text-white/70 text-sm">
                Once connected, speak naturally in your language. Your friends will 
                hear you translated into their preferred language with your voice.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="bg-orange-500/20 rounded-full p-3 flex-shrink-0">
              <Zap className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">4. Enjoy the Magic</h3>
              <p className="text-white/70 text-sm">
                No turn-taking, no delays. Have natural conversations with people 
                who speak different languages as if you all spoke the same language.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/5 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-white mb-3">✨ Key Features</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• <strong>Real-time translation</strong> - No waiting, instant communication</li>
              <li>• <strong>Voice cloning</strong> - Keep your unique voice in any language</li>
              <li>• <strong>2-4 people</strong> - Group conversations supported</li>
              <li>• <strong>50+ languages</strong> - Communicate with anyone, anywhere</li>
              <li>• <strong>Minimal UI</strong> - Screen can be off during conversation</li>
              <li>• <strong>Privacy first</strong> - Everything happens on your device</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-blue-500/10 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">💡 Pro Tips</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Speak at normal volume - the AI adapts to your voice</li>
              <li>• Keep earbuds in for the best audio quality</li>
              <li>• Tap the screen during conversation to access controls</li>
              <li>• Language settings are remembered for next time</li>
              <li>• Works great for travelers, business meetings, and social events</li>
            </ul>
          </div>

          {/* Privacy Note */}
          <div className="bg-green-500/10 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">🔒 Privacy & Billing</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Only the conversation starter is billed</li>
              <li>• Audio is processed locally when possible</li>
              <li>• No conversations are stored after they end</li>
              <li>• Free tier includes 5 minutes per month</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 text-center">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 px-6 py-3 rounded-lg font-semibold text-white"
          >
            Got it, let&apos;s start!
          </button>
        </div>
      </div>
    </div>
  );
}