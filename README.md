# Voice Chat - AI-Powered Chat Platform

![alt text](bird.jpg)

A comprehensive multi-platform AI chat application with a main focus on VOICE. Featuring web, mobile, and intelligent agent capabilities. Built with modern technologies and designed for scalable, real-time AI conversations with support for multiple AI models.

Try it out: https://gcf.nikolanikolovski.com/chat

## 🚀 Features

### Core Chat Functionality
- **Multi-platform Support**: Web (React), Mobile (React Native), and AI Agent integration
- **Real-time AI Conversations**: Seamless chat experience with multiple AI models
- **Multiple Chat Sessions**: Create and manage multiple conversation threads
- **Message Management**: Delete individual messages or entire conversations
- **Audio Support**: Voice message recording, playback, and transcription
- **File Upload**: Support for various file types and processing

### AI Model Management
- **Dual Model System**: Light models for quick responses, heavy models for complex tasks
- **Model Selection**: Choose from various AI providers (OpenAI, Anthropic, etc.)
- **Dynamic Configuration**: Switch models per chat session
- **API Key Management**: Secure storage and management of API credentials

### Authentication & Security
- **User Registration & Login**: Secure authentication system
- **JWT-based Authentication**: Stateless authentication with refresh tokens
- **Password Encryption**: Secure password hashing with Argon2
- **API Key Encryption**: Encrypted storage of third-party API keys

### Enterprise Features
- **Multi-user Support**: Individual user accounts and data isolation
- **Chat History**: Persistent conversation storage
- **Responsive Design**: Optimized for desktop and mobile devices
- **Docker Deployment**: Containerized services for easy deployment

## 🏗️ Architecture

The application follows a microservices architecture with four main components:

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Web App<br/>React + TypeScript]
        MOB[Mobile App<br/>React Native]
    end
    
    subgraph "API Layer"
        BE[Backend API<br/>FastAPI + Python]
    end
    
    subgraph "AI Layer"
        AI[AI Agent<br/>LangGraph]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database)]
        MONGO[(MongoDB<br/>Files & Logs)]
    end
    
    WEB --> BE
    MOB --> BE
    BE --> AI
    BE --> DB
    BE --> MONGO
    AI --> DB
```

### Technology Stack

#### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + Custom components
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v6

#### Mobile
- **Framework**: React Native 0.81
- **Navigation**: React Navigation v7
- **State Management**: React Context + AsyncStorage
- **Audio**: react-native-audio-recorder-player
- **UI**: Custom components with React Native styling

#### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL with SQLAlchemy + AsyncPG
- **Authentication**: JWT with PassLib (Argon2)
- **File Storage**: MongoDB GridFS
- **Dependency Injection**: dependency-injector
- **API Documentation**: Automatic OpenAPI/Swagger

#### AI Agent
- **Framework**: LangGraph with LangChain
- **Models**: Multi-provider support (OpenAI, Anthropic, Google, etc.)
- **Orchestration**: Step-based workflow execution
- **Tools**: File processing, web scraping, code execution

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Deployment**: Multi-stage Docker builds
- **Environment**: Environment-based configuration

## 📦 Project Structure

```
general-chat/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── lib/            # Utility libraries
│   │   └── pages/          # Page components
│   ├── Dockerfile
│   └── package.json
├── mobile/                   # React Native mobile app
│   ├── src/
│   │   ├── components/      # React Native components
│   │   ├── contexts/        # App contexts
│   │   ├── services/        # API services
│   │   └── types/          # TypeScript types
│   ├── android/            # Android native code
│   ├── ios/               # iOS native code
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── src/accounting_agent/
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication services
│   │   ├── databases/     # Database connections
│   │   ├── models/        # Data models
│   │   └── services/      # Business logic
│   ├── Dockerfile
│   └── pyproject.toml
├── ai-agent/                # LangGraph AI agent
│   ├── src/agent/
│   │   ├── core/          # Core agent logic
│   │   ├── models/        # AI model configurations
│   │   ├── prompts/       # Agent prompts
│   │   └── tools/         # Agent tools
│   ├── Dockerfile
│   └── pyproject.toml
└── deploy-docker.sh        # Deployment script
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **Python 3.10+** (for local development)
- **PostgreSQL** (if running locally)

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd general-chat
   ```

2. **Deploy with Docker:**
   ```bash
   chmod +x deploy-docker.sh
   ./deploy-docker.sh
   ```

3. **Access the applications:**
   - Web App: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup
```bash
cd backend

# Install dependencies
pip install poetry
poetry install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
poetry run python -m accounting_agent.utils.init_db

# Start the server
poetry run uvicorn accounting_agent.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

#### AI Agent Setup
```bash
cd ai-agent

# Install dependencies
pip install -e .
pip install "langgraph-cli[inmem]"

# Start LangGraph server
langgraph dev
```

