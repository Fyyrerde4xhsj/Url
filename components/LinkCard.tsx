import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icons } from './Icons';
import { LinkData } from '../types';

interface LinkCardProps {
  link: LinkData;
  baseUrl: string;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, baseUrl }) => {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortUrl = `${baseUrl}/#${link.shortCode}`;
  const backendUrl = `${baseUrl}/r/${link.shortCode}`; // For display info only

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    // Handle Firestore Timestamp or JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-primary-600 dark:text-primary-400 text-lg truncate">
              /{link.shortCode}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {link.clicks} clicks
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-3" title={link.originalUrl}>
            {link.originalUrl}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Created: {formatDate(link.createdAt)}
          </p>
        </div>

        <div className="flex gap-2 ml-4">
           <button 
            onClick={() => setShowQr(!showQr)}
            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Show QR Code"
          >
            <Icons.QrCode size={20} />
          </button>
          <button 
            onClick={handleCopy}
            className={`p-2 transition-colors rounded-lg ${copied ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            title="Copy Link"
          >
            {copied ? <Icons.Check size={20} /> : <Icons.Copy size={20} />}
          </button>
        </div>
      </div>

      {showQr && (
        <div className="mt-4 flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="bg-white p-2 rounded shadow-sm">
            <QRCodeSVG value={shortUrl} size={128} />
          </div>
          <span className="text-xs text-gray-500 mt-2">Scan to visit</span>
        </div>
      )}
    </div>
  );
};

export default LinkCard;
