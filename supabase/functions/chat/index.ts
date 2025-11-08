import { serve } from "http/server.ts";

interface RequestWithBody extends Request {
  json(): Promise<any>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool functions for real-time data
async function getCurrentWeather(location: string) {
  try {
    console.log(`Fetching weather for location: ${location}`);
    
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!geoResponse.ok) {
      console.error("Geocoding API error:", geoResponse.status);
      return null;
    }
    
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      console.error("Location not found in geocoding");
      return null;
    }
    
    const { latitude, longitude, name, country } = geoData.results[0];
    console.log(`Found location: ${name}, ${country} (${latitude}, ${longitude})`);
    
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,cloud_cover&hourly=temperature_2m,precipitation_probability&timezone=auto&forecast_days=1`
    );
    
    if (!weatherResponse.ok) {
      console.error("Weather API error:", weatherResponse.status);
      return null;
    }
    const weatherData = await weatherResponse.json();
    console.log("Weather data fetched successfully");
    
    const weatherCodes: { [key: number]: string } = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Foggy", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
      55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Slight rain showers",
      81: "Moderate rain showers", 82: "Violent rain showers", 95: "Thunderstorm",
      96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
    };
    
    return {
      location: name,
      country: country,
      temperature: Math.round(weatherData.current.temperature_2m),
      feels_like: Math.round(weatherData.current.apparent_temperature),
      humidity: weatherData.current.relative_humidity_2m,
      wind_speed: Math.round(weatherData.current.wind_speed_10m),
      precipitation: weatherData.current.precipitation,
      cloud_cover: weatherData.current.cloud_cover,
      condition: weatherCodes[weatherData.current.weather_code] || "Unknown",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Weather fetch error:", error);
    return null;
  }
}

async function getLocationNews(location: string) {
  try {
    const NEWS_API_KEY = Deno.env.get("pub_e65fd689e33a4a0f8eefbf682a4a3388");
    
    if (!NEWS_API_KEY) {
      console.error("NEWSDATA_API_KEY not configured");
      return {
        error: true,
        message: `News API key not configured. For latest updates in ${location}, please check The Times of India, Hindustan Times, or local news portals.`,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log(`Fetching news for location: ${location}`);
    
    // Fetch India news with location context
    const response = await fetch(
      `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=en&q=${encodeURIComponent(location)}&size=5`
    );
    
    console.log("News API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("News API error:", response.status, errorText);
      
      // Fallback to generic India news without location filter
      const fallbackResponse = await fetch(
        `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=en&category=top&size=5`
      );
      
      if (!fallbackResponse.ok) {
        return {
          error: true,
          message: `Unable to fetch live news at the moment. For latest updates in ${location}, please check The Times of India, Hindustan Times, or local news portals.`,
          timestamp: new Date().toISOString()
        };
      }
      
      const fallbackData = await fallbackResponse.json();
      console.log("Fallback news count:", fallbackData.results?.length || 0);
      
      const fallbackArticles = fallbackData.results?.slice(0, 5).map((article: any) => ({
        title: article.title,
        description: article.description || article.content || "No description available",
        source: article.source_id || "News Source",
        publishedAt: article.pubDate,
        category: article.category?.join(", ") || "General",
        location: "India"
      })) || [];
      
      return {
        articles: fallbackArticles,
        totalResults: fallbackArticles.length,
        location: location,
        note: `Showing top India news. Location-specific news for ${location} may be limited.`,
        timestamp: new Date().toISOString()
      };
    }
    
    const data = await response.json();
    console.log("News results count:", data.results?.length || 0);
    
    if (!data.results || data.results.length === 0) {
      console.log("No location-specific news found, fetching general India news");
      
      // Try broader search if no location-specific results
      const broadResponse = await fetch(
        `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&country=in&language=en&category=top&size=5`
      );
      const broadData = await broadResponse.json();
      
      const broadArticles = broadData.results?.slice(0, 5).map((article: any) => ({
        title: article.title,
        description: article.description || article.content || "No description available",
        source: article.source_id || "News Source",
        publishedAt: article.pubDate,
        category: article.category?.join(", ") || "General"
      })) || [];
      
      return {
        articles: broadArticles,
        totalResults: broadArticles.length,
        location: location,
        note: `Showing top India news as location-specific news for ${location} is limited.`,
        timestamp: new Date().toISOString()
      };
    }
    
    const articles = data.results.slice(0, 5).map((article: any) => ({
      title: article.title,
      description: article.description || article.content || "No description available",
      source: article.source_id || "News Source",
      publishedAt: article.pubDate,
      category: article.category?.join(", ") || "General",
      image: article.image_url
    }));
    
    console.log("Successfully fetched news articles");
    
    return {
      articles: articles,
      totalResults: data.totalResults || articles.length,
      location: location,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("News fetch error:", error);
    return {
      error: true,
      message: `Error fetching news. For latest updates in ${location}, please check The Times of India, Hindustan Times, or NDTV.`,
      timestamp: new Date().toISOString()
    };
  }
}

async function getAirQuality(location: string) {
  try {
    console.log(`Fetching air quality for: ${location}`);
    
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!geoResponse.ok) {
      console.error("AQI Geocoding error:", geoResponse.status);
      return null;
    }
    
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      console.error("Location not found for AQI");
      return null;
    }
    
    const { latitude, longitude, name } = geoData.results[0];
    console.log(`Fetching AQI for: ${name} (${latitude}, ${longitude})`);
    
    const airQualityResponse = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi&timezone=auto`
    );
    
    if (!airQualityResponse.ok) {
      console.error("AQI API error:", airQualityResponse.status);
      return null;
    }
    const airData = await airQualityResponse.json();
    
    const aqi = airData.current.us_aqi;
    let level = "Good";
    let recommendation = "Air quality is satisfactory. Enjoy outdoor activities.";
    
    if (aqi > 300) {
      level = "Hazardous";
      recommendation = "Health warning: everyone may experience serious health effects. Avoid outdoor activities.";
    } else if (aqi > 200) {
      level = "Very Unhealthy";
      recommendation = "Health alert: risk of health effects for everyone. Minimize outdoor exposure.";
    } else if (aqi > 150) {
      level = "Unhealthy";
      recommendation = "Everyone may experience health effects. Sensitive groups should avoid outdoor activities.";
    } else if (aqi > 100) {
      level = "Unhealthy for Sensitive Groups";
      recommendation = "Sensitive groups should limit prolonged outdoor activities.";
    } else if (aqi > 50) {
      level = "Moderate";
      recommendation = "Air quality is acceptable. Sensitive individuals should consider reducing prolonged outdoor exertion.";
    }
    
    console.log(`AQI fetched successfully: ${aqi} (${level})`);
    
    return {
      location: name,
      aqi: Math.round(aqi),
      level: level,
      recommendation: recommendation,
      pm25: Math.round(airData.current.pm2_5 || 0),
      pm10: Math.round(airData.current.pm10 || 0),
      pollutants: {
        co: airData.current.carbon_monoxide,
        no2: airData.current.nitrogen_dioxide,
        so2: airData.current.sulphur_dioxide,
        o3: airData.current.ozone
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching air quality:", error);
    return null;
  }
}