#### Mobile Setup
```bash
cd mobile

# Install dependencies
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatdb
MONGO_URL=mongodb://localhost:27017

# Authentication
JWT_SECRET=your-jwt-secret-key
ALGORITHM=HS256
ENCRYPTION_KEY=your-encryption-key

# LangGraph
LANGGRAPH_URL=http://localhost:8123
LANGGRAPH_WEBHOOK_URL=http://localhost:8000/webhook/langgraph

# File Upload
UPLOAD_PASSWORD=your-upload-password
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:8000
```

#### AI Agent (.env)
```bash
LANGSMITH_API_KEY=your-langsmith-key  # Optional
OPENAI_API_KEY=your-openai-key       # For AI models
```

## 📱 Usage

### Web Application

1. **Access the web app** at http://localhost:3000
2. **Register** a new account or **login** with existing credentials
3. **Create a new chat** thread from the sidebar
4. **Configure AI models** for the chat (light/heavy model selection)
5. **Start chatting** with text messages or voice recordings
6. **Manage conversations** - delete messages, switch between chats

### Mobile Application

1. **Install the mobile app** on your device
2. **Configure the API endpoint** in settings (defaults to production)
3. **Login or register** using the same credentials as web
4. **Create and manage chats** with touch-optimized interface
5. **Record voice messages** using the microphone button
6. **Sync across devices** - chats are shared between web and mobile

### API Usage

The backend provides a comprehensive REST API:

#### Authentication
```bash
# Register
POST /auth/register
{
  "username": "user",
  "email": "user@example.com",
  "password": "password"
}

# Login
POST /auth/login
{
  "username": "user",
  "password": "password"
}
```

#### Chat Management
```bash
# Get all chats
GET /chats/get-all
Authorization: Bearer <token>

# Create new thread
POST /chats/create-thread
{
  "title": "New Conversation"
}

# Send message
POST /chats/{thread_id}/send
{
  "message": "Hello AI!",
  "light_model": "gpt-3.5-turbo",
  "heavy_model": "gpt-4"
}

# Get messages
GET /chats/{thread_id}/messages
```

## 🚢 Deployment

### Production Deployment

The application includes Docker configurations for production deployment:

1. **Build and push images:**
   ```bash
   ./deploy-docker.sh
   ```

2. **Deploy to production server:**
   ```bash
   # Pull images on production server
   docker pull nnikolovskii/gc-frontend:latest
   docker pull nnikolovskii/gc-backend:latest
   docker pull nnikolovskii/gc-ai:latest

   # Run with docker-compose
   docker-compose up -d
   ```

3. **Configure environment:**
   - Set production environment variables
   - Configure domain and SSL certificates
   - Set up database backups
   - Configure monitoring and logging

### Scaling Considerations

- **Load Balancing**: Use nginx or cloud load balancers for multiple instances
- **Database**: Consider read replicas for high read workloads
- **AI Agent**: Scale LangGraph instances based on conversation volume
- **File Storage**: Use cloud storage (S3, GCS) for production file handling
- **Monitoring**: Implement logging, metrics, and alerting

## 🛠️ Development

### Code Style

- **Frontend**: ESLint + Prettier with TypeScript strict mode
- **Backend**: Black + isort with type hints
- **AI Agent**: Ruff linting with Google docstring style

### Testing

```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm test

# AI Agent tests
cd ai-agent
pytest
```

### Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Follow code style** guidelines
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Database connection errors
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run: docker-compose up -d postgres

# Module import errors
- Ensure PYTHONPATH includes src/
- Run: export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
```

#### Frontend Issues
```bash
# Build errors
- Clear node_modules: rm -rf node_modules && npm install
- Clear cache: npm start -- --reset-cache

# API connection errors
- Check VITE_API_BASE_URL in .env.local
- Verify backend is running on correct port
```

#### Mobile Issues
```bash
# Metro bundler issues
npm start --reset-cache

# Android build issues
cd android && ./gradlew clean && cd ..
npm run android

# iOS build issues (macOS only)
cd ios && pod install && cd ..
npm run ios
```

#### AI Agent Issues
```bash
# LangGraph server not starting
- Check langgraph-cli installation
- Verify pyproject.toml configuration
- Run: langgraph dev --verbose

# Model API errors
- Verify API keys are set correctly
- Check model names in configuration
- Review LangSmith logs if enabled
```

### Performance Optimization

- **Database**: Add indexes for frequently queried fields
- **Frontend**: Implement code splitting and lazy loading
- **Backend**: Use async/await consistently, implement caching
- **AI Agent**: Optimize prompt engineering, cache model responses

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- **Documentation**: Check individual component READMEs
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for general questions

## 🔄 Version History

- **v0.1.0**: Initial release with basic chat functionality
- **v0.2.0**: Added mobile app support
- **v0.3.0**: Integrated LangGraph AI agent
- **v0.4.0**: Added voice messages and file uploads
- **v0.5.0**: Enhanced AI model management and multi-user support

---

Built with ❤️ by Nikola Nikolovski