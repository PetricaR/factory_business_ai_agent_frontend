import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '../constants';
import type { GoogleUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: GoogleUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const googleButtonWrapperRef = useRef<HTMLDivElement>(null);
  const [localClientId, setLocalClientId] = useState(() => localStorage.getItem('google_client_id') || '');
  const [tempClientId, setTempClientId] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  const effectiveClientId = GOOGLE_CLIENT_ID || localClientId;

  // Check for Google Script Load
  useEffect(() => {
    const checkScript = () => {
      if ((window as any).google?.accounts?.id) {
        setScriptLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkScript()) {
      const interval = setInterval(() => {
        if (checkScript()) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Helper to decode JWT
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to parse JWT", e);
      return null;
    }
  };

  useEffect(() => {
    if (!effectiveClientId || !scriptLoaded || !(window as any).google) return;

    const google = (window as any).google;

    try {
      google.accounts.id.initialize({
        client_id: effectiveClientId,
        callback: (response: any) => {
          const decoded = parseJwt(response.credential);
          if (decoded) {
            onLoginSuccess({
              name: decoded.name,
              email: decoded.email,
              picture: decoded.picture,
              sub: decoded.sub,
              exp: decoded.exp
            });
          }
        },
        auto_select: true,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
        context: 'signin',
        ux_mode: 'popup'
      });

      if (googleButtonWrapperRef.current) {
         googleButtonWrapperRef.current.innerHTML = '';
         google.accounts.id.renderButton(
            googleButtonWrapperRef.current,
            { 
              theme: "filled_blue", 
              size: "large", 
              text: "continue_with", 
              shape: "rectangular",
              width: "300",
              logo_alignment: "left"
            } 
         );
      }
      
      google.accounts.id.prompt();

    } catch (err) {
      console.error("Google Auth Init Error:", err);
    }

    return () => {
      if (google?.accounts?.id) {
        google.accounts.id.cancel();
      }
    };
  }, [effectiveClientId, scriptLoaded, onLoginSuccess]);

  const handleSaveClientId = () => {
    if (tempClientId.trim()) {
      localStorage.setItem('google_client_id', tempClientId.trim());
      setLocalClientId(tempClientId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        
        {/* Logo / Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
             <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 10H6C4.89543 10 4 10.8954 4 12V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12C20 10.8954 19.1046 10 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 4H12.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Factory AI Agent</h2>
          <p className="mt-2 text-sm text-gray-500">
            Romanian Business Intelligence Multi-Agent System
          </p>
        </div>

        {/* Login Section */}
        <div className="mt-8">
          {effectiveClientId ? (
            <div className="flex flex-col items-center space-y-4">
               <div ref={googleButtonWrapperRef} className="h-[44px] w-[300px] flex justify-center"></div>
               <p className="text-xs text-gray-400">Secure access via Google Identity</p>
            </div>
          ) : (
             <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 mb-2">Configuration Required</h3>
                <p className="text-xs text-blue-700 mb-4">
                  Please enter your Google Client ID to enable authentication.
                </p>
                <input 
                  type="text" 
                  placeholder="Client ID (e.g., 123...apps.googleusercontent.com)"
                  className="w-full text-sm p-3 border border-blue-200 rounded mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={tempClientId}
                  onChange={e => setTempClientId(e.target.value)}
                />
                <button 
                  onClick={handleSaveClientId}
                  disabled={!tempClientId.trim()}
                  className="w-full bg-blue-600 text-white text-sm font-bold py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save Configuration
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Factory AI. All rights reserved.</p>
      </div>
    </div>
  );
};