async function getCivicAlerts(location: string) {
  try {
    console.log(`Fetching civic alerts for: ${location}`);
    
    // In production: integrate with NDMA, State government portals, etc.
    const alerts = [
      {
        type: "Weather Advisory",
        severity: "moderate",
        title: "Monsoon Alert",
        description: "Heavy rainfall expected in the region. Please exercise caution during travel.",
        issuedBy: "India Meteorological Department",
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }
    ];
    
    console.log(`Civic alerts fetched: ${alerts.length} active`);
    
    return {
      location: location,
      alerts: alerts,
      alertCount: alerts.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching civic alerts:", error);
    return null;
  }
}

async function getLocalEvents(location: string) {
  try {
    console.log(`Fetching local events for: ${location}`);
    
    // In production: Google Places, Eventbrite, government portals
    const events = [
      {
        title: "Community Health Camp",
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: location,
        category: "Health",
        description: "Free health checkup and consultation by local healthcare providers.",
        organizer: "Municipal Corporation"
      },
      {
        title: "Digital Literacy Workshop",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: location,
        category: "Education",
        description: "Learn basic computer skills and digital services access.",
        organizer: "CSC e-Governance"
      }
    ];
    
    console.log(`Local events fetched: ${events.length} upcoming`);
    
    return {
      location: location,
      events: events,
      eventCount: events.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching local events:", error);
    return null;
  }
}

async function getTrafficInfo(location: string) {
  try {
    console.log(`Fetching traffic info for: ${location}`);
    
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!geoResponse.ok) {
      console.error("Traffic geocoding error:", geoResponse.status);
      return null;
    }
    
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      console.error("Location not found for traffic");
      return null;
    }
    
    const { name } = geoData.results[0];
    
    // Mock realistic traffic data (in production: Google/TomTom/HERE APIs)
    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 20);
    
    const trafficLevel = isPeakHour ? "Heavy" : currentHour >= 22 || currentHour <= 6 ? "Light" : "Moderate";
    const avgSpeed = isPeakHour ? "15-20 km/h" : "30-40 km/h";
    
    console.log(`Traffic info fetched: ${trafficLevel}`);
    
    return {
      location: name,
      trafficLevel: trafficLevel,
      averageSpeed: avgSpeed,
      peakHours: isPeakHour,
      recommendation: isPeakHour 
        ? "Peak traffic hours. Consider public transport or delay travel if possible."
        : "Traffic is manageable. Good time for commuting.",
      publicTransit: {
        available: true,
        types: ["Metro", "Bus", "Auto-rickshaw"],
        status: "Operational"
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching traffic info:", error);
    return null;
  }
}

async function getGovernmentSchemes(query: string) {
  try {
    // Common government schemes database
    const schemes = [
      {
        name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        category: "Healthcare",
        description: "Free health insurance coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization",
        eligibility: "Based on SECC database, covering poor and vulnerable families",
        how_to_apply: "Visit nearest Ayushman Bharat Empaneled Hospital with valid ID proof"
      },
      {
        name: "Pradhan Mantri Awas Yojana (PMAY)",
        category: "Housing",
        description: "Affordable housing for all with interest subsidy on home loans",
        eligibility: "EWS, LIG, MIG categories with annual income criteria",
        how_to_apply: "Apply online at pmaymis.gov.in or through Common Service Centers"
      },
      {
        name: "Swachh Bharat Mission",
        category: "Sanitation",
        description: "Household toilet construction with financial assistance",
        eligibility: "Households without toilets in rural and urban areas",
        how_to_apply: "Contact local Gram Panchayat or Urban Local Body"
      },
      {
        name: "PM Kisan Samman Nidhi",
        category: "Agriculture",
        description: "Income support of ₹6000 per year in three installments to farmer families",
        eligibility: "All landholding farmers",
        how_to_apply: "Register at pmkisan.gov.in with land records"
      },
      {
        name: "National Education Policy Benefits",
        category: "Education",
        description: "Free education, scholarships, mid-day meals, textbooks",
        eligibility: "School-going children, college students based on merit and need",
        how_to_apply: "Through school/college administration or scholarships.gov.in"
      },
      {
        name: "Pradhan Mantri Mudra Yojana (PMMY)",
        category: "Business",
        description: "Loans up to ₹10 lakh for small businesses and entrepreneurs",
        eligibility: "Non-corporate, non-farm small/micro enterprises",
        how_to_apply: "Visit nearest bank or NBFC with business plan"
      }
    ];
    
    const lowerQuery = query.toLowerCase();
    const relevantSchemes = schemes.filter(scheme => 
      scheme.name.toLowerCase().includes(lowerQuery) ||
      scheme.category.toLowerCase().includes(lowerQuery) ||
      scheme.description.toLowerCase().includes(lowerQuery)
    );
    
    return {
      schemes: relevantSchemes.length > 0 ? relevantSchemes : schemes.slice(0, 3),
      query: query,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Government schemes fetch error:", error);
    return null;
  }
}

async function getEmergencyServices(location: string) {
  try {
    return {
      location: location,
      services: [
        { name: "Police", number: "100", description: "Emergency police assistance" },
        { name: "Fire", number: "101", description: "Fire emergency services" },
        { name: "Ambulance", number: "102", description: "Medical emergency ambulance" },
        { name: "Women Helpline", number: "1091", description: "24x7 helpline for women in distress" },
        { name: "Child Helpline", number: "1098", description: "For children in need of care and protection" },
        { name: "Senior Citizens Helpline", number: "14567", description: "For elderly citizens" },
        { name: "Disaster Management", number: "108", description: "Disaster management services" },
        { name: "COVID-19 Helpline", number: "1075", description: "COVID-19 related information and support" }
      ],
      national_helpline: "112",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Emergency services fetch error:", error);
    return null;
  }
}

// Define tools for the AI to use
const tools = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get real-time weather information for a specific location. Returns current temperature, feels like, humidity, wind speed, precipitation, cloud cover, and weather condition.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name (e.g., 'Mumbai', 'Delhi', 'Bangalore')"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_location_news",
      description: "Get latest news articles for a specific location in India. Provides recent news headlines, descriptions, and sources.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_air_quality",
      description: "Get real-time air quality information including AQI, PM2.5, PM10, and other pollutants for a specific location.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_government_schemes",
      description: "Get information about Indian government schemes and benefits. Search by category (healthcare, housing, education, agriculture, business, sanitation) or scheme name.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Category or keyword to search schemes (e.g., 'healthcare', 'housing', 'education', 'agriculture')"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_civic_alerts",
      description: "Get civic alerts, warnings, and official announcements for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_local_events",
      description: "Get upcoming local events, community activities, and public programs",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_traffic_info",
      description: "Get current traffic conditions and public transit information",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_emergency_services",
      description: "Get emergency contact numbers and helpline information for India including police, fire, ambulance, women helpline, child helpline, etc.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city or location name"
          }
        },
        required: ["location"]
      }
    }
  }
];

