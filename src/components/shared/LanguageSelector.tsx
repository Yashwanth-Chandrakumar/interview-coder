import React, { useEffect } from "react"
import { supabase } from "../../lib/supabase"

interface LanguageSelectorProps {
  currentLanguage: string
  setLanguage: (language: string) => void
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  setLanguage
}) => {
  useEffect(() => {
    // Listen for language change events from main process
    const unsubscribe = window.electronAPI.onLanguageChange((newLanguage: string) => {
      handleLanguageChange(newLanguage);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase
          .from("subscriptions")
          .update({ preferred_language: newLanguage })
          .eq("user_id", user.id)

        if (error) {
          console.error("Error updating language:", error)
        }
      }
      
      // Set the global language variable and update state
      window.__LANGUAGE__ = newLanguage
      setLanguage(newLanguage)
      
    } catch (error) {
      console.error("Error in language change:", error)
    }
  }

  const languages = [
    { value: 'python', label: 'Python', shortcut: 'Alt+P' },
    { value: 'cpp', label: 'C++', shortcut: 'Alt+C' },
    { value: 'java', label: 'Java', shortcut: 'Alt+J' }
  ]

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex flex-col gap-2 text-[13px] font-medium text-white/90">
        <span>Language</span>
        <div className="space-y-2">
          {languages.map(({ value, label, shortcut }) => (
            <label 
              key={value} 
              className="flex items-center group select-none"
            >
              <input
                type="radio"
                name="language"
                value={value}
                checked={currentLanguage === value}
                onChange={() => handleLanguageChange(value)}
                className="mr-2 cursor-default"
                style={{ cursor: 'default' }}
              />
                <span className="cursor-default">{label}</span>
              <span className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {shortcut}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
