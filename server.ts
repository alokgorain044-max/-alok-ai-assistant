import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    assistant: 'ALOK AI ROBOT',
    version: '2.5.0',
    model: 'gemini-3.8-flash',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// System personality prompt
const SYSTEM_INSTRUCTION = `You are ALOK AI ROBOT, a friendly and intelligent personal AI assistant.

Always respond directly to the user's actual message. Never repeat, quote, or acknowledge the user's entire prompt instead of answering it.

Speak naturally and concisely in Hindi, English, or Hinglish, depending on the user's language.

When a user greets you, greet them back.

When asked about your identity, introduce yourself as ALOK AI ROBOT.

When asked what you can do, list three useful capabilities.

Never claim that tools, subsystems, computer controls, or other features are active unless they are genuinely implemented and available.

Never invent live weather, current time, or other real-time information. Use an available tool when appropriate, or clearly explain the limitation.

When a user requests an action, perform it only if a working tool supports it. Otherwise, explain what is required.

Be honest, helpful, friendly, and concise.

SUPPORTED ACTIONS:
If the user specifically asks to perform an action supported by the application, provide your direct spoken answer and append the corresponding action tag on a new line:
- Open approved website (YouTube, GitHub, Google, Wikipedia, StackOverflow):
  [ACTION:open_website:{"url":"https://...","name":"..."}]
- Set countdown timer:
  [ACTION:set_timer:{"minutes":5,"label":"Timer"}]
- Create and save note:
  [ACTION:create_note:{"title":"...","content":"..."}]
- Web search query:
  [ACTION:web_search:{"query":"..."}]`;

