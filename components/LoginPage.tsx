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
      
      // Attempt to prompt, but suppress errors if it fails due to origin issues (hard to catch here, but UI fallback helps)
      try {
        google.accounts.id.prompt();
      } catch (e) {
        console.warn("GSI prompt failed", e);
      }

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

  const handleResetClientId = () => {
      setLocalClientId('');
      localStorage.removeItem('google_client_id');
      setTempClientId('');
  };

  const handleGuestLogin = () => {
    onLoginSuccess({
        name: "Guest User",
        email: `guest_${Date.now()}@local.dev`,
        picture: "",
        sub: `guest_${Date.now()}`,
        // Token exp 24 hours
        exp: Math.floor(Date.now() / 1000) + 86400
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
        
        {/* Logo / Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Factory AI Agent</h2>
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
               
               <button 
                 onClick={handleResetClientId}
                 className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline mt-4"
               >
                 Change Client ID / Switch Method
               </button>
            </div>
          ) : (
             <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Authentication Setup</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Enter your Google Client ID to enable Google Sign-In, or continue as a guest.
                </p>
                
                <input 
                  type="text" 
                  placeholder="Client ID (e.g., 123...apps.googleusercontent.com)"
                  className="w-full text-sm p-3 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-[#10a37f] outline-none"
                  value={tempClientId}
                  onChange={e => setTempClientId(e.target.value)}
                />
                <button 
                  onClick={handleSaveClientId}
                  disabled={!tempClientId.trim()}
                  className="w-full bg-[#10a37f] text-white text-sm font-bold py-3 rounded hover:bg-[#0d8a6a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  Save & Login with Google
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <button
                    onClick={handleGuestLogin}
                    className="w-full bg-white text-gray-700 border border-gray-300 text-sm font-bold py-3 rounded hover:bg-gray-100 transition-colors mt-2"
                >
                    Continue as Guest
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