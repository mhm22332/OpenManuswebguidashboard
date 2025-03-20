<p align="center">
  <img src="assets/logo.jpg" width="200"/>
</p>

# OpenManus Web Dashboard

[![GitHub stars](https://img.shields.io/github/stars/mannaandpoem/OpenManus?style=social)](https://github.com/mannaandpoem/OpenManus/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord Follow](https://dcbadge.vercel.app/api/server/DYn29wFk9z?style=flat)](https://discord.gg/DYn29wFk9z)

> An open-source framework for building and managing general AI agents with support for both Claude and OpenAI models

[English](README.md) | [中文](README_zh.md) | [한국어](README_ko.md) | [日本語](README_ja.md)

## 🌟 Overview

OpenManus is a powerful open-source alternative to commercial agent platforms, allowing you to build and manage AI agents without restrictions. The web dashboard provides an intuitive interface for configuring, monitoring, and interacting with your agents.

### Key Features
- 🤖 **Multiple LLM Support**: Works with Claude 3.7 Sonnet, GPT-4o, and other models
- 📊 **Usage Dashboard**: Monitor API calls, token usage, and performance metrics
- 💬 **Interactive Interface**: Chat with your agents through a user-friendly interface
- ⚙️ **Easy Configuration**: Configure LLM providers and models without editing files
- 🧩 **Modular Architecture**: Mix and match different agents and tools

<p align="center">
  <img src="assets/web_dashboard.jpg" width="800" alt="OpenManus Web Dashboard"/>
</p>

## 🚀 Quick Installation

### One-line Installation (Linux/Debian)

```bash
wget -O - https://raw.githubusercontent.com/mhm22332/OpenManuswebguidashboard/main/install.sh | sudo bash
```

This automatically installs all dependencies, clones the repository, and sets up the configuration.

### Lightweight Installation (Reduced Disk Usage)

For systems with limited disk space, use our minimal installation:

```bash
wget -O - https://raw.githubusercontent.com/mhm22332/OpenManuswebguidashboard/main/install-minimal.sh | sudo bash
```

This uses:
- Shallow git clone (saves ~70% disk space)
- Minimal dependencies only
- No-recommends package installation
- Automatic cleanup script

### Docker Installation

For containerized deployment with minimal overhead:

```bash
# Clone repository (only for Dockerfile)
git clone --depth=1 https://github.com/mhm22332/OpenManuswebguidashboard.git
cd OpenManuswebguidashboard

# Build and run container
docker build -t openmanus-web .
docker run -p 8000:8000 openmanus-web
```

Then access at http://localhost:8000

### Using Conda

```bash
conda create -n open_manus python=3.12
conda activate open_manus
git clone https://github.com/mhm22332/OpenManuswebguidashboard.git
cd OpenManuswebguidashboard
pip install -r requirements.txt
```

### Using uv (Recommended)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
git clone https://github.com/mhm22332/OpenManuswebguidashboard.git
cd OpenManuswebguidashboard
uv venv --python 3.12
source .venv/bin/activate  # On Unix/macOS
# .venv\Scripts\activate   # On Windows
uv pip install -r requirements.txt
```

### Optional: Browser Automation Tools
```bash
playwright install
```

## ⚙️ Configuration

OpenManus supports multiple LLM providers through a simple configuration file:

1. Create your config file:
   ```bash
   cp config/config.example.toml config/config.toml
   ```

2. Choose your preferred LLM provider:

   **Claude 3.7 Sonnet (Default):**
   ```toml
   [llm]
   model = "claude-3-7-sonnet-20250219"        # The LLM model to use
   base_url = "https://api.anthropic.com/v1/"  # API endpoint URL
   api_key = "sk-ant-..."                      # Your Anthropic API key
   max_tokens = 8192                           # Maximum tokens in response
   temperature = 0.0                           # Controls randomness
   ```

   **OpenAI GPT-4o:**
   ```toml
   [llm]
   model = "gpt-4o"                           # The OpenAI model to use
   base_url = "https://api.openai.com/v1"     # OpenAI API endpoint
   api_key = "sk-..."                         # Your OpenAI API key
   max_tokens = 4096                          # Maximum tokens for response
   temperature = 0.0                          # Controls randomness
   ```

   The configuration also supports AWS Bedrock, Azure OpenAI, and local Ollama models.

## 🖥️ Usage

### Running the Web Dashboard

Launch the web interface with:
```bash
python run_web.py
```

Then access it at http://localhost:8000

### Other Run Options

**Terminal Interface:**
```bash
python main.py
```

**MCP Tool Version:**
```bash
python run_mcp.py
```

**Multi-Agent Mode (Experimental):**
```bash
python run_flow.py
```

## 🔍 Web Dashboard Features

### 1. Usage Dashboard
Monitor your API usage with interactive charts:
- Total requests and tokens consumed
- Requests by model type
- Historical usage patterns

### 2. Prompt Interface
Interact with your agents through a familiar chat interface:
- Send prompts and receive responses
- View execution logs in real-time
- Switch between different LLM models

### 3. LLM Configuration
Manage your LLM providers and models:
- Add, edit and remove LLM profiles
- Configure API endpoints and parameters
- Set default models for different tasks

### 4. Module Management
View and manage available agents and tools:
- List installed agents and capabilities
- Monitor tool usage and performance

## 🛠️ Troubleshooting

If you encounter issues:

1. **Check the console output** for detailed error messages and diagnostic information
2. **Verify dependencies** are correctly installed with `pip install -r requirements.txt`
3. **Check your Python version** - Python 3.12+ is recommended
4. **Validate your config.toml** file has the correct API keys and endpoints
5. **For container environments**, we've added specialized error handling to work around import issues

## 🤝 Contributing

We welcome contributions of all kinds! Please feel free to:
- Open issues for bug reports or feature requests
- Submit pull requests for improvements
- Share feedback and suggestions

Before submitting a PR, please run `pre-commit run --all-files` to ensure code quality.

Contact: [@mannaandpoem](https://github.com/mannaandpoem) (Email: mannaandpoem@gmail.com)

## 👥 Community

Join our community to discuss ideas, get help, and share your projects:

<div align="center">
    <img src="assets/community_group.jpg" alt="OpenManus Community Group" width="300" />
</div>

## 🙏 Acknowledgements

- [anthropic-computer-use](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)
- [browser-use](https://github.com/browser-use/browser-use)
- [AAAJ](https://github.com/metauto-ai/agent-as-a-judge)
- [MetaGPT](https://github.com/geekan/MetaGPT)
- [OpenHands](https://github.com/All-Hands-AI/OpenHands)
- [SWE-agent](https://github.com/SWE-agent/SWE-agent)

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mannaandpoem/OpenManus&type=Date)](https://star-history.com/#mannaandpoem/OpenManus&Date)

## 📚 Citation

```bibtex
@misc{openmanus2025,
  author = {Xinbin Liang and Jinyu Xiang and Zhaoyang Yu and Jiayi Zhang and Sirui Hong},
  title = {OpenManus: An open-source framework for building general AI agents},
  year = {2025},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/mannaandpoem/OpenManus}},
}
```
