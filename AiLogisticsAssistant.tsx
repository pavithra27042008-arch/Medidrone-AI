import React, { useState } from 'react';
import { Drone, MedicalMission, WeatherCondition } from '../../types';
import { askAiLogisticsAssistant } from '../../services/aiService';
import { soundFx } from '../../utils/audio';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Cpu, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Terminal 
} from 'lucide-react';

interface AiLogisticsAssistantProps {
  activeMission: MedicalMission | null;
  fleet: Drone[];
  weather: WeatherCondition;
}

interface ChatMessage {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  timestamp: string;
}

export const AiLogisticsAssistant: React.FC<AiLogisticsAssistantProps> = ({
  activeMission,
  fleet,
  weather,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'AI',
      text: 'MediDrone Tactical AI Coordinator online. Synchronized with regional hospital trauma helipads, weather radar, and active fleet telemetry. How may I assist your medical dispatch mission today?',
      timestamp: '02:40:15',
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const samplePrompts = [
    'How does 25 km/h headwind affect battery reserve for the organ transport?',
    'Can AeroPulse-X1 hold rabies vaccine at 4°C if ambient is 34°C?',
    'Explain autonomous obstacle avoidance maneuver when LiDAR detects a tower',
    'Triage protocol: Code Red traumatic maternal hemorrhage vs snakebite',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    soundFx.playClick(920);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const reply = await askAiLogisticsAssistant(textToSend, {
        activeMission,
        fleetCount: fleet.length,
        weather,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
      soundFx.playTelemetryBeep(true);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold font-tech uppercase tracking-wider text-teal-300">
                AI Medical Airspace Surgeon & Logistics Assistant
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Autonomous Triage Reasoning Engine • Powered by Gemini AI • Real-Time Route, Cold-Chain & Battery Modeling
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              AI Reasoning Engine: Active
            </span>
          </div>
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-teal-400" /> Quick Queries:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-teal-200 border border-slate-700 transition-all text-left"
            >
              "{p.length > 48 ? p.slice(0, 48) + '...' : p}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Panel */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map(m => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'AI' && (
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-300 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 font-mono leading-relaxed shadow-md ${
                  m.sender === 'USER'
                    ? 'bg-teal-600 text-slate-950 font-medium'
                    : 'bg-slate-950/80 text-slate-200 border border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 pb-1 border-b border-white/10">
                  <span>{m.sender === 'USER' ? 'Flight Surgeon / Dispatcher' : 'MediDrone Tactical AI'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>

              {m.sender === 'USER' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs items-center text-teal-300 font-mono">
              <Bot className="w-5 h-5 animate-spin" />
              <span>Synthesizing clinical flight parameters...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI logistics assistant (e.g. 'Optimize delivery route for trauma organ...')"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Consult AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