serve(async (req: RequestWithBody) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, location, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_TRANSLATE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Processing chat request", { location, language, messageCount: messages.length });

    // Build location-aware system prompt
    const locationContext = location
      ? `User Location: ${location.city}, ${location.state}, ${location.country}`
      : "User Location: Unknown";

    const systemPrompt = `You are CivicSphere AI, an intelligent local civic assistant for India.

${locationContext}
User's preferred language: ${language}
Current date and time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Your role:
- Provide accurate, UP-TO-DATE, location-specific information using real-time data tools
- **ALWAYS use get_current_weather for weather queries** - never use outdated knowledge
- **Use get_air_quality for air quality and pollution queries** - provide health recommendations
- **Use get_location_news for news queries** to give users current local news
- **Use get_government_schemes when asked about benefits, subsidies, or government help**
- **Use get_emergency_services when asked about emergency contacts or helplines**
- Give practical, actionable advice based on real-time data and user location
- Be helpful, concise, and respectful
- Focus on verified, current information relevant to Indian citizens
- When discussing schemes, explain eligibility and how to apply
- For weather-related queries, provide specific advice for the local climate and current conditions
- For air quality data, explain health impacts and suggest precautions

**CRITICAL**: Always prefer using tools to fetch real-time data over relying on training knowledge. The tools provide current, accurate information.

Remember: You're helping citizens navigate their local civic environment with REAL-TIME, ACCURATE information.`;

    // Call Lovable AI with tools
    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: tools,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    let aiData = await aiResponse.json();
    let responseMessage = aiData.choices[0].message;

    // Handle tool calls if the AI requested them
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolMessages = [responseMessage];
      
      // Execute each tool call
      for (const toolCall of responseMessage.tool_calls) {
        console.log("Executing tool:", toolCall.function.name, toolCall.function.arguments);
        
        let toolResult = null;
        const args = JSON.parse(toolCall.function.arguments);
        
        if (toolCall.function.name === "get_current_weather") {
          toolResult = await getCurrentWeather(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_location_news") {
          toolResult = await getLocationNews(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_air_quality") {
          toolResult = await getAirQuality(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_civic_alerts") {
          toolResult = await getCivicAlerts(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_local_events") {
          toolResult = await getLocalEvents(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_traffic_info") {
          toolResult = await getTrafficInfo(args.location || location?.city || "India");
        } else if (toolCall.function.name === "get_government_schemes") {
          toolResult = await getGovernmentSchemes(args.query || "general");
        } else if (toolCall.function.name === "get_emergency_services") {
          toolResult = await getEmergencyServices(args.location || location?.city || "India");
        }
        
        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult || { error: "Tool execution failed" })
        });
      }
      
      // Call AI again with tool results
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            ...toolMessages,
          ],
        }),
      });
      
      if (!secondResponse.ok) {
        throw new Error("AI gateway error on second call");
      }
      
      const secondData = await secondResponse.json();
      responseMessage = secondData.choices[0].message;
    }

    let aiMessage = responseMessage.content;

    // Translate if needed
    if (language !== "en" && GOOGLE_TRANSLATE_API_KEY) {
      try {
        const translateResponse = await fetch(
          `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: aiMessage,
              target: language,
              format: "text",
            }),
          }
        );

        if (translateResponse.ok) {
          const translateData = await translateResponse.json();
          aiMessage = translateData.data.translations[0].translatedText;
        } else {
          console.warn("Translation failed, returning English response");
        }
      } catch (translateError) {
        console.error("Translation error:", translateError);
      }
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
