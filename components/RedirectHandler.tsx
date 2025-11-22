import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Icons } from './Icons';

interface RedirectHandlerProps {
  shortCode: string;
}

const RedirectHandler: React.FC<RedirectHandlerProps> = ({ shortCode }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'offline'>('loading');

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // 1. Check LocalStorage Cache first
        const cache = localStorage.getItem('link_cache');
        if (cache) {
          const parsedCache = JSON.parse(cache);
          if (parsedCache[shortCode]) {
            // Fire and forget click increment to Firestore to not block redirect
            updateDoc(doc(db, 'links', shortCode), { clicks: increment(1) }).catch(console.error);
            
            // Immediate Redirect
            window.location.href = parsedCache[shortCode];
            return;
          }
        }

        // 2. Check Firestore
        const docRef = doc(db, 'links', shortCode);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const originalUrl = data.originalUrl;

          // Update cache
          const newCache = cache ? JSON.parse(cache) : {};
          newCache[shortCode] = originalUrl;
          localStorage.setItem('link_cache', JSON.stringify(newCache));

          // Increment stats
          await updateDoc(docRef, { clicks: increment(1) });

          // Redirect
          window.location.href = originalUrl;
        } else {
          setStatus('error');
        }
      } catch (error: any) {
        console.error("Redirect error:", error);
        // Handle various offline error codes/messages from Firestore SDK
        if (
          error?.code === 'unavailable' || 
          error?.message?.includes('offline') ||
          error?.message?.includes('Failed to get document')
        ) {
          setStatus('offline');
        } else {
          setStatus('error');
        }
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Icons.Alert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Link Not Found</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">The short link you are trying to access does not exist or has expired.</p>
        <button 
          onClick={() => window.location.hash = ''}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Icons.Alert className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">You are Offline</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 text-center">
          We couldn't verify this link because there is no internet connection.<br/>
          Please check your network and try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Icons.Loader className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 animate-pulse">Redirecting...</p>
    </div>
  );
};

export default RedirectHandler;