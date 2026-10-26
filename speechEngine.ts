import { LanguageCode } from '../types';

export interface SpeechRecognitionCallbacks {
  onStart: () => void;
  onEnd: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onVolumeChange: (volume: number) => void; // 0 to 100 for audio visualizer
}

class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  // Check if browser supports Web Speech API
  public isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public isSynthesisSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      Boolean(window.speechSynthesis) &&
      'SpeechSynthesisUtterance' in window
    );
  }

  // Get available voices
  public getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isSynthesisSupported()) {
        resolve([]);
        return;
      }
      try {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          window.speechSynthesis.onvoiceschanged = () => {
            try {
              voices = window.speechSynthesis.getVoices();
              resolve(voices);
            } catch {
              resolve([]);
            }
          };
          // Timeout fallback
          setTimeout(() => {
            try {
              resolve(window.speechSynthesis.getVoices());
            } catch {
              resolve([]);
            }
          }, 500);
        }
      } catch {
        resolve([]);
      }
    });
  }

  // Start Speech Recognition
  public async startListening(
    lang: LanguageCode,
    callbacks: SpeechRecognitionCallbacks
  ): Promise<boolean> {
    if (!this.isRecognitionSupported()) {
      callbacks.onError('Web Speech Recognition is not supported in this browser. Please use text input.');
      return false;
    }

    // Stop speaking if assistant is currently talking (interrupt)
    this.stopSpeaking();

    try {
      // Setup Mic Volume Analyser for the AI Orb
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            this.audioContext = new AudioCtx();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64;
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
              if (!this.isListening || !this.analyser) {
                callbacks.onVolumeChange(0);
                return;
              }
              this.analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const avg = sum / bufferLength;
              const normalizedVolume = Math.min(100, Math.round((avg / 128) * 100));
              callbacks.onVolumeChange(normalizedVolume);
              this.animFrameId = requestAnimationFrame(checkVolume);
            };
            this.animFrameId = requestAnimationFrame(checkVolume);
          }
        } catch (mediaErr) {
          console.warn('Microphone stream meter unavailable:', mediaErr);
        }
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      // Select language for recognition
      if (lang === 'hi-IN') {
        this.recognition.lang = 'hi-IN';
      } else if (lang === 'en-IN') {
        this.recognition.lang = 'en-IN';
      } else if (lang === 'hinglish') {
        // Hinglish works best with en-IN or hi-IN depending on browser engine
        this.recognition.lang = 'en-IN';
      } else {
        this.recognition.lang = 'en-US';
      }

      this.recognition.onstart = () => {
        this.isListening = true;
        callbacks.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        if (finalTranscript) {
          callbacks.onResult(finalTranscript, true);
        } else if (interimTranscript) {
          callbacks.onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        let errorMsg = 'Speech recognition error.';
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'network') {
          errorMsg = 'Network issue affecting speech service. You can type your request directly.';
        }
        callbacks.onError(errorMsg);
      };

      this.recognition.onend = () => {
        this.cleanupAudioMeter();
        this.isListening = false;
        callbacks.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.cleanupAudioMeter();
      callbacks.onError(err?.message || 'Failed to initialize voice recognition.');
      return false;
    }
  }

  // Stop Speech Recognition
  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.cleanupAudioMeter();
    this.isListening = false;
  }

  private cleanupAudioMeter() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  // Clean text before reading aloud: strip action tags and markdown symbols
  public cleanTextForSpeech(rawText: string): string {
    return rawText
      // Remove action directives: [ACTION:name:{...}]
      .replace(/\[ACTION:[^\]]+\]/g, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, 'Code snippet provided in chat.')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown links [title](url) -> title
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove headers and bullets
      .replace(/^[#*>-]+\s+/gm, '')
      // Remove bold/italic markers
      .replace(/[*_]{1,3}/g, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Text to Speech
  public speak(
    text: string,
    options: {
      lang?: LanguageCode;
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ) {
    if (!this.isSynthesisSupported()) {
      options.onEnd?.();
      return;
    }

    const spokenText = this.cleanTextForSpeech(text);
    if (!spokenText) {
      options.onEnd?.();
      return;
    }

    try {
      // Cancel current speech if any
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      let voices: SpeechSynthesisVoice[] = [];
      try {
        voices = window.speechSynthesis.getVoices();
      } catch {}

      // Prefer selected voice URI or match language
      if (options.voiceURI) {
        const match = voices.find((v) => v.voiceURI === options.voiceURI);
        if (match) utterance.voice = match;
      }

      if (!utterance.voice && options.lang) {
        if (options.lang === 'hi-IN') {
          const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
          if (hindiVoice) utterance.voice = hindiVoice;
        } else if (options.lang === 'en-IN' || options.lang === 'hinglish') {
          const indianVoice = voices.find((v) => v.lang === 'en-IN' || v.lang.includes('IN'));
          if (indianVoice) utterance.voice = indianVoice;
        }
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        options.onError?.(e);
        options.onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis caught unexpected error:', e);
      options.onEnd?.();
    }
  }

  public stopSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public pauseSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.pause();
    }
  }

  public resumeSpeaking() {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.isSynthesisSupported() && window.speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    return this.isSynthesisSupported() && window.speechSynthesis.paused;
  }
}

export const speechEngine = new SpeechEngine();
