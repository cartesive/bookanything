'use client';

import { useState } from 'react';

export default function EmbedPage() {
  const [venueId, setVenueId] = useState('demo-tennis-court');
  const [copied, setCopied] = useState(false);

  const embedCode = `<!-- BookAnything Widget -->
<div id="bookanything-widget" data-venue-id="${venueId}"></div>
<script src="https://yourdomain.com/embed.js"></script>
<style>
  #bookanything-widget {
    max-width: 800px;
    margin: 0 auto;
  }
</style>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Embed BookAnything</h1>
          <p className="text-lg text-gray-600">
            Add booking functionality to your website with a simple embed code
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Get Your Embed Code</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue ID
            </label>
            <input
              type="text"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your venue ID"
            />
            <p className="mt-2 text-sm text-gray-500">
              Use "demo-tennis-court" for testing
            </p>
          </div>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{embedCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Customization Options</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Customize colors with CSS variables
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Responsive design for all devices
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Multiple widgets on the same page
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                JavaScript events for integration
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Advanced Options</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-1">Custom Styling</h4>
                <p className="text-sm text-gray-600">
                  Override default styles with CSS variables
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Event Callbacks</h4>
                <p className="text-sm text-gray-600">
                  Listen to booking events with JavaScript
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Language Support</h4>
                <p className="text-sm text-gray-600">
                  Internationalization coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}