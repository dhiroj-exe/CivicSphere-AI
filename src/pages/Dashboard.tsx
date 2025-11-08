import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Cloud,
  Wind,
  Droplets,
  AlertTriangle,
  Calendar,
  Car,
  MessageSquare,
  MapPin,
  Loader2,
  Newspaper,
  HeartPulse,
  LogOut
} from "lucide-react";

interface LocationData {
  city: string;
  state: string;
  country: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    detectLocation();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
  };

  const detectLocation = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      const locationData = {
        city: data.city || "India",
        state: data.region || "",
        country: data.country_name || "India",
      };
      setLocation(locationData);
      await fetchAllData(locationData.city);
    } catch (error) {
      console.error("Location detection error:", error);
      setLocation({ city: "India", state: "", country: "India" });
      await fetchAllData("India");
    }
  };

  const fetchAllData = async (city: string) => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [weatherData, aqiData, newsData, alertData, eventsData, trafficData] = await Promise.all([
        fetchWeather(city),
        fetchAqi(city),
        fetchNews(city),
        fetchAlerts(city),
        fetchEvents(city),
        fetchTraffic(city),
      ]);

      setWeather(weatherData);
      setAqi(aqiData);
      setNews(newsData);
      setAlerts(alertData);
      setEvents(eventsData);
      setTraffic(trafficData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch some data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get current weather for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data;
  };

  const fetchAqi = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get air quality for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data;
  };

  const fetchNews = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get latest news for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data?.articles || [];
  };

  const fetchAlerts = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get civic alerts for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data?.alerts || [];
  };

  const fetchEvents = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get local events for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data?.events || [];
  };

  const fetchTraffic = async (city: string) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        messages: [{ role: "user", content: `Get traffic info for ${city}` }],
        location: { city, state: "", country: "India" },
        language: "en",
      },
    });
    if (error) throw error;
    return data;
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: aiQuestion }],
          location,
          language: "en",
        },
      });
      
      if (error) throw error;
      toast.success("AI Response", { description: data.message });
      setAiQuestion("");
    } catch (error) {
      console.error("AI question error:", error);
      toast.error("Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getAqiColor = (level: string) => {
    const colors: { [key: string]: string } = {
      "Good": "text-green-600",
      "Moderate": "text-yellow-600",
      "Unhealthy for Sensitive Groups": "text-orange-600",
      "Unhealthy": "text-red-600",
      "Very Unhealthy": "text-purple-600",
      "Hazardous": "text-rose-900"
    };
    return colors[level] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Smart Local Situation Lens
            </h1>
            {location && (
              <p className="text-muted-foreground flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" />
                {location.city}, {location.state}
              </p>
            )}
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Weather Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{weather.temperature}°C</p>
                    <p className="text-muted-foreground">{weather.condition}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-4 h-4" />
                        {weather.humidity}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-4 h-4" />
                        {weather.wind_speed} km/h
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading weather...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Air Quality Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-green-500" />
                  Air Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aqi ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">{aqi.aqi}</p>
                    <p className={`font-semibold ${getAqiColor(aqi.level)}`}>{aqi.level}</p>
                    <p className="text-sm text-muted-foreground">{aqi.recommendation}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading AQI...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Traffic Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-orange-500" />
                  Traffic
                </CardTitle>
              </CardHeader>
              <CardContent>
                {traffic ? (
                  <div className="space-y-2">
                    <p className="text-2xl font-bold">{traffic.trafficLevel}</p>
                    <p className="text-sm text-muted-foreground">{traffic.recommendation}</p>
                    <div className="text-sm">
                      <p className="font-medium">Public Transit:</p>
                      <p className="text-muted-foreground">{traffic.publicTransit?.types.join(", ")}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading traffic...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Civic Alerts Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Civic Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 2).map((alert, idx) => (
                      <div key={idx} className="border-l-2 border-red-500 pl-3">
                        <p className="font-semibold text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active alerts</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Local Events Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Local Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 2).map((event, idx) => (
                      <div key={idx}>
                        <p className="font-semibold text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.category} • {event.organizer}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming events</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* News Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-indigo-500" />
                  Latest News
                </CardTitle>
              </CardHeader>
              <CardContent>
                {news.length > 0 ? (
                  <div className="space-y-3">
                    {news.slice(0, 2).map((article, idx) => (
                      <div key={idx}>
                        <p className="font-semibold text-sm line-clamp-2">{article.title}</p>
                        <p className="text-xs text-muted-foreground">{article.source}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading news...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Advice Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                AI Contextual Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask anything about your local area..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && askAI()}
                  className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"
                />
                <Button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate("/chat")}>
            Go to Chat
          </Button>
          <Button variant="outline" onClick={() => fetchAllData(location?.city || "India")}>
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
