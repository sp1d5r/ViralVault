import React, {
    createContext, useContext, ReactNode, useState, useEffect, useMemo,
  } from 'react';
  
  interface DarkModeState {
    darkMode: boolean;
  }
  
  interface DarkModeContextProps {
    darkModeState: DarkModeState;
  }
  
  const DarkModeContext = createContext<DarkModeContextProps | undefined>(undefined);
  
  interface DarkModeProviderProps {
    children: ReactNode;
  }
  
  // Dark Mode Provider component
  export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
    const [darkModeState] = useState<DarkModeState>({ darkMode: true });
  
    useEffect(() => {
      document.documentElement.classList.add('dark');
    }, []); // Only runs once on mount
  
    const value = useMemo(() => ({
      darkModeState,
    }), [darkModeState]);
  
    return (
      <DarkModeContext.Provider value={value}>
        {children}
      </DarkModeContext.Provider>
    );
  };
  
  // Custom hook to use the dark mode context
  export const useDarkMode = () => {
    const context = useContext(DarkModeContext);
    if (!context) {
      throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
  };