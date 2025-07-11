# AI-Powered Customer Support Agent

A fully autonomous AI customer support agent using Node.js, LangChain v0.3+, and LangGraph.

## Features

- 🧠 Structured Memory with short-term and long-term recall
- 🔄 Autonomous Execution & Control Flow via LangGraph
- 🛠 Tool Integration (APIs, calculators, SQL queries, email sending)
- 📝 Multi-turn Planning for complex goals
- 🎯 Function Calling with Zod schema validation
- 🔍 Natural Language Understanding
- 📊 Output Parsing and structured responses
- 📥 Context Injection of relevant data
- 🌡️ Temperature & Mode Adaptation
- ⚠️ Error Handling and graceful degradation
- 🔄 Feedback Loop / Self-Evaluation
- 👤 Human Escalation when needed
- 🛡️ Security & Safety features
- 💻 Web UI with React + TailwindCSS
- 👥 Role-based Access Control
- 🎭 Personalization based on user preferences
- 📤 Multimodal Input support
- 🌐 Multi-language capabilities

## Tech Stack

- **Backend**: Node.js + TypeScript
- **Agent Framework**: LangChain v0.3+ with LangGraph
- **Vector DB**: Supabase PGVector
- **Embeddings**: `intfloat/e5-large-v2` with batching and caching
- **Email Tools**: Nodemailer
- **Function Calling**: OpenAI Tool calling or LangChain tools
- **UI**: React + TailwindCSS with streaming + markdown
- **State**: LangGraph + Supabase/Redis for persistence
- **Validation**: Zod
- **Security**: Schema guards, PII filters, rate limiting, audit trails

## Getting Started

### Prerequisites

- Node.js v18+
- npm or pnpm
- OpenAI API key
- Supabase account (optional, for vector storage)
- Redis (optional, for state management)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-support-agent.git
   cd ai-support-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables example file:
   ```bash
   cp .env.example .env
   ```

4. Fill in your environment variables in the `.env` file

5. Build the project:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

### Development

For development with hot reloading:

```bash
npm run dev
```

## Architecture

The agent is built with a modular architecture:

1. **Core Agent**: Uses LangGraph for workflow orchestration with a React-Reflect-Act loop
2. **Memory System**: Short-term conversation memory + long-term vector storage
3. **Tool System**: Pluggable tools with Zod schema validation
4. **API Layer**: Express.js REST API with streaming support
5. **Security**: Input validation, rate limiting, PII detection
6. **UI**: React frontend with real-time streaming

## API Usage

Start a conversation:

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "I need help with my recent order",
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "user123"
  }'
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.