export type ConsultantResponse = {
  consultant: string;
  response: string;
  timestamp: Date;
  audioUrl?: string;
  isSpecial?: boolean;
  speakerId?: string;
};

export type Conversation = {
  question: string;
  axelResponse: string;
  axelAudioUrl?: string;
  consultantResponses: ConsultantResponse[];
};

export interface Consultant {
  id: string;
  name: string;
  title: string;
  expertise: string;
  price: string;
  image?: string;
  video?: string;
  gradient?: string;
  borderColor?: string;
  voiceId?: string;
  systemPrompt: string;
  userPrompt: string;
  isSpecial?: boolean;
}

export interface ConsultantData {
  text?: string;
  response?: string;
  audioBase64?: string;
  mimeType?: string;
}