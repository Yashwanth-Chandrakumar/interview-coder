import React from "react"
import { supabase } from "../../lib/supabase"

interface LanguageSelectorProps {
  currentLanguage: string
  setLanguage: (language: string) => void
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  setLanguage
}) => {
  const handleLanguageChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLanguage = e.target.value
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
      } else {
        window.__LANGUAGE__ = newLanguage
        setLanguage(newLanguage)
      }
    }
  }

  return (
    <div className="mb-3 px-2 space-y-1">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/90 cursor-default">
        <span>Language</span>
        <select
          value={currentLanguage}
          onChange={handleLanguageChange}
          className="bg-white/10 rounded px-2 py-1 text-sm outline-none border border-white/10 focus:border-white/20 hover:bg-white/20 transition-colors cursor-default appearance-none"
          style={{ 
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
            appearance: 'menulist'
          }}
        >
          <option value="python" className="cursor-default bg-black/80">Python</option>
          <option value="javascript" className="cursor-default bg-black/80">JavaScript</option>
          <option value="java" className="cursor-default bg-black/80">Java</option>
          <option value="golang" className="cursor-default bg-black/80">Go</option>
          <option value="cpp" className="cursor-default bg-black/80">C++</option>
          <option value="swift" className="cursor-default bg-black/80">Swift</option>
          <option value="kotlin" className="cursor-default bg-black/80">Kotlin</option>
          <option value="ruby" className="cursor-default bg-black/80">Ruby</option>
          <option value="sql" className="cursor-default bg-black/80">SQL</option>
        </select>
      </div>
    </div>
  )
}
