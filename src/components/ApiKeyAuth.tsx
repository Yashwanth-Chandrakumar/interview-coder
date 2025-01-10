import { useState, useRef, useEffect } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface ApiKeyAuthProps {
  onApiKeySubmit: (config: ApiKeyConfig) => void
}

interface ApiKeyConfig {
  provider: 'openai' | 'gemini' | 'groq';
  apiKey: string;
}

const ApiKeyAuth: React.FC<ApiKeyAuthProps> = ({ onApiKeySubmit }) => {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini' | 'groq'>('openai')
  const [apiKey, setApiKey] = useState("")
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onApiKeySubmit({
        provider: selectedProvider,
        apiKey: apiKey.trim()
      })
    }
  }

  const handleOpenLink = (url: string) => {
    window.electronAPI.openExternal(url)
  }

  const getKeyPlaceholder = () => {
    switch (selectedProvider) {
      case 'openai': return 'sk-...'
      case 'gemini': return 'AI...'
      case 'groq': return 'gsk_...'
      default: return 'Enter API Key'
    }
  }

  return (
    <div
      ref={contentRef}
      className="w-fit h-fit flex flex-col items-center justify-center bg-gray-50 rounded-xl"
    >
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-center">
            Welcome to Interview Coder
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Please select an AI provider and enter your API key to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Select
                value={selectedProvider}
                onValueChange={(value: 'openai' | 'gemini' | 'groq') => setSelectedProvider(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="password"
                placeholder={getKeyPlaceholder()}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={!apiKey.trim()}
            >
              Continue
            </Button>
            <p className="text-gray-400 text-xs text-center pt-2">
              built out of frustration by{" "}
              <button
                onClick={() =>
                  handleOpenLink("https://www.linkedin.com/in/roy-lee-cs123")
                }
                className="text-gray-400 hover:text-gray-600 underline"
              >
                Roy
              </button>{" "}
              n'{" "}
              <button
                onClick={() =>
                  handleOpenLink("https://www.linkedin.com/in/neel-shanmugam/")
                }
                className="text-gray-400 hover:text-gray-600 underline"
              >
                Neel
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApiKeyAuth
