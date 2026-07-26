import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const SESSION_STORAGE_KEY = 'foodatm_active_session';

interface SessionData {
  sessionId: string;
  userName: string;
  sessionNumber: number;
  startedAt: string;
}

interface SessionContextType {
  currentSession: SessionData | null;
  startSession: (userName: string) => Promise<void>;
  endSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const validateSession = async () => {
      if (!currentSession) return;
      if (!isSupabaseConfigured || !supabase) return;

      const { data } = await supabase
        .from('sessions')
        .select('ended_at')
        .eq('id', currentSession.sessionId)
        .single();

      if (data && data.ended_at) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setCurrentSession(null);
      }
    };

    validateSession();
  }, []);

  const startSession = useCallback(async (userName: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ user_name: userName }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start session: ${error.message}`);
    }

    const session: SessionData = {
      sessionId: data.id,
      userName: data.user_name,
      sessionNumber: data.session_number,
      startedAt: data.started_at,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setCurrentSession(session);
  }, []);

  const endSession = useCallback(async () => {
    if (!currentSession) return;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', currentSession.sessionId);

      if (error) {
        console.error('Failed to end session:', error);
      }
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentSession(null);
  }, [currentSession]);

  return (
    <SessionContext.Provider value={{ currentSession, startSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
