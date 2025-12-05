<div align="center">
  <img width="353" height="141" alt="IDRE Logo" src="https://github.com/user-attachments/assets/92da969a-29b4-4cdd-b5f9-70a8435e4343" />
</div>

## Table of Contents
- [Project Vision & Objective](#project-vision--objective)
- [Screenshots](#screenshots)
- [Self-hosting](#self-hosting)
  - [Environment Setup](#self-hosting)
  - [Keys Generation](#encryption_key--jwt_secret)
  - [APIs](#the-other-apis)
  - [Run Docker](#finally-run-docker-compose)
- [License](#-license)
- [Support](#-support)


### Project Vision & Objective
IDRE (IDea REalisation) is an AI-powered strategic platform designed to transition abstract ideas into validated execution plans by acting as a collaborative partner rather than a passive tool. The workflow centers on a generative whiteboard where users and AI expand concepts into interconnected nodes, creating a dynamic and visual context for the project. For deep validation, a "Board of Directors" feature utilizes multiple autonomous agents to perform isolated web research and synthesis, providing diverse, expert-level perspectives. Insights from these sessions are automatically converted into actionable items on a Kanban board, bridging the gap between brainstorming and doing. Finally, the system maintains momentum through periodic, non-judgmental progress analysis that identifies gaps and prompts the user for updates, ensuring the roadmap remains realistic and up-to-date.

### Screenshots

<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/6bbd4a18-62bf-43c5-8899-8126c4268bec" />
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/e92cd6bb-13fc-409f-b98c-d82f5b0a637b" />
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/649d760f-bf12-4bad-a24e-859f12d8bbfe" />
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/cf07a291-e0d0-4748-893e-38c16c02ad37" />
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/b8c589ac-da29-4be6-9d4b-2b6033d0d2bf" />
<img width="1919" height="963" alt="image" src="https://github.com/user-attachments/assets/3ae832d2-f249-414b-9aec-a75348669168" />

## Self-hosting
- Copy the content of .env.example into .env files in /ai-agent, /backend and /frontend:
```bash
cd ai-agent
cp .env.example .env
cd ..

cd backend
cp .env.example .env
cd ..

cd frontend
cp .env.example .env
cd ..
```

- Only these three keys don't have values:
```
JWT_SECRET=
ENCRYPTION_KEY=

FIREWORKS_API=
LANGSMITH_API_KEY=
OPENROUTER_API_KEY=
```
#### ENCRYPTION_KEY & JWT_SECRET
- create ENCRYPTION_KEY:
```bash
openssl rand -base64 64
```

- create JWT_SECRET:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

or

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

*Paste the same values in /ai-agent and /backend. Don't make two seperate values!

#### The other APIS
- OpenRouter: https://openrouter.ai/
- Fireworks: https://fireworks.ai/ 
- LangSmith: https://smith.langchain.com/

*Fireworks is optional. It is used only for trancription of voice recordings. If that doesn't concern you leave it out.

#### Finally run docker compose
- Run the docker compose in /idre (root directory)
  ```bash
  docker compose up -d
  ```

- That's it your application is running. You can access it locally on localhost:5173.


## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for general questions

---
