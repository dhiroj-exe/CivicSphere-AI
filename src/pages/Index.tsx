import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Bot, Sparkles, LayoutDashboard } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none animate-pulse" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="animate-bounce" style={{ animationDuration: "2s" }}>
              <MapPin className="h-16 w-16 text-primary drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
            </div>
            <div className="animate-bounce" style={{ animationDuration: "2s", animationDelay: "0.3s" }}>
              <Globe className="h-16 w-16 text-accent drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            CivicSphere AI
          </h1>

          <p className="text-xl md:text-2xl text-foreground mb-4">
            Your Intelligent Local Assistant for India
          </p>

          <p className="text-base md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Get real-time weather updates, local news, air quality, traffic info, civic alerts,
            government schemes, and AI-powered civic advice in your language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
            >
              <Bot className="mr-2 h-5 w-5" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-primary/50 hover:bg-primary/10 text-lg px-8 py-6"
            >
              <LayoutDashboard className="mr-2 h-5 w-5" />
              View Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/chat")}
              className="border-primary/50 hover:bg-primary/10 text-lg px-8 py-6"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Chat
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: MapPin,
                title: "Location Aware",
                description: "Automatically detects your location for hyper-local information"
              },
              {
                icon: Globe,
                title: "Multilingual",
                description: "Supports 10+ Indian languages with AI-powered translation"
              },
              {
                icon: Bot,
                title: "AI-Powered",
                description: "Smart contextual advice based on real-time local data"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-lg p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <feature.icon className="h-10 w-10 text-primary mb-4 mx-auto animate-pulse" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
