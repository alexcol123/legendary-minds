// Enhanced AXEL Page with Dynamic Video Switching and Hopkins Synthesis
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
import { Button } from "@/components/ui/button";
import {
  Consultant,
  ConsultantData,
  ConsultantResponse,
  Conversation,
} from "../../../lib/types";

export default function ConsultantsPage() {
  // Webhooks
  const webhookUrl = process.env.N8N_WEBHOOK_URL as string;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(
    "/consultants-videos/bot-video1.mp4"
  ); // Default AXEL video
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
  const [callOverlay, setCallOverlay] = useState<CallOverlay | null>(null); // New state for call overlay
  const [isSpeaking, setIsSpeaking] = useState(false); // New state to track if someone is actively speaking

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get current consultants and AXEL based on type - moved outside render
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

  // Update sample question when consultant type changes - moved to useEffect
  useEffect(() => {
    const getQuestionType = () => {
      if (consultantType === "default") {
        return "default";
      } else if (consultantType === "business-automation") {
        return "businessAutomation";
      } else if (consultantType === "saas") {
        return "saas";
      }
    };

    const questionType = sampleConsultantQuestions.find(
      (q) => q.type === getQuestionType()
    );

    setSampleQuestion(questionType?.question || "");
  }, [consultantType]); // Only run when consultantType changes

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

  // Function to hide call overlay
  const hideCallOverlay = () => {
    setCallOverlay(null);
  };

  // Function to change video based on speaker - but keep it paused until audio plays
  const changeVideoForSpeaker = (speakerId: SetStateAction<string>) => {
    setCurrentSpeaker(speakerId);

    let videoSrc = axelConsultant.video; // Default to AXEL

    if (speakerId === "axel") {
      videoSrc = axelConsultant.video;
    } else {
      const consultant = consultants.find((c) => c.id === speakerId);
      if (consultant && consultant.video) {
        videoSrc = consultant.video;
      }
    }

    setCurrentVideoSrc(videoSrc);

    // Update video source and keep it paused (thinking mode)
    if (videoRef.current) {
      videoRef.current.src = videoSrc;
      videoRef.current.load(); // Important: reload the video element
      videoRef.current.currentTime = 0;
      // DON'T auto-play - let the audio trigger playback
      videoRef.current.pause();
    }
  };

  const handleHopkinsSynthesis = async () => {
    if (!conversation || conversation.consultantResponses.length < 2) {
      alert(
        "Need at least 2 consultant responses before requesting synthesis."
      );
      return;
    }

    // Prevent synthesis if someone is actively speaking
    if (isSpeaking) {
      console.log("Someone is speaking - synthesis blocked");
      return;
    }

    const hopkins = consultants.find((c) => c.id === "anthony-hopkins");
    if (!hopkins) return;

    setProcessingConsultant("anthony-hopkins");

    // Show Hopkins call sequence
    showCallOverlay("Anthony Hopkins", "calling");

    try {
      console.log("🎭 Requesting Anthony Hopkins Master Synthesis...");

      // Update to connected after delay
      setTimeout(() => showCallOverlay("Anthony Hopkins", "connected"), 1500);

      // Create comprehensive context for Hopkins
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

      // Concise Hopkins prompt focused on brevity
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

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hopkinsData = await response.json();
      console.log("🎭 Hopkins Master Synthesis received:", hopkinsData);

      let hopkinsAudioUrl = undefined;

      // Handle Hopkins audio with enhanced logging
      if (hopkinsData.audioBase64) {
        try {
          console.log("🎭 Converting Hopkins synthesis audio...");

          const audioBytes = Uint8Array.from(
            atob(hopkinsData.audioBase64),
            (c) => c.charCodeAt(0)
          );

          const audioBlob = new Blob([audioBytes], {
            type: hopkinsData.mimeType || "audio/mpeg",
          });

          hopkinsAudioUrl = URL.createObjectURL(audioBlob);

          // Play Hopkins audio with video sync
          playAudioWithVideo(hopkinsAudioUrl, "anthony-hopkins");
        } catch (error) {
          console.error("Error converting Hopkins synthesis audio:", error);
        }
      }

      // Add Hopkins synthesis to conversation with special formatting
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              consultantResponses: [
                ...prev.consultantResponses,
                {
                  consultant: "🎭 Anthony Hopkins - Master Synthesis",
                  response: hopkinsData.text || hopkinsData.response,
                  timestamp: new Date(),
                  audioUrl: hopkinsAudioUrl,
                  isSpecial: true, // Mark as special synthesis
                  speakerId: "anthony-hopkins",
                },
              ],
            }
          : null
      );

      console.log("🎭 Hopkins Master Synthesis complete!");
    } catch (error) {
      console.error("Error with Hopkins synthesis:", error);
      hideCallOverlay(); // Hide overlay on error
      alert("Error requesting synthesis. Please try again.");
    } finally {
      setProcessingConsultant(null);
    }
  };

  // Enhanced audio playback with video sync - only plays video when audio starts
  const playAudioWithVideo = (audioUrl: string, speakerId: string) => {
    // Change video to match speaker but DON'T play yet
    changeVideoForSpeaker(speakerId);

    // Show "responding" phase
    const consultant = consultants.find((c) => c.id === speakerId);
    if (consultant) {
      showCallOverlay(consultant.name, "responding");
    }

    // Ensure video is paused and ready
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    // Play audio
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;

      // Start video ONLY when audio actually starts playing
      audioRef.current.onplay = () => {
        console.log(`${speakerId} started speaking - playing video`);
        setIsSpeaking(true); // Mark as actively speaking
        hideCallOverlay(); // Hide overlay when actually speaking
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(console.error);
        }
      };

      // Stop video when audio ends
      audioRef.current.onended = () => {
        console.log(`${speakerId} finished speaking - pausing video`);
        setIsSpeaking(false); // Mark as finished speaking
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0; // Reset to first frame (closed mouth)
        }
        // DON'T change video back to AXEL - keep current consultant on screen
      };

      // Handle audio pause/stop
      audioRef.current.onpause = () => {
        console.log(`${speakerId} audio paused`);
        setIsSpeaking(false); // Mark as not speaking when paused
        if (videoRef.current) {
          videoRef.current.currentTime = 0; // Reset to first frame (closed mouth)
        }
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

    // Set to AXEL video during processing but keep it paused (thinking mode)
    changeVideoForSpeaker("axel");

    // Show AXEL call overlay
    showCallOverlay("AXEL", "calling");

    try {
      console.log("Sending question to AXEL:", inputText);

      // Update overlay to show connected
      setTimeout(() => showCallOverlay("AXEL", "connected"), 1000);

      const dynamicUserPrompt = axelConsultant.userPrompt.replace(
        "{{USER_QUESTION}}",
        inputText
      );

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const conversationData = await response.json();
      console.log("AXEL response:", conversationData);

      let axelAudioUrl = undefined;

      // Handle base64 audio if provided
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

          // Play AXEL's audio with video sync
          playAudioWithVideo(axelAudioUrl, "axel");
        } catch (error) {
          console.error("Error converting base64 to audio:", error);
        }
      }

      // Set conversation data
      const newConversation = {
        question: inputText,
        axelResponse: conversationData.text || conversationData.response,
        axelAudioUrl,
        consultantResponses: [],
      };

      setConversation(newConversation);
      setShowConsultants(true);
    } catch (error) {
      console.error("Error communicating with n8n:", error);
      hideCallOverlay(); // Hide overlay on error
    } finally {
      setIsProcessing(false);
    }
  };

  // Replay AXEL audio
  const replayAxelAudio = () => {
    if (conversation?.axelAudioUrl && !isSpeaking) {
      // Only allow if no one is speaking
      console.log("Replaying AXEL audio...");
      playAudioWithVideo(conversation.axelAudioUrl, "axel");
    }
  };

  const handleConsultantClick = async (
    consultant: Consultant
  ): Promise<void> => {
    if (!conversation) return;

    // Prevent clicks if someone is actively speaking
    if (isSpeaking) {
      console.log("Someone is speaking - consultation blocked");
      return;
    }

    // Special handling for Anthony Hopkins synthesis
    if (consultant.id === "anthony-hopkins") {
      if (conversation.consultantResponses.length < 2) {
        alert(
          "Need at least 2 consultant responses before requesting synthesis from Anthony Hopkins."
        );
        return;
      }
      // Call the dedicated Hopkins synthesis function
      await handleHopkinsSynthesis();
      return;
    }

    setProcessingConsultant(consultant.id);

    // Change video to consultant during processing but keep it paused (thinking mode)
    changeVideoForSpeaker(consultant.id);

    // Show realistic call sequence
    showCallOverlay(consultant.name, "calling");

    try {
      console.log(`Consulting with ${consultant.name}...`);

      // Update to connected after a short delay
      setTimeout(() => showCallOverlay(consultant.name, "connected"), 1500);

      const previousConsultantsText = conversation.consultantResponses
        .map((resp) => `${resp.consultant}: "${resp.response}"`)
        .join("\n\n");

      const dynamicUserPrompt = consultant.userPrompt
        .replace("{{USER_QUESTION}}", conversation.question)
        .replace("{{AXEL_RESPONSE}}", conversation.axelResponse)
        .replace("{{PREVIOUS_CONSULTANTS}}", previousConsultantsText);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const consultantData: ConsultantData = await response.json();
      console.log(`${consultant.name} response:`, consultantData);

      let consultantAudioUrl: string | undefined = undefined;

      // Handle base64 audio if provided
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

          // Play consultant's audio with video sync
          playAudioWithVideo(consultantAudioUrl, consultant.id);
        } catch (error) {
          console.error(
            `Error converting ${consultant.name} base64 to audio:`,
            error
          );
        }
      }

      // Update conversation with consultant response
      setConversation((prev: Conversation | null) =>
        prev
          ? {
              ...prev,
              consultantResponses: [
                ...prev.consultantResponses,
                {
                  consultant: consultant.isSpecial
                    ? `🎭 ${consultant.name} - Master Synthesis`
                    : consultant.name,
                  response:
                    consultantData.text || consultantData.response || "",
                  timestamp: new Date(),
                  audioUrl: consultantAudioUrl,
                  speakerId: consultant.id, // Track speaker ID for video switching
                  isSpecial: consultant.isSpecial || false,
                },
              ],
            }
          : null
      );
    } catch (error) {
      console.error(`Error consulting with ${consultant.name}:`, error);
      hideCallOverlay(); // Hide overlay on error
      // Return to AXEL video on error
      changeVideoForSpeaker("axel");
    } finally {
      setProcessingConsultant(null);
    }
  };

  // Function to replay any consultant's audio
  const replayConsultantAudio = (response: ConsultantResponse) => {
    if (response.audioUrl && !isSpeaking) {
      // Only allow if no one is speaking
      console.log(`Replaying ${response.consultant} audio...`);
      playAudioWithVideo(response.audioUrl, response.speakerId || "axel");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - AXEL Interface */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <div className="max-w-md mx-auto text-center">
              {/* AXEL Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-red-500 mb-2 tracking-wider">
                  ⚡ AXEL ⚡
                </h1>
                <p className="text-xl text-gray-300 font-bold">
                  {axelConsultant.title}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {axelConsultant.expertise}
                </p>

                {/* Speaker Indicator */}
                <div className="mt-4 text-sm text-gray-300">
                  <span
                    className={`px-2 py-1 rounded ${
                      isPlaying ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    {isPlaying
                      ? currentSpeaker === "axel"
                        ? "AXEL Speaking"
                        : consultants.find((c) => c.id === currentSpeaker)
                            ?.name + " Speaking" || "AXEL Speaking"
                      : currentSpeaker === "axel"
                      ? "AXEL Thinking..."
                      : consultants.find((c) => c.id === currentSpeaker)?.name +
                          " Thinking..." || "AXEL Thinking..."}
                  </span>
                </div>
              </div>

              {/* Dynamic Video Container */}
              <div className="relative mb-8">
                <div className="border-4 border-red-500 rounded-lg overflow-hidden shadow-2xl shadow-red-500/20">
                  <video
                    ref={videoRef}
                    className="w-full h-auto aspect-[9/16]"
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
                  <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

                  {/* Call Overlay */}
                  {callOverlay && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-gray-900/90 border-2 border-red-500/50 rounded-xl p-6 text-center max-w-xs mx-4">
                        <div className="mb-4">
                          {callOverlay.phase === "calling" && (
                            <div className="w-16 h-16 mx-auto mb-3 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {callOverlay.phase === "connected" && (
                            <div className="w-16 h-16 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
                            </div>
                          )}
                          {callOverlay.phase === "responding" && (
                            <div className="w-16 h-16 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <h3 className="text-white font-bold text-lg mb-2">
                          {callOverlay.consultant}
                        </h3>

                        <p className="text-gray-300 text-sm mb-3">
                          {callOverlay.message}
                        </p>

                        <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
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

              {/* Consultants Specializations */}
              <div className="border rounded-xl  border-amber-300/50 p-2">
                <h2 className="text-2xl text-white">Choose Specialization</h2>
                <div className="flex justify-between my-4">
                  <Button
                    className={
                      consultantType === "default"
                        ? "bg-red-700"
                        : "bg-yellow-800"
                    }
                    onClick={() => setConsultantType("default")}
                  >
                    Normal
                  </Button>
                  <Button
                    className={
                      consultantType === "business-automation"
                        ? "bg-red-700"
                        : "bg-yellow-800"
                    }
                    onClick={() => setConsultantType("business-automation")}
                  >
                    Business Automation
                  </Button>
                  <Button
                    className={
                      consultantType === "saas" ? "bg-red-700" : "bg-yellow-800"
                    }
                    onClick={() => setConsultantType("saas")}
                  >
                    SaaS Experts
                  </Button>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-4 justify-center mb-8">
                {conversation?.axelAudioUrl && (
                  <button
                    onClick={replayAxelAudio}
                    disabled={isSpeaking} // Disable if someone is speaking
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                  >
                    {isSpeaking ? "🔇" : "🔊"} REPLAY AXEL
                  </button>
                )}
              </div>

              {/* Input Section */}
              <div className="mb-8">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-4 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none resize-none"
                  rows={8}
                  placeholder={
                    sampleQuestion.length
                      ? sampleQuestion
                      : "Ask AXEL anything about business, automation, or making money..."
                  }
                />
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing || !inputText.trim() || isSpeaking} // Disable if speaking
                  className="w-full mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100"
                >
                  {isProcessing
                    ? "🤖 AXEL IS THINKING..."
                    : isSpeaking
                    ? "🔊 CONSULTANT SPEAKING..."
                    : "🚀 CONSULT AXEL"}
                </button>
              </div>

              {/* Conversation Display */}
              {conversation && (
                <div className="bg-black/60 border border-red-500/30 rounded-lg p-6 mb-6">
                  <h4 className="text-red-400 font-bold text-lg mb-4">
                    💬 CONSULTATION HISTORY
                  </h4>

                  {/* Original Question */}
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-gray-300 text-sm font-bold mb-1">
                      YOUR QUESTION:
                    </p>
                    <p className="text-white">{conversation.question}</p>
                  </div>

                  {/* AXEL Response */}
                  <div className="mb-4 p-3 bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-red-400 text-sm font-bold">⚡ AXEL:</p>
                      {conversation.axelAudioUrl && (
                        <button
                          onClick={replayAxelAudio}
                          className="bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1"
                        >
                          🔄 Replay
                        </button>
                      )}
                    </div>
                    <p className="text-gray-200">{conversation.axelResponse}</p>
                  </div>

                  {/* Consultant Responses */}
                  {conversation.consultantResponses.map((response, index) => {
                    const isHopkinsSynthesis =
                      response.consultant.includes("Hopkins") ||
                      response.isSpecial;

                    return (
                      <div
                        key={index}
                        className={`mb-4 p-4 rounded-lg ${
                          isHopkinsSynthesis
                            ? "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50"
                            : "bg-blue-900/20 border-l-4 border-blue-500"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-bold ${
                                isHopkinsSynthesis
                                  ? "text-purple-300"
                                  : "text-blue-400"
                              }`}
                            >
                              {isHopkinsSynthesis ? "🎭" : "🧠"}{" "}
                              {response.consultant.toUpperCase()}
                            </p>
                            {isHopkinsSynthesis && (
                              <span className="bg-purple-600/30 text-purple-200 text-xs px-2 py-1 rounded-full">
                                MASTER SYNTHESIS
                              </span>
                            )}
                          </div>
                          {response.audioUrl && (
                            <button
                              onClick={() => replayConsultantAudio(response)}
                              disabled={isSpeaking} // Disable if someone is speaking
                              className={`${
                                isHopkinsSynthesis
                                  ? "bg-purple-600/30 hover:bg-purple-600/50 disabled:bg-gray-600/30 text-purple-300 disabled:text-gray-400"
                                  : "bg-blue-600/30 hover:bg-blue-600/50 disabled:bg-gray-600/30 text-blue-300 disabled:text-gray-400"
                              } text-xs px-3 py-1 rounded-full transition-all duration-200 flex items-center gap-1`}
                            >
                              {isSpeaking ? "🔇" : "🔄"} Replay
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
                            <div className="mb-3 text-center">
                              <p className="text-xs text-purple-300 italic">
                                &quot;I have observed your consultation with
                                considerable interest...&quot;
                              </p>
                            </div>
                          )}
                          <p className="leading-relaxed">{response.response}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {response.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Consultant Selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  🧠 LEGENDARY MINDS -{" "}
                  <span className="text-red-700 uppercase">
                    {consultantType}
                  </span>
                </h2>
                <p className="text-gray-300 text-sm">
                  Get additional perspectives from history&apos;s greatest
                  business minds
                </p>
              </div>

              {/* Consultant Cards */}
              <div className="space-y-4">
                {consultants.map((consultant) => {
                  const isProcessing = processingConsultant === consultant.id;
                  const hasResponded = conversation?.consultantResponses.some(
                    (r) =>
                      r.consultant
                        .toLowerCase()
                        .includes(consultant.name.toLowerCase())
                  );

                  // Special logic for Anthony Hopkins (synthesis)
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
                      className={`bg-gradient-to-r ${
                        consultant.gradient
                      } border-2 ${
                        consultant.borderColor
                      } rounded-lg p-4 transition-all duration-300 ${
                        !showConsultants ||
                        (isHopkins && !canUseHopkins) ||
                        isSpeaking ||
                        isProcessing
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:scale-105 hover:shadow-lg"
                      } ${isProcessing ? "animate-pulse" : ""} ${
                        hasResponded ? "ring-2 ring-green-400" : ""
                      } ${
                        isHopkins
                          ? "shadow-purple-500/20 shadow-lg border-purple-400"
                          : ""
                      }`}
                      onClick={() => {
                        // Prevent all clicks if conditions aren't met
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
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 overflow-hidden bg-black/30 rounded-full flex items-center justify-center border-2 border-white/20">
                          {isProcessing ? (
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                              {consultant.image && (
                                <Image
                                  src={consultant.image}
                                  alt={consultant.name}
                                  width={64}
                                  height={64}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg">
                            {consultant.name}
                          </h3>
                          <p className="text-sm text-gray-200 font-medium">
                            {consultant.title}
                          </p>
                          <p className="text-xs text-gray-300 mt-1">
                            {consultant.expertise}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-center">
                          <div className="bg-black/40 rounded-lg px-3 py-2">
                            <p className="text-white font-bold text-lg">
                              {consultant.price}
                            </p>
                            <p className="text-xs text-gray-300">
                              {isHopkins ? "synthesis" : "per question"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Hint */}
                      <div className="mt-3 text-center">
                        <p className="text-xs text-white/80 bg-black/20 rounded-full px-3 py-1 inline-block">
                          {!showConsultants
                            ? "Ask AXEL first →"
                            : isSpeaking
                            ? "🔊 Someone is speaking..."
                            : isProcessing
                            ? isHopkins
                              ? "Synthesizing..."
                              : "Thinking..."
                            : hopkinsMessage
                            ? hopkinsMessage
                            : isHopkins
                            ? "Click for Master Synthesis →"
                            : hasResponded
                            ? "Click to consult again →"
                            : "Click to consult →"}
                        </p>
                      </div>

                      {/* Show consultation count */}
                      {hasResponded && !isHopkins && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-green-300">
                            ✓ Consulted{" "}
                            {
                              conversation?.consultantResponses.filter((r) =>
                                r.consultant
                                  .toLowerCase()
                                  .includes(consultant.name.toLowerCase())
                              ).length
                            }{" "}
                            time(s)
                          </p>
                        </div>
                      )}

                      {/* Special Hopkins indicator */}
                      {isHopkins && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-purple-200 italic">
                            &quot;I shall dissect each perspective with surgical
                            precision...&quot;
                          </p>
                          {canUseHopkins && conversation && (
                            <p className="text-xs text-purple-300 mt-1 font-semibold">
                              Ready to synthesize{" "}
                              {conversation.consultantResponses.length + 1}{" "}
                              perspectives
                            </p>
                          )}
                        </div>
                      )}

                      {/* Hopkins synthesis completion indicator */}
                      {isHopkins && hasResponded && (
                        <div className="mt-2 text-center">
                          <p className="text-xs text-green-300">
                            ✓ Master Synthesis Complete
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Call-to-Action */}
              <div className="mt-6 text-center">
                <div className="bg-black/40 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">💡 How It Works</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    1. Ask AXEL your question (free)
                    <br />
                    2. Get perspectives from 2+ legends
                    <br />
                    3. Anthony Hopkins synthesizes all wisdom
                    <br />
                    4. Receive your master strategy
                  </p>
                  {conversation &&
                    conversation.consultantResponses.length > 0 &&
                    conversation.consultantResponses.length < 2 && (
                      <p className="text-yellow-400 text-xs mb-2">
                        💡 Consult with 2+ legends to unlock Anthony Hopkins
                        synthesis
                      </p>
                    )}
                  {conversation && (
                    <button
                      onClick={() => {
                        setConversation(null);
                        setShowConsultants(false);
                        setInputText("");
                        // Clean up any stored audio URLs
                        if (conversation?.axelAudioUrl) {
                          URL.revokeObjectURL(conversation.axelAudioUrl);
                        }
                        conversation.consultantResponses.forEach((resp) => {
                          if (resp.audioUrl) {
                            URL.revokeObjectURL(resp.audioUrl);
                          }
                        });
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                    >
                      🔄 Start New Consultation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
