// Enhanced AXEL Page with Centered Video and Reorganized Layout
"use client";

import Image from "next/image";
import { useState, useRef, useEffect, SetStateAction } from "react";
import {
  axelConsultant_default,
  consultants_default,
  axelConsultant_saas,
  consultants_saas,
  axelConsultant_businessAutomation,
  consultants_businessAutomation,
  sampleConsultantQuestions,
} from "../../../lib/data";

import {
  Consultant,
  ConsultantData,
  ConsultantResponse,
  Conversation,
} from "../../../lib/types";
import { ScrollArea } from "../ui/scroll-area";

export default function ConsultantsPage() {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(
    "/consultants-videos/bot-video1.mp4"
  );
  const [currentSpeaker, setCurrentSpeaker] = useState("axel");
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [consultantType, setConsultantType] = useState("default");
  const [sampleQuestion, setSampleQuestion] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showConsultants, setShowConsultants] = useState(false);
  const [processingConsultant, setProcessingConsultant] = useState<
    string | null
  >(null);

  type CallOverlay = {
    consultant: string;
    message: string;
    phase: "calling" | "connected" | "responding";
  };
  const [callOverlay, setCallOverlay] = useState<CallOverlay | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get current consultants and AXEL based on type
  const getCurrentConsultants = () => {
    if (consultantType === "saas") {
      return {
        axelConsultant: axelConsultant_saas,
        consultants: consultants_saas,
      };
    } else if (consultantType === "business-automation") {
      return {
        axelConsultant: axelConsultant_businessAutomation,
        consultants: consultants_businessAutomation,
      };
    } else {
      return {
        axelConsultant: axelConsultant_default,
        consultants: consultants_default,
      };
    }
  };

  const { axelConsultant, consultants } = getCurrentConsultants();

  // Update sample question when consultant type changes
  useEffect(() => {
    const getQuestionType = () => {
      if (consultantType === "default") return "default";
      else if (consultantType === "business-automation")
        return "businessAutomation";
      else if (consultantType === "saas") return "saas";
    };

    const questionType = sampleConsultantQuestions.find(
      (q) => q.type === getQuestionType()
    );
    setSampleQuestion(questionType?.question || "");
  }, [consultantType]);

  // Function to show call overlay with realistic messaging
  const showCallOverlay = (
    consultantName: string,
    phase: "calling" | "connected" | "responding" = "calling"
  ) => {
    const messages = {
      calling: [
        `📞 Calling ${consultantName}...`,
        `🔄 Connecting to ${consultantName}...`,
        `⏳ Waiting for ${consultantName} to pick up...`,
      ],
      connected: [
        `✅ ${consultantName} is on the line`,
        `🎙️ ${consultantName} is thinking...`,
        `🧠 ${consultantName} is analyzing your question...`,
      ],
      responding: [
        `💭 ${consultantName} is formulating response...`,
        `🎯 ${consultantName} has insights for you...`,
        `⚡ ${consultantName} is ready to respond...`,
      ],
    };

    const phaseMessages = messages[phase];
    const randomMessage =
      phaseMessages[Math.floor(Math.random() * phaseMessages.length)];

    setCallOverlay({
      consultant: consultantName,
      message: randomMessage,
      phase: phase,
    });
  };

  const hideCallOverlay = () => setCallOverlay(null);

  // Function to change video based on speaker
  const changeVideoForSpeaker = (speakerId: SetStateAction<string>) => {
    setCurrentSpeaker(speakerId);

    let videoSrc = axelConsultant.video;
    if (speakerId === "axel") {
      videoSrc = axelConsultant.video;
    } else {
      const consultant = consultants.find((c) => c.id === speakerId);
      if (consultant && consultant.video) videoSrc = consultant.video;
    }

    setCurrentVideoSrc(videoSrc);

    if (videoRef.current) {
      videoRef.current.src = videoSrc;
      videoRef.current.load();
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  // Enhanced audio playbook with video sync
  const playAudioWithVideo = (audioUrl: string, speakerId: string) => {
    changeVideoForSpeaker(speakerId);

    const consultant = consultants.find((c) => c.id === speakerId);
    if (consultant) showCallOverlay(consultant.name, "responding");

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;

      audioRef.current.onplay = () => {
        console.log(`${speakerId} started speaking - playing video`);
        setIsSpeaking(true);
        hideCallOverlay();
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(console.error);
        }
      };

      audioRef.current.onended = () => {
        console.log(`${speakerId} finished speaking - pausing video`);
        setIsSpeaking(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      };

      audioRef.current.onpause = () => {
        console.log(`${speakerId} audio paused`);
        setIsSpeaking(false);
        if (videoRef.current) videoRef.current.currentTime = 0;
      };

      audioRef.current.play().catch(console.error);
    }
  };

  // Submit question to AXEL
  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setShowConsultants(false);
    setConversation(null);

    changeVideoForSpeaker("axel");
    showCallOverlay("AXEL", "calling");

    try {
      console.log("Sending question to AXEL:", inputText);
      setTimeout(() => showCallOverlay("AXEL", "connected"), 1000);

      const dynamicUserPrompt = axelConsultant.userPrompt.replace(
        "{{USER_QUESTION}}",
        inputText
      );

      const response = await fetch("/api/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "axel_question",
          consultant: "axel",
          name: "AXEL",
          systemPrompt: axelConsultant.systemPrompt,
          userPrompt: dynamicUserPrompt,
          question: inputText,
          consultantInfo: {
            id: axelConsultant.id,
            name: axelConsultant.name,
            title: axelConsultant.title,
            expertise: axelConsultant.expertise,
            voiceId: axelConsultant.voiceId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || `HTTP error! status: ${response.status}`
        );
      }

      const conversationData = await response.json();
      console.log("AXEL response:", conversationData);

      let axelAudioUrl = undefined;

      if (conversationData.audioBase64) {
        try {
          console.log("Converting AXEL base64 to audio...");
          const audioBytes = Uint8Array.from(
            atob(conversationData.audioBase64),
            (c) => c.charCodeAt(0)
          );
          const audioBlob = new Blob([audioBytes], {
            type: conversationData.mimeType || "audio/mpeg",
          });
          axelAudioUrl = URL.createObjectURL(audioBlob);
          playAudioWithVideo(axelAudioUrl, "axel");
        } catch (error) {
          console.error("Error converting base64 to audio:", error);
        }
      }

      const newConversation = {
        question: inputText,
        axelResponse: conversationData.text || conversationData.response,
        axelAudioUrl,
        consultantResponses: [],
      };

      setConversation(newConversation);
      setShowConsultants(true);
    } catch (error) {
      console.error("Error communicating with API:", error);
      hideCallOverlay();
      alert(
        "Sorry, there was an error processing your request. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle consultant click
  const handleConsultantClick = async (
    consultant: Consultant
  ): Promise<void> => {
    if (!conversation || isSpeaking) return;

    if (consultant.id === "anthony-hopkins") {
      if (conversation.consultantResponses.length < 2) {
        alert(
          "Need at least 2 consultant responses before requesting synthesis from Anthony Hopkins."
        );
        return;
      }
      await handleHopkinsSynthesis();
      return;
    }

    setProcessingConsultant(consultant.id);
    changeVideoForSpeaker(consultant.id);
    showCallOverlay(consultant.name, "calling");

    try {
      console.log(`Consulting with ${consultant.name}...`);
      setTimeout(() => showCallOverlay(consultant.name, "connected"), 1500);

      const previousConsultantsText = conversation.consultantResponses
        .map((resp) => `${resp.consultant}: "${resp.response}"`)
        .join("\n\n");

      const dynamicUserPrompt = consultant.userPrompt
        .replace("{{USER_QUESTION}}", conversation.question)
        .replace("{{AXEL_RESPONSE}}", conversation.axelResponse)
        .replace("{{PREVIOUS_CONSULTANTS}}", previousConsultantsText);

      const response = await fetch("/api/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: consultant.isSpecial
            ? "hopkins_synthesis"
            : "consultant_question",
          consultant: consultant.id,
          name: consultant.name,
          systemPrompt: consultant.systemPrompt,
          userPrompt: dynamicUserPrompt,
          context: {
            originalQuestion: conversation.question,
            axelResponse: conversation.axelResponse,
            previousConsultants: conversation.consultantResponses,
          },
          consultantInfo: {
            id: consultant.id,
            name: consultant.name,
            title: consultant.title,
            expertise: consultant.expertise,
            price: consultant.price,
            isSpecial: consultant.isSpecial || false,
            voiceId: consultant.voiceId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || `HTTP error! status: ${response.status}`
        );
      }

      const consultantData: ConsultantData = await response.json();
      console.log(`${consultant.name} response:`, consultantData);

      let consultantAudioUrl: string | undefined = undefined;

      if (consultantData.audioBase64) {
        try {
          console.log(`Converting ${consultant.name} base64 to audio...`);
          const audioBytes = Uint8Array.from(
            atob(consultantData.audioBase64),
            (c) => c.charCodeAt(0)
          );
          const audioBlob = new Blob([audioBytes], {
            type: consultantData.mimeType || "audio/mpeg",
          });
          consultantAudioUrl = URL.createObjectURL(audioBlob);
          playAudioWithVideo(consultantAudioUrl, consultant.id);
        } catch (error) {
          console.error(
            `Error converting ${consultant.name} base64 to audio:`,
            error
          );
        }
      }

      setConversation((prev: Conversation | null) =>
        prev
          ? {
              ...prev,
              consultantResponses: [
                ...prev.consultantResponses,
                {
                  consultant: consultant.isSpecial
                    ? `${consultant.name} - Master Synthesis`
                    : consultant.name,
                  response:
                    consultantData.text || consultantData.response || "",
                  timestamp: new Date(),
                  audioUrl: consultantAudioUrl,
                  speakerId: consultant.id,
                  isSpecial: consultant.isSpecial || false,
                },
              ],
            }
          : null
      );
    } catch (error) {
      console.error(`Error consulting with ${consultant.name}:`, error);
      hideCallOverlay();
      changeVideoForSpeaker("axel");
      alert(
        `Sorry, there was an error consulting with ${consultant.name}. Please try again.`
      );
    } finally {
      setProcessingConsultant(null);
    }
  };

  // Hopkins synthesis function
  const handleHopkinsSynthesis = async () => {
    if (
      !conversation ||
      conversation.consultantResponses.length < 2 ||
      isSpeaking
    )
      return;

    const hopkins = consultants.find((c) => c.id === "anthony-hopkins");
    if (!hopkins) return;

    setProcessingConsultant("anthony-hopkins");
    showCallOverlay("Anthony Hopkins", "calling");

    try {
      console.log("Requesting Anthony Hopkins Master Synthesis...");
      setTimeout(() => showCallOverlay("Anthony Hopkins", "connected"), 1500);

      const consultationSummary = {
        originalQuestion: conversation.question,
        axelResponse: conversation.axelResponse,
        consultantCount: conversation.consultantResponses.length,
        consultantResponses: conversation.consultantResponses.map(
          (resp, index) => ({
            order: index + 1,
            consultant: resp.consultant,
            response: resp.response,
            timestamp: resp.timestamp.toISOString(),
          })
        ),
      };

      const comprehensivePrompt = `
SYNTHESIS REQUEST - 80-120 WORDS ONLY

Question: "${conversation.question}"

AXEL: "${conversation.axelResponse}"

Consultants (${conversation.consultantResponses.length} total):
${conversation.consultantResponses
  .map((resp) => `${resp.consultant}: "${resp.response}"`)
  .join("\n")}

Hopkins: Deliver your final synthesis in EXACTLY 80-120 words. Start with "Good evening. Hopkins here." Name 2-3 consultants, identify the core pattern, give ONE strategy, list 3 actions.

CRITICAL: Must be 80-120 words total. Count every word. Stop at 120 even if mid-sentence.
      `.trim();

      const response = await fetch("/api/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hopkins_synthesis",
          consultant: hopkins.id,
          name: hopkins.name,
          systemPrompt: `CRITICAL CONSTRAINT: Your response MUST be exactly 80-120 words. NO EXCEPTIONS. Count every single word as you write. If you reach 120 words, STOP immediately, even mid-sentence.

You are Anthony Hopkins "The Strategist" - master synthesizer who delivers razor-sharp analysis with surgical precision.

PERSONALITY: Intellectually superior, brutally concise, authoritative. No fluff, pure strategic insight.

COMMUNICATION: Start with "Good evening. Hopkins here." then deliver synthesis in exactly 80-120 words total.

CORE BEHAVIOR: 
- Identify ONE core pattern across all advice
- Name 2-3 consultants briefly by last name only
- Give ONE unified strategy sentence
- Provide exactly 3 specific actions (numbered)

Remember: You must be ruthlessly concise. 80-120 words MAXIMUM. Count as you go. Stop at 120 words even if incomplete.`,
          userPrompt: comprehensivePrompt,
          context: consultationSummary,
          consultantInfo: {
            id: hopkins.id,
            name: hopkins.name,
            title: hopkins.title,
            expertise: hopkins.expertise,
            price: hopkins.price,
            isSpecial: true,
            voiceId: hopkins.voiceId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || `HTTP error! status: ${response.status}`
        );
      }

      const hopkinsData = await response.json();
      console.log("Hopkins Master Synthesis received:", hopkinsData);

      let hopkinsAudioUrl = undefined;

      if (hopkinsData.audioBase64) {
        try {
          console.log("Converting Hopkins synthesis audio...");
          const audioBytes = Uint8Array.from(
            atob(hopkinsData.audioBase64),
            (c) => c.charCodeAt(0)
          );
          const audioBlob = new Blob([audioBytes], {
            type: hopkinsData.mimeType || "audio/mpeg",
          });
          hopkinsAudioUrl = URL.createObjectURL(audioBlob);
          playAudioWithVideo(hopkinsAudioUrl, "anthony-hopkins");
        } catch (error) {
          console.error("Error converting Hopkins synthesis audio:", error);
        }
      }

      setConversation((prev) =>
        prev
          ? {
              ...prev,
              consultantResponses: [
                ...prev.consultantResponses,
                {
                  consultant: "Anthony Hopkins - Master Synthesis",
                  response: hopkinsData.text || hopkinsData.response,
                  timestamp: new Date(),
                  audioUrl: hopkinsAudioUrl,
                  isSpecial: true,
                  speakerId: "anthony-hopkins",
                },
              ],
            }
          : null
      );

      console.log("Hopkins Master Synthesis complete!");
    } catch (error) {
      console.error("Error with Hopkins synthesis:", error);
      hideCallOverlay();
      alert("Error requesting synthesis. Please try again.");
    } finally {
      setProcessingConsultant(null);
    }
  };

  // Replay functions
  const replayAxelAudio = () => {
    if (conversation?.axelAudioUrl && !isSpeaking) {
      console.log("Replaying AXEL audio...");
      playAudioWithVideo(conversation.axelAudioUrl, "axel");
    }
  };

  const replayConsultantAudio = (response: ConsultantResponse) => {
    if (response.audioUrl && !isSpeaking) {
      console.log(`Replaying ${response.consultant} audio...`);
      playAudioWithVideo(response.audioUrl, response.speakerId || "axel");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-800 text-white">
      {/* Enhanced Header */}
      <div className="border-b border-red-900/30 backdrop-blur-sm bg-black/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                <span className="text-2xl font-bold">⚡</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  LEGENDARY MINDS
                </h1>
                <p className="text-sm text-gray-400">
                  AI Business Advisory Platform
                </p>
              </div>
            </div>

            {/* Compact Specialization Selector in Header */}
            <div className="flex items-center space-x-4">
              <select
                value={consultantType}
                onChange={(e) => setConsultantType(e.target.value)}
                className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="default">General Business</option>
                <option value="business-automation">Business Automation</option>
                <option value="saas">SaaS Experts</option>
              </select>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-300">
                  {isPlaying ? "Speaking" : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Center Area - AXEL */}
          <div className="xl:col-span-2  flex flex-col items-center">
            {/* AXEL Video - Larger and Centered */}
            <div className="w-full max-w-fit mb-8">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
                <div className="p-6 border-b border-gray-700/50 text-center">
                  {/* Speaker Indicator */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm ${
                        isPlaying
                          ? "bg-green-600/20 border border-green-500/30 text-green-300"
                          : "bg-gray-600/20 border border-gray-500/30 text-gray-300"
                      }`}
                    >
                      {isPlaying
                        ? currentSpeaker === "axel"
                          ? "AXEL Speaking"
                          : consultants.find((c) => c.id === currentSpeaker)
                              ?.name + " Speaking" || "AXEL Speaking"
                        : currentSpeaker === "axel"
                        ? "AXEL Ready"
                        : consultants.find((c) => c.id === currentSpeaker)
                            ?.name + " Ready" || "AXEL Ready"}
                    </span>
                  </div>
                </div>

                {/* Larger Video Container */}
                <div className="relative">
                  <div className="aspect-[9/16] max-h-[700px]  mx-auto relative overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-3xl"
                      loop
                      muted
                      playsInline
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    >
                      <source src={currentVideoSrc} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                    {/* Call Overlay */}
                    {callOverlay && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-gray-900/95 border-2 border-red-500/50 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
                          <div className="mb-6">
                            {callOverlay.phase === "calling" && (
                              <div className="w-20 h-20 mx-auto mb-4 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {callOverlay.phase === "connected" && (
                              <div className="w-20 h-20 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <div className="w-10 h-10 bg-white rounded-full animate-pulse"></div>
                              </div>
                            )}
                            {callOverlay.phase === "responding" && (
                              <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                <div className="flex space-x-1">
                                  {[0, 1, 2].map((i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 bg-white rounded-full animate-bounce"
                                      style={{ animationDelay: `${i * 0.1}s` }}
                                    ></div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <h3 className="text-white font-bold text-xl mb-3">
                            {callOverlay.consultant}
                          </h3>
                          <p className="text-gray-300 text-sm mb-4">
                            {callOverlay.message}
                          </p>

                          <div className="flex items-center justify-center space-x-3 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>
                              {callOverlay.phase === "calling" &&
                                "Establishing connection..."}
                              {callOverlay.phase === "connected" &&
                                "Line secured"}
                              {callOverlay.phase === "responding" &&
                                "Generating response..."}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Question Input Below AXEL */}
            <div className="w-full max-w-2xl mb-8">
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl border border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4 text-center">
                  Ask Your Question
                </h3>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-4 bg-gray-800/60 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none resize-none transition-colors"
                  placeholder={
                    sampleQuestion ||
                    "Ask AXEL anything about business, automation, or making money..."
                  }
                />

                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !inputText.trim() || isSpeaking}
                  className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] disabled:scale-100 shadow-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>AXEL IS THINKING...</span>
                    </div>
                  ) : isSpeaking ? (
                    <div className="flex items-center justify-center space-x-2">
                      <span>🔊</span>
                      <span>CONSULTANT SPEAKING...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>🚀</span>
                      <span>CONSULT AXEL</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Conversation History Below Input */}
            {conversation && (
              <div className="w-full max-w-4xl">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl border border-gray-700/50">
                  <div className="p-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-red-400">
                        💬 Consultation History
                      </h3>
                      <button
                        onClick={() => {
                          setConversation(null);
                          setShowConsultants(false);
                          setInputText("");
                          if (conversation?.axelAudioUrl) {
                            URL.revokeObjectURL(conversation.axelAudioUrl);
                          }
                          conversation.consultantResponses.forEach((resp) => {
                            if (resp.audioUrl) {
                              URL.revokeObjectURL(resp.audioUrl);
                            }
                          });
                        }}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg text-sm transition-all duration-200"
                      >
                        New Consultation
                      </button>
                    </div>
                  </div>

                  <ScrollArea className="h-[500px] p-6">
                    {/* Original Question */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm font-semibold mb-2">
                        YOUR QUESTION:
                      </p>
                      <p className="text-white leading-relaxed">
                        {conversation.question}
                      </p>
                    </div>

                    {/* AXEL Response */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">⚡</span>
                          <p className="text-red-300 font-bold">AXEL</p>
                        </div>
                        {conversation.axelAudioUrl && (
                          <button
                            onClick={replayAxelAudio}
                            disabled={isSpeaking}
                            className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 disabled:bg-gray-600/30 text-red-300 disabled:text-gray-400 rounded-full text-xs transition-all duration-200 flex items-center space-x-1"
                          >
                            <span>{isSpeaking ? "🔇" : "🔄"}</span>
                            <span>Replay</span>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 leading-relaxed">
                        {conversation.axelResponse}
                      </p>
                    </div>

                    {/* Consultant Responses */}
                    {conversation.consultantResponses.map((response, index) => {
                      const isHopkinsSynthesis =
                        response.consultant.includes("Hopkins") ||
                        response.isSpecial;

                      return (
                        <div
                          key={index}
                          className={`mb-6 p-4 rounded-lg ${
                            isHopkinsSynthesis
                              ? "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50"
                              : "bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border border-emerald-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">
                                {isHopkinsSynthesis ? "🎭" : "🧠"}
                              </span>
                              <p
                                className={`font-bold ${
                                  isHopkinsSynthesis
                                    ? "text-purple-300"
                                    : "text-emerald-300"
                                }`}
                              >
                                {response.consultant.toUpperCase()}
                              </p>
                              {isHopkinsSynthesis && (
                                <span className="bg-purple-600/30 text-purple-200 text-xs px-2 py-1 rounded-full font-medium">
                                  MASTER SYNTHESIS
                                </span>
                              )}
                            </div>
                            {response.audioUrl && (
                              <button
                                onClick={() => replayConsultantAudio(response)}
                                disabled={isSpeaking}
                                className={`px-3 py-1 rounded-full text-xs transition-all duration-200 flex items-center space-x-1 ${
                                  isHopkinsSynthesis
                                    ? "bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-gray-600/30 text-purple-300 disabled:text-gray-400"
                                    : "bg-emerald-600/30 hover:bg-emerald-600/50 disabled:bg-gray-600/30 text-emerald-300 disabled:text-gray-400"
                                }`}
                              >
                                <span>{isSpeaking ? "🔇" : "🔄"}</span>
                                <span>Replay</span>
                              </button>
                            )}
                          </div>

                          <div
                            className={
                              isHopkinsSynthesis
                                ? "text-purple-100"
                                : "text-gray-200"
                            }
                          >
                            {isHopkinsSynthesis && (
                              <div className="mb-4 p-3 bg-purple-900/20 rounded-lg text-center">
                                <p className="text-xs text-purple-300 italic">
                                  &quot;I have observed your consultation with
                                  considerable interest...&quot;
                                </p>
                              </div>
                            )}
                            <p className="leading-relaxed">
                              {response.response}
                            </p>
                          </div>

                          <div className="mt-3 pt-3 border-t border-gray-700/30">
                            <p className="text-xs text-gray-500">
                              {response.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          {/* Consultants Panel - Right Side */}
          <div className="xl:col-span-1 ">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/50 backdrop-blur-sm sticky top-32">
              <div className="p-6 border-b border-gray-700/50">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white mb-2">
                    🧠 LEGENDARY MINDS
                  </h2>
                  <p className="text-sm text-gray-400">
                    Consult with history&apos;s greatest business minds
                  </p>
                  <div className="mt-3 px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full inline-block">
                    <span className="text-xs font-semibold text-red-300 uppercase">
                      {consultantType}
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[800px] w-full flex items-center justify-center overflow-hidden">
                <div className="flex flex-col items-center justify-center gap-6 p-6 min-h-full">
                  {consultants.map((consultant) => {
                    const isProcessing = processingConsultant === consultant.id;
                    const hasResponded = conversation?.consultantResponses.some(
                      (r) =>
                        r.consultant
                          .toLowerCase()
                          .includes(consultant.name.toLowerCase())
                    );

                    const isHopkins = consultant.id === "anthony-hopkins";
                    const canUseHopkins = isHopkins
                      ? (conversation?.consultantResponses.length || 0) >= 2
                      : true;
                    const hopkinsMessage =
                      isHopkins && !canUseHopkins
                        ? "Need 2+ consultants first"
                        : "";

                    return (
                      <div
                        key={consultant.id}
                        className={`relative w-80 rounded-xl p-3 transition-all duration-300 cursor-pointer transform-gpu ${
                          consultant.gradient
                        } border-2 ${consultant.borderColor} ${
                          !showConsultants ||
                          (isHopkins && !canUseHopkins) ||
                          isSpeaking ||
                          isProcessing
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-105 hover:shadow-2xl hover:z-10"
                        } ${isProcessing ? "animate-pulse" : ""} ${
                          hasResponded
                            ? "ring-2 ring-green-400/50 shadow-lg shadow-green-400/20"
                            : ""
                        } ${isHopkins ? "shadow-lg shadow-purple-500/20" : ""}`}
                        onClick={() => {
                          if (
                            !showConsultants ||
                            isProcessing ||
                            isSpeaking ||
                            (isHopkins && !canUseHopkins)
                          ) {
                            return;
                          }
                          handleConsultantClick(consultant);
                        }}
                        style={{
                          pointerEvents:
                            !showConsultants ||
                            (isHopkins && !canUseHopkins) ||
                            isSpeaking ||
                            isProcessing
                              ? "none"
                              : "auto",
                        }}
                      >
                        {/* Card Content */}
                        <div className="relative z-20">
                          <div className="flex items-center space-x-3 mb-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-gray-700 shadow-md">
                                {isProcessing ? (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  </div>
                                ) : (
                                  consultant.image && (
                                    <Image
                                      src={consultant.image}
                                      alt={consultant.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                    />
                                  )
                                )}
                              </div>
                              {hasResponded && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                                  <span className="text-xs text-white font-bold">
                                    ✓
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-lg leading-tight">
                                {consultant.name}
                              </h3>
                              <p className="text-sm text-gray-200 font-medium">
                                {consultant.title}
                              </p>
                            </div>

                            {/* Price Badge */}
                            <div className="flex-shrink-0">
                              <div className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/20">
                                <p className="text-white font-bold text-sm text-center">
                                  {consultant.price}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Expertise */}
                          <div className="mb-3">
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {consultant.expertise}
                            </p>
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-xs text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                              {!showConsultants
                                ? "Ask AXEL first"
                                : isSpeaking
                                ? "Speaking..."
                                : isProcessing
                                ? isHopkins
                                  ? "Synthesizing..."
                                  : "Thinking..."
                                : hopkinsMessage
                                ? hopkinsMessage
                                : isHopkins
                                ? "Master Synthesis"
                                : hasResponded
                                ? "Available again"
                                : "Available"}
                            </span>
                          </div>

                          {/* Consultation Count */}
                          {hasResponded && !isHopkins && (
                            <div className="flex justify-center mb-2">
                              <div className="bg-green-500/20 border border-green-400/30 rounded-full px-2 py-1">
                                <span className="text-xs text-green-300 font-medium">
                                  {
                                    conversation?.consultantResponses.filter(
                                      (r) =>
                                        r.consultant
                                          .toLowerCase()
                                          .includes(
                                            consultant.name.toLowerCase()
                                          )
                                    ).length
                                  }
                                  x consulted
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Special Hopkins indicator */}
                          {isHopkins && (
                            <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/50 backdrop-blur-sm">
                              <p className="text-xs text-purple-200 italic text-center mb-2">
                                &quot;I shall dissect each perspective with
                                surgical precision...&quot;
                              </p>
                              {canUseHopkins && conversation && (
                                <div className="text-center">
                                  <p className="text-xs text-purple-300 font-semibold mb-1">
                                    Ready to synthesize{" "}
                                    {conversation.consultantResponses.length +
                                      1}{" "}
                                    perspectives
                                  </p>
                                  <div className="bg-purple-600/30 border border-purple-400/50 rounded-full px-2 py-1 inline-block">
                                    <span className="text-xs text-purple-200 font-bold">
                                      MASTER SYNTHESIS
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Indicator */}
                          <div className="text-center">
                            <div className="inline-flex items-center space-x-2 text-white/70">
                              {!showConsultants ? (
                                <>
                                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                  <span className="text-xs">
                                    Waiting for AXEL
                                  </span>
                                </>
                              ) : hasResponded ? (
                                <>
                                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                  <span className="text-xs">
                                    Click to consult again
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                  <span className="text-xs">
                                    Click to consult
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"></div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* How It Works */}
              <div className="p-6 border-t border-gray-700/50">
                <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-4 border border-blue-500/30">
                  <h4 className="text-blue-300 font-bold mb-3 flex items-center space-x-2">
                    <span>💡</span>
                    <span>How It Works</span>
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <span>Ask AXEL your question (free)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Get perspectives from 2+ legends</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Hopkins synthesizes all wisdom</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <span>Receive your master strategy</span>
                    </div>
                  </div>

                  {conversation &&
                    conversation.consultantResponses.length > 0 &&
                    conversation.consultantResponses.length < 2 && (
                      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-300 text-xs text-center">
                          💡 Consult with 2+ legends to unlock Anthony Hopkins
                          synthesis
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Left Side - Empty space for balance */}
          <div className="xl:col-span-1 xl:col-start-1">
            {/* This column provides visual balance - could add additional features here later */}
          </div>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
