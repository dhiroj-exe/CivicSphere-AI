import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LogOut,
  Sparkles,
  LayoutDashboard
} from "lucide-react";

interface LocationData {
  city: string;
  state: string;
  country: string;
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("en");
  const [weather, setWeather] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any>(null);
  const [dataErrors, setDataErrors] = useState<{[key: string]: boolean}>({});
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };

    checkAuth();
    detectLocation();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    const errors: {[key: string]: boolean} = {};

    try {
      // Fetch all data in parallel with individual error handling
      const results = await Promise.allSettled([
        fetchWeather(city),
        fetchAqi(city),
        fetchNews(city),
        fetchAlerts(city),
        fetchEvents(city),
        fetchTraffic(city),
      ]);

      const [weatherResult, aqiResult, newsResult, alertsResult, eventsResult, trafficResult] = results;

      if (weatherResult.status === 'fulfilled') {
        setWeather(weatherResult.value);
      } else {
        errors.weather = true;
        setWeather({
          temperature: 25,
          condition: "Data unavailable",
          humidity: 60,
          wind_speed: 10,
        });
      }

      if (aqiResult.status === 'fulfilled') {
        setAqi(aqiResult.value);
      } else {
        errors.aqi = true;
        setAqi({
          aqi: 50,
          level: "Unknown",
          recommendation: "Air quality data temporarily unavailable",
        });
      }

      if (newsResult.status === 'fulfilled') {
        setNews(newsResult.value);
      } else {
        errors.news = true;
        setNews([]);
      }

      if (alertsResult.status === 'fulfilled') {
        setAlerts(alertsResult.value);
      } else {
        errors.alerts = true;
        setAlerts([]);
      }

      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value);
      } else {
        errors.events = true;
        setEvents([]);
      }

      if (trafficResult.status === 'fulfilled') {
        setTraffic(trafficResult.value);
      } else {
        errors.traffic = true;
        setTraffic({
          trafficLevel: "Unknown",
          recommendation: "Traffic data temporarily unavailable",
          publicTransit: { types: [] },
        });
      }

      setDataErrors(errors);

      if (Object.keys(errors).length > 0) {
        toast.error(`Some data sources are temporarily unavailable (${Object.keys(errors).length} failed)`);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (city: string) => {
    try {
      // Use OpenWeatherMap API or similar for structured weather data
      const apiKey = "demo_key"; // In production, use environment variable
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].main,
          humidity: data.main.humidity,
          wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        };
      }

      // Fallback to mock data if API fails
      return {
        temperature: Math.floor(Math.random() * 15) + 20,
        condition: ["Sunny", "Cloudy", "Rainy", "Clear"][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 30) + 40,
        wind_speed: Math.floor(Math.random() * 20) + 5,
      };
    } catch (error) {
      // Return mock data on error
      return {
        temperature: 28,
        condition: "Sunny",
        humidity: 65,
        wind_speed: 12,
      };
    }
  };

  const fetchAqi = async (city: string) => {
    try {
      // Use WAQI API or similar for air quality data
      const response = await fetch(`https://api.waqi.info/feed/${city}/?token=demo_token`);

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const aqi = data.data.aqi;
          let level = "Good";
          let recommendation = "Air quality is good. Enjoy outdoor activities!";

          if (aqi > 50) {
            level = "Moderate";
            recommendation = "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.";
          } else if (aqi > 100) {
            level = "Unhealthy for Sensitive Groups";
            recommendation = "People with respiratory or heart conditions should limit outdoor exertion.";
          } else if (aqi > 150) {
            level = "Unhealthy";
            recommendation = "Everyone should limit outdoor exertion.";
          } else if (aqi > 200) {
            level = "Very Unhealthy";
            recommendation = "Everyone should avoid outdoor exertion.";
          } else if (aqi > 300) {
            level = "Hazardous";
            recommendation = "Everyone should avoid all outdoor exertion.";
          }

          return { aqi, level, recommendation };
        }
      }

      // Fallback to mock data
      const mockAqi = Math.floor(Math.random() * 150) + 20;
      let level = "Good";
      let recommendation = "Air quality is good. Enjoy outdoor activities!";

      if (mockAqi > 50) {
        level = "Moderate";
        recommendation = "Air quality is acceptable.";
      }

      return { aqi: mockAqi, level, recommendation };
    } catch (error) {
      return {
        aqi: 45,
        level: "Good",
        recommendation: "Air quality is good. Enjoy outdoor activities!"
      };
    }
  };

  const fetchNews = async (city: string) => {
    try {
      // Use NewsAPI or similar for news data
      const apiKey = "demo_key";
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${city}&apiKey=${apiKey}&pageSize=5&sortBy=publishedAt`
      );

      if (response.ok) {
        const data = await response.json();
        return data.articles?.map((article: any) => ({
          title: article.title,
          source: article.source.name,
          url: article.url,
        })) || [];
      }

      // Fallback to mock news data
      return [
        {
          title: `${city} sees new development in infrastructure`,
          source: "Local News",
        },
        {
          title: `Community event planned for ${city} residents`,
          source: "City Gazette",
        },
        {
          title: `Weather update: Conditions improving in ${city}`,
          source: "Weather News",
        },
      ];
    } catch (error) {
      return [
        {
          title: `${city} local news unavailable`,
          source: "Offline",
        },
      ];
    }
  };

  const fetchAlerts = async (city: string) => {
    try {
      // Mock civic alerts data - in production, this could come from government APIs
      const alerts = [
        {
          title: "Road Maintenance Notice",
          description: "Main road will be closed for repairs this weekend",
        },
        {
          title: "Water Supply Interruption",
          description: "Scheduled maintenance in sector 5 tomorrow",
        },
        {
          title: "Health Advisory",
          description: "Pollen count high - allergy sufferers take precautions",
        },
      ];

      // Return random subset of alerts
      const numAlerts = Math.floor(Math.random() * 3) + 1;
      return alerts.slice(0, numAlerts);
    } catch (error) {
      return [];
    }
  };

  const fetchEvents = async (city: string) => {
    try {
      // Mock local events data
      const events = [
        {
          title: "Community Health Camp",
          category: "Health",
          organizer: "City Health Department",
        },
        {
          title: "Cultural Festival",
          category: "Culture",
          organizer: "Arts Council",
        },
        {
          title: "Farmers Market",
          category: "Commerce",
          organizer: "Local Business Association",
        },
        {
          title: "Environmental Awareness Workshop",
          category: "Education",
          organizer: "Green Initiative",
        },
      ];

      // Return random subset of events
      const numEvents = Math.floor(Math.random() * 3) + 1;
      return events.slice(0, numEvents);
    } catch (error) {
      return [];
    }
  };

  const fetchTraffic = async (city: string) => {
    try {
      // Mock traffic data
      const trafficLevels = ["Light", "Moderate", "Heavy", "Very Heavy"];
      const recommendations = [
        "Traffic is flowing smoothly. Safe travels!",
        "Some congestion expected. Plan extra time for your journey.",
        "Heavy traffic conditions. Consider alternative routes or public transport.",
        "Severe congestion. Avoid travel if possible or use public transportation.",
      ];

      const randomIndex = Math.floor(Math.random() * trafficLevels.length);

      return {
        trafficLevel: trafficLevels[randomIndex],
        recommendation: recommendations[randomIndex],
        publicTransit: {
          types: ["Bus", "Metro", "Auto-rickshaw", "Taxi"],
        },
      };
    } catch (error) {
      return {
        trafficLevel: "Moderate",
        recommendation: "Traffic conditions are normal.",
        publicTransit: {
          types: ["Bus", "Metro"],
        },
      };
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim()) return;
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [{ role: "user", content: aiQuestion }],
          location,
          language,
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
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-pulse" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="relative z-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none animate-pulse" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 container mx-auto px-4 py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary animate-pulse drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
              <Cloud className="h-6 w-6 text-accent animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CivicSphere AI Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {location.city}, {location.state}
              </div>
            )}

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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Weather Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
                    {dataErrors.weather && (
                      <div className="flex items-center gap-1 text-xs text-orange-500 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        Data may be outdated
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading weather...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Air Quality Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
                    {dataErrors.aqi && (
                      <div className="flex items-center gap-1 text-xs text-orange-500 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        Data may be outdated
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading AQI...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Traffic Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
                    {dataErrors.traffic && (
                      <div className="flex items-center gap-1 text-xs text-orange-500 mt-2">
                        <AlertTriangle className="w-3 h-3" />
                        Data may be outdated
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading traffic...</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Civic Alerts Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in">
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
          <Card className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                AI Contextual Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && askAI()}
                  placeholder="Ask anything about your local area..."
                  disabled={aiLoading}
                  className="flex-1"
                />
                <Button onClick={askAI} disabled={aiLoading || !aiQuestion.trim()}>
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="mt-16 flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/chat")}
            className="border-primary/50 hover:bg-primary/10"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Go to Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchAllData(location?.city || "India")}
            className="border-primary/50 hover:bg-primary/10"
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Refresh Data
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