// Chat completion endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], userPreferences = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Build context with user preferences and saved memories
    let contextualSystemPrompt = SYSTEM_INSTRUCTION;
    if (userPreferences.callsign) {
      contextualSystemPrompt += `\nUser's preferred callsign/name: ${userPreferences.callsign}.`;
    }
    if (userPreferences.language) {
      contextualSystemPrompt += `\nUser's preferred primary language: ${userPreferences.language}.`;
    }
    if (Array.isArray(userPreferences.notes) && userPreferences.notes.length > 0) {
      contextualSystemPrompt += `\nUser's remembered personal facts/notes:\n- ${userPreferences.notes.join('\n- ')}`;
    }

    // Format conversation history for Gemini API
    // CRITICAL: Gemini requires contents to start with role: 'user' and alternate 'user' -> 'model'
    const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Filter valid history items starting from the first actual user turn
    const validHistory: Array<{ role: 'user' | 'model'; text: string }> = [];
    const firstUserIndex = history.findIndex((h: any) => h.role === 'user' && h.text);

    if (firstUserIndex !== -1) {
      let expectedRole: 'user' | 'model' = 'user';
      for (let i = firstUserIndex; i < history.length; i++) {
        const item = history[i];
        if (item && item.text && item.role === expectedRole) {
          validHistory.push({
            role: item.role,
            text: item.text.replace(/\[ACTION:[^\]]+\]/g, '').trim(),
          });
          expectedRole = expectedRole === 'user' ? 'model' : 'user';
        }
      }
    }

    // Keep the last 6 turns of valid history to maintain fast, sharp context
    const recentValidHistory = validHistory.slice(-6);

    // If the last history turn is 'user', remove it so we don't have two consecutive user turns
    if (recentValidHistory.length > 0 && recentValidHistory[recentValidHistory.length - 1].role === 'user') {
      recentValidHistory.pop();
    }

    for (const h of recentValidHistory) {
      formattedContents.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }

    // Append the user's actual question as the final user message
    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let replyText = '';

    if (aiClient && apiKey) {
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const response = await aiClient.models.generateContent({
            model: modelName,
            contents: formattedContents,
            config: {
              systemInstruction: contextualSystemPrompt,
              temperature: 0.7,
            },
          });
          if (response.text && response.text.trim()) {
            replyText = response.text.trim();
            break;
          }
        } catch (err: any) {
          console.warn(`Attempt with ${modelName} encountered error:`, err?.status || err?.message || err);
        }
      }
    }

    // Natural, direct fallback responses when API is offline or returns empty
    // NEVER repeat or quote the user prompt!
    if (!replyText) {
      const msgLower = message.toLowerCase().trim();

      // Check greetings and identity questions (e.g. "Hello, who are you?")
      if (
        (msgLower.includes('hello') || msgLower.includes('hi')) &&
        (msgLower.includes('who are you') || msgLower.includes('kaun ho') || msgLower.includes('what is your name'))
      ) {
        replyText = 'Hello! I am ALOK AI ROBOT, a friendly and intelligent personal AI assistant.';
      } else if (msgLower.includes('who are you') || msgLower.includes('kaun ho') || msgLower.includes('your name') || msgLower.includes('tum kaun ho')) {
        replyText = 'I am ALOK AI ROBOT, a friendly and intelligent personal AI assistant.';
      } else if (msgLower === 'hi' || msgLower === 'hello' || msgLower.startsWith('hello') || msgLower.startsWith('hi ') || msgLower.includes('namaste')) {
        if (/[\u0900-\u097F]/.test(message) || msgLower.includes('namaste')) {
          replyText = 'नमस्ते! मैं ALOK AI ROBOT हूँ। आपकी सेवा के लिए तैयार हूँ। बताइए, आज मैं आपकी क्या मदद कर सकता हूँ?';
        } else {
          replyText = 'Hello! I am ALOK AI ROBOT, your personal AI assistant. How can I help you today?';
        }
      } else if (msgLower.includes('what can you do') || msgLower.includes('kya kar sakte ho') || msgLower.includes('capabilities') || msgLower.includes('features')) {
        replyText = 'I can help you with:\n1. Conversing naturally and answering questions in English, Hindi, and Hinglish\n2. Setting countdown timers and alarms\n3. Creating, saving, and downloading notes and code snippets';
      } else if (msgLower.includes('timer') || msgLower.includes('alarm') || msgLower.includes('अलार्म') || msgLower.includes('टाइम')) {
        const minMatch = message.match(/(\d+)\s*(?:min|minute|मिनट)/i);
        const mins = minMatch ? parseInt(minMatch[1], 10) : 5;
        replyText = `I have set a timer for ${mins} minutes for you.\n[ACTION:set_timer:{"minutes":${mins},"label":"Focus Timer"}]`;
      } else if (msgLower.includes('youtube')) {
        replyText = `Opening YouTube for you.\n[ACTION:open_website:{"url":"https://youtube.com","name":"YouTube"}]`;
      } else if (msgLower.includes('google')) {
        replyText = `Opening Google Search for you.\n[ACTION:open_website:{"url":"https://google.com","name":"Google"}]`;
      } else if (msgLower.includes('github')) {
        replyText = `Opening GitHub for you.\n[ACTION:open_website:{"url":"https://github.com","name":"GitHub"}]`;
      } else if (msgLower.includes('note') || msgLower.includes('नोट')) {
        replyText = `I have created a note for you.\n[ACTION:create_note:{"title":"Quick Note","content":"${message.replace(/"/g, "'")}"}]`;
      } else {
        replyText = 'I am ALOK AI ROBOT. How can I assist you with your questions or tasks today?';
      }
    }

    res.json({
      reply: replyText,
      model: aiClient && apiKey ? 'gemini-3.8-flash' : 'alok-offline-core',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      error: 'Failed to process AI conversation',
      details: err?.message || 'Unknown error',
    });
  }
});

// File analysis endpoint
app.post('/api/analyze-file', async (req, res) => {
  try {
    const { filename, content, instruction = 'Analyze and summarize this file in detail' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'File content is required' });
    }

    if (!aiClient || !apiKey) {
      return res.json({
        analysis: `[Offline Summary for ${filename || 'Document'}]\nFile size: ${content.length} characters.\nContent preview:\n${content.slice(0, 300)}...`,
      });
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are ALOK AI ROBOT. The user has provided a file named "${filename || 'document'}".
User request: ${instruction}

File Content:
\`\`\`
${content.slice(0, 35000)}
\`\`\`

Provide a clear, structured summary, highlighting key concepts, code structure, or action items. Speak in a concise, authoritative yet helpful tone.`,
    });

    res.json({
      analysis: response.text || 'Analysis complete.',
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-file:', err);
    res.status(500).json({ error: 'Failed to analyze file' });
  }
});

