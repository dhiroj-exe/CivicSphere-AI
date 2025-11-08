import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Send, MapPin, LogOut, Loader2, Globe, Mic, MicOff, Volume2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const INDIAN_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
];

const QUICK_SUGGESTIONS = [
  "What's the weather like today?",
  "Show me local news",
  "Check air quality in my area",
  "Tell me about government schemes",
  "Emergency contact numbers",
  "Health advisories for my location",
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ city: string; state: string; country: string } | null>(null);
  const [language, setLanguage] = useState("en");
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const globalWindow = typeof window !== 'undefined' ? (window as any) : undefined;
    if (globalWindow && (globalWindow.webkitSpeechRecognition || globalWindow.SpeechRecognition)) {
      const SpeechRecognition = globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;
      recognitionRef.current = new (SpeechRecognition as any)();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default, will be updated based on detection

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // Auto-detect language from transcript
        detectLanguageFromText(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition failed. Please try again.');
      };
    }
  }, []);

  const detectLocation = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      setLocation({
        city: data.city || "Unknown",
        state: data.region || "Unknown",
        country: data.country_name || "India",
      });
      toast.success(`Location detected: ${data.city}, ${data.region}`);
    } catch (error) {
      toast.error("Could not detect location");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const detectLanguageFromText = (text: string) => {
    // Simple language detection based on common words and characters
    const hindiChars = /[\u0900-\u097F]/;
    const bengaliChars = /[\u0980-\u09FF]/;
    const teluguChars = /[\u0C00-\u0C7F]/;
    const tamilChars = /[\u0B80-\u0BFF]/;
    const kannadaChars = /[\u0C80-\u0CFF]/;
    const malayalamChars = /[\u0D00-\u0D7F]/;
    const gujaratiChars = /[\u0A80-\u0AFF]/;
    const punjabiChars = /[\u0A00-\u0A7F]/;
    const marathiChars = /[\u0900-\u097F]/; // Same as Hindi

    if (hindiChars.test(text) || text.toLowerCase().includes('kya') || text.toLowerCase().includes('hai')) {
      setDetectedLanguage('hi');
    } else if (bengaliChars.test(text)) {
      setDetectedLanguage('bn');
    } else if (teluguChars.test(text)) {
      setDetectedLanguage('te');
    } else if (tamilChars.test(text)) {
      setDetectedLanguage('ta');
    } else if (kannadaChars.test(text)) {
      setDetectedLanguage('kn');
    } else if (malayalamChars.test(text)) {
      setDetectedLanguage('ml');
    } else if (gujaratiChars.test(text)) {
      setDetectedLanguage('gu');
    } else if (punjabiChars.test(text)) {
      setDetectedLanguage('pa');
    } else if (marathiChars.test(text)) {
      setDetectedLanguage('mr');
    } else {
      setDetectedLanguage('en');
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone access is required for voice input.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string, lang: string = 'en') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language for speech synthesis
      const languageMap: { [key: string]: string } = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'pa': 'pa-IN'
      };

      utterance.lang = languageMap[lang] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [...messages, userMessage],
          location,
          language: language, // Use selected language, detectedLanguage is for display only
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the assistant's response
      speakText(data.message, language);
    } catch (error: any) {
      toast.error(error.message || "Failed to get response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-pulse" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 container mx-auto px-4 py-6 flex flex-col h-screen max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary animate-pulse drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              <Globe className="h-6 w-6 text-accent animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CivicSphere AI
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {detectingLocation ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting location...
              </div>
            ) : location ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location.city}, {location.state}
              </div>
            ) : null}

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSignOut}
              className="border-border/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden border-border/50 bg-card/80 backdrop-blur-xl flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12 animate-fade-in">
                <div className="mb-6">
                  <p className="text-lg mb-2 font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Welcome to CivicSphere AI!
                  </p>
                  <p className="text-sm">Ask me about local weather, news, government schemes, or anything civic-related.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="text-sm hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                      onClick={() => {
                        setInput(suggestion);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                style={{ animationDelay: "0.1s" }}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground shadow-primary/20"
                      : "bg-secondary text-secondary-foreground shadow-secondary/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                    {message.role === "assistant" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={() => speakText(message.content, language)}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-3 shadow-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your city..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={loading}
                variant={isListening ? "destructive" : "outline"}
                className={isListening ? "animate-pulse" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {detectedLanguage !== 'en' && (
              <div className="text-xs text-muted-foreground mt-2">
                Detected language: {INDIAN_LANGUAGES.find(lang => lang.code === detectedLanguage)?.name || 'English'}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