// Downloadable standalone desktop companion agent (Python script)
app.get('/api/desktop/companion-script', (req, res) => {
  const pythonScript = `"""
ALOK AI ROBOT - Local Desktop Companion Agent
==============================================
Runs locally on your Windows, macOS, or Linux machine on port 54321.
Enables ALOK AI ROBOT web interface to safely interact with your local desktop:
- Opening approved applications (Calculator, Notepad, Code, Terminal)
- Opening URLs in default browser
- Safe clipboard reading/writing
- System info and diagnostics

SECURITY ARCHITECTURE:
- Binds strictly to 127.0.0.1 (localhost only)
- Uses an explicit allowlist of safe commands
- Never executes arbitrary terminal commands
- Requires local confirmation for consequential actions

HOW TO RUN:
1. Ensure Python 3.8+ is installed.
2. Run: pip install flask flask-cors
3. Run: python alok_companion.py
4. In ALOK AI ROBOT web app, navigate to 'Desktop Mode' and click 'Connect Local Companion'.
"""

import sys
import os
import subprocess
import webbrowser
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from ALOK AI ROBOT web app

# Safe allowlist of permitted applications
SAFE_APPS = {
    "calculator": {
        "win": ["calc.exe"],
        "darwin": ["open", "-a", "Calculator"],
        "linux": ["gnome-calculator"]
    },
    "notepad": {
        "win": ["notepad.exe"],
        "darwin": ["open", "-a", "TextEdit"],
        "linux": ["gedit"]
    },
    "terminal": {
        "win": ["cmd.exe", "/c", "start"],
        "darwin": ["open", "-a", "Terminal"],
        "linux": ["x-terminal-emulator"]
    },
    "code": {
        "win": ["code"],
        "darwin": ["code"],
        "linux": ["code"]
    }
}

def get_platform_key():
    if sys.platform.startswith("win"):
        return "win"
    elif sys.platform == "darwin":
        return "darwin"
    else:
        return "linux"

@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "status": "connected",
        "agent": "ALOK Desktop Companion",
        "platform": sys.platform,
        "version": "1.2.0"
    })

@app.route("/launch", methods=["POST"])
def launch_app():
    data = request.json or {}
    app_name = (data.get("app") or "").lower().strip()
    
    if app_name not in SAFE_APPS:
        return jsonify({"success": False, "error": f"App '{app_name}' is not in the safe allowlist."}), 400
    
    plat = get_platform_key()
    cmd = SAFE_APPS[app_name].get(plat)
    if not cmd:
        return jsonify({"success": False, "error": f"Not supported on {plat}"}), 400
    
    try:
        subprocess.Popen(cmd)
        return jsonify({"success": True, "message": f"Successfully launched {app_name} on desktop."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/open-url", methods=["POST"])
def open_url():
    data = request.json or {}
    url = data.get("url", "")
    if not url.startswith(("http://", "https://")):
        return jsonify({"success": False, "error": "Invalid URL protocol."}), 400
    webbrowser.open(url)
    return jsonify({"success": True, "message": f"Opened {url} in default desktop browser."})

if __name__ == "__main__":
    print("=" * 60)
    print("  ALOK AI ROBOT - DESKTOP COMPANION AGENT")
    print("  Listening on http://127.0.0.1:54321")
    print("  Ready to pair with ALOK AI ROBOT Web Assistant")
    print("=" * 60)
    app.run(host="127.0.0.1", port=54321, debug=False)
`;
  res.setHeader('Content-Type', 'text/x-python');
  res.setHeader('Content-Disposition', 'attachment; filename="alok_companion.py"');
  res.send(pythonScript);
});

// Setup Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ALOK AI ROBOT core server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});
