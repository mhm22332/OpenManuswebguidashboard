// Charts
let modelChart;
let dailyChart;

// Main initialization
document.addEventListener('DOMContentLoaded', function () {
    initCharts();
    loadStats();
    loadConfig();
    loadAgentsAndTools();

    // Setup event listeners
    document.getElementById('refresh-stats').addEventListener('click', loadStats);
    document.getElementById('save-profile').addEventListener('click', saveNewProfile);
    document.getElementById('update-profile').addEventListener('click', updateProfile);
    document.getElementById('send-prompt').addEventListener('click', sendPrompt);

    // Tab switching event listeners
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            // Hide all tabs and show the target
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            target.classList.add('show', 'active');

            // Update active tab
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Initialize tab switching
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('href');
            if (targetId === '#stats-section') {
                // Refresh charts when switching to stats tab
                window.requestAnimationFrame(() => {
                    if (window.requestsChart) window.requestsChart.update();
                    if (window.modelsChart) window.modelsChart.update();
                });
            }
        });
    });

    // Set up model suggestions for forms
    updateModelSuggestions('api-type', 'model');
    updateModelSuggestions('edit-api-type', 'edit-model');

    // Set up form submission handlers
    document.getElementById('save-profile').addEventListener('click', saveNewProfile);
    document.getElementById('update-profile').addEventListener('click', updateProfile);

    // Set up prompt submission
    document.getElementById('send-prompt').addEventListener('click', sendPrompt);
    document.getElementById('prompt-input').addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendPrompt();
        }
    });

    // Clear log button
    document.getElementById('clear-log').addEventListener('click', function () {
        document.getElementById('execution-log').innerHTML = '';
    });

    // New profile button
    document.getElementById('new-profile-btn').addEventListener('click', function () {
        document.getElementById('new-profile-form').reset();
        new bootstrap.Modal(document.getElementById('newProfileModal')).show();
    });

    // Start system monitoring
    startSystemMonitoring();
});

// Initialize charts
function initCharts() {
    // Model distribution chart
    const modelCtx = document.getElementById('model-chart').getContext('2d');
    modelChart = new Chart(modelCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
                ],
                hoverBackgroundColor: [
                    '#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617'
                ],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });

    // Daily usage chart
    const dailyCtx = document.getElementById('daily-chart').getContext('2d');
    dailyChart = new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Requests',
                lineTension: 0.3,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: "rgba(78, 115, 223, 1)",
                pointRadius: 3,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 3,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Load usage statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Update summary cards
        document.getElementById('total-requests').textContent = data.total_requests;
        document.getElementById('total-tokens').textContent = data.token_usage.total;

        // Find the most used model
        let mostUsedModel = '-';
        let maxRequests = 0;
        for (const [model, count] of Object.entries(data.requests_by_model)) {
            if (count > maxRequests) {
                maxRequests = count;
                mostUsedModel = model;
            }
        }
        document.getElementById('active-model').textContent = mostUsedModel;

        // Update model chart
        updateModelChart(data.requests_by_model);

        // Update daily chart
        updateDailyChart(data.requests_by_day);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update model distribution chart
function updateModelChart(requestsByModel) {
    const labels = Object.keys(requestsByModel);
    const data = Object.values(requestsByModel);

    modelChart.data.labels = labels;
    modelChart.data.datasets[0].data = data;
    modelChart.update();
}

// Update daily usage chart
function updateDailyChart(requestsByDay) {
    const labels = Object.keys(requestsByDay).sort();
    const data = labels.map(day => requestsByDay[day]);

    dailyChart.data.labels = labels;
    dailyChart.data.datasets[0].data = data;
    dailyChart.update();
}

// Load LLM and module configurations
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();

        // Populate LLM profiles
        const profilesContainer = document.getElementById('llm-profiles-container');
        profilesContainer.innerHTML = '';

        for (const [name, config] of Object.entries(data.llm)) {
            const isDefault = name === 'default';
            const card = createProfileCard(name, config, isDefault);
            profilesContainer.appendChild(card);
        }

        // Attach event listeners to edit/delete buttons
        document.querySelectorAll('.edit-profile').forEach(btn => {
            btn.addEventListener('click', function () {
                const profileName = this.dataset.profile;
                openEditModal(profileName, data.llm[profileName]);
            });
        });

        document.querySelectorAll('.set-default-profile').forEach(btn => {
            btn.addEventListener('click', function () {
                const profileName = this.dataset.profile;
                setDefaultProfile(profileName);
            });
        });
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Create a profile card
function createProfileCard(name, config, isDefault) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';

    col.innerHTML = `
        <div class="card llm-profile-card">
            <div class="card-header">
                <h5 class="card-title mb-0">${name}</h5>
                ${isDefault ? '<span class="badge bg-success">Default</span>' : ''}
            </div>
            <div class="card-body">
                <p><strong>Model:</strong> ${config.model}</p>
                <p><strong>API Type:</strong> ${config.api_type}</p>
                <p><strong>Max Tokens:</strong> ${config.max_tokens}</p>
                <p><strong>Temperature:</strong> ${config.temperature}</p>
            </div>
            <div class="card-footer">
                <div class="llm-profile-actions">
                    <button class="btn btn-sm btn-primary edit-profile" data-profile="${name}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    ${!isDefault ? `
                    <button class="btn btn-sm btn-success set-default-profile" data-profile="${name}">
                        <i class="bi bi-check-circle"></i> Set Default
                    </button>` : ''}
                </div>
            </div>
        </div>
    `;

    return col;
}

// Open edit modal with profile data
function openEditModal(profileName, config) {
    document.getElementById('edit-profile-name').value = profileName;
    document.getElementById('edit-model').value = config.model;
    document.getElementById('edit-base-url').value = config.base_url;
    document.getElementById('edit-api-key').value = config.api_key;
    document.getElementById('edit-max-tokens').value = config.max_tokens;
    document.getElementById('edit-temperature').value = config.temperature;
    document.getElementById('edit-api-type').value = config.api_type;
    document.getElementById('edit-api-version').value = config.api_version;

    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

// Save new profile
async function saveNewProfile() {
    const profileName = document.getElementById('profile-name').value;
    if (!profileName) {
        alert('Profile name is required');
        return;
    }

    const formData = new FormData();
    formData.append('model', document.getElementById('model').value);
    formData.append('base_url', document.getElementById('base-url').value);
    formData.append('api_key', document.getElementById('api-key').value);
    formData.append('max_tokens', document.getElementById('max-tokens').value);
    formData.append('temperature', document.getElementById('temperature').value);
    formData.append('api_type', document.getElementById('api-type').value);
    formData.append('api_version', document.getElementById('api-version').value);

    try {
        const response = await fetch(`/api/config/llm/${profileName}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            // Close modal and reload config
            bootstrap.Modal.getInstance(document.getElementById('newProfileModal')).hide();
            document.getElementById('new-profile-form').reset();
            loadConfig();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile');
    }
}

// Update existing profile
async function updateProfile() {
    const profileName = document.getElementById('edit-profile-name').value;

    const formData = new FormData();
    formData.append('model', document.getElementById('edit-model').value);
    formData.append('base_url', document.getElementById('edit-base-url').value);
    formData.append('api_key', document.getElementById('edit-api-key').value);
    formData.append('max_tokens', document.getElementById('edit-max-tokens').value);
    formData.append('temperature', document.getElementById('edit-temperature').value);
    formData.append('api_type', document.getElementById('edit-api-type').value);
    formData.append('api_version', document.getElementById('edit-api-version').value);

    try {
        const response = await fetch(`/api/config/llm/${profileName}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            // Close modal and reload config
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
            loadConfig();
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
    }
}

// Set profile as default
async function setDefaultProfile(profileName) {
    // This is a placeholder - in a real implementation,
    // you would update the config file to set this profile as default
    alert(`Set ${profileName} as default (not implemented)`);
}

// Load available agents and tools
async function loadAgentsAndTools() {
    try {
        // Load agents
        const agentsResponse = await fetch('/api/agents');
        const agentsData = await agentsResponse.json();

        const agentsList = document.getElementById('agents-list');
        agentsList.innerHTML = '';

        agentsData.agents.forEach(agent => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <span class="module-title">${agent}</span>
                </div>
                <span class="badge bg-primary rounded-pill">Agent</span>
            `;
            agentsList.appendChild(li);
        });

        // Load tools
        const toolsResponse = await fetch('/api/tools');
        const toolsData = await toolsResponse.json();

        const toolsList = document.getElementById('tools-list');
        toolsList.innerHTML = '';

        toolsData.tools.forEach(tool => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <span class="module-title">${tool}</span>
                </div>
                <span class="badge bg-secondary rounded-pill">Tool</span>
            `;
            toolsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading agents and tools:', error);
    }
}

// Send prompt to LLM
async function sendPrompt() {
    const promptInput = document.getElementById('prompt-input');
    const prompt = promptInput.value.trim();

    if (!prompt) {
        return;
    }

    // Disable input while processing
    promptInput.disabled = true;
    document.getElementById('send-prompt').disabled = true;

    // Add user message to the chat
    addMessageToChat('user', prompt);

    // Clear input
    promptInput.value = '';

    // Show thinking indicator
    const thinkingMsg = addThinkingMessage();

    try {
        const response = await fetch('/api/prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt
            })
        });

        // Remove thinking indicator
        thinkingMsg.remove();

        if (response.ok) {
            const data = await response.json();

            // Add assistant response to chat
            addMessageToChat('assistant', data.response);

            // Update any usage stats
            if (data.usage) {
                document.getElementById('total-requests').textContent =
                    parseInt(document.getElementById('total-requests').textContent) + 1;

                document.getElementById('total-tokens').textContent =
                    parseInt(document.getElementById('total-tokens').textContent) + data.usage.total_tokens;
            }
        } else {
            // Show detailed error message based on response
            try {
                const errorData = await response.json();
                let errorMessage = 'Error: Failed to get response from server';
                let troubleshootingTip = '';

                if (errorData.message) {
                    errorMessage = `Error: ${errorData.message}`;
                }

                // Add troubleshooting tips based on status code and error type
                switch (response.status) {
                    case 401:
                        troubleshootingTip = 'Please check your API key in config.toml or try adding it through the Settings panel.';
                        break;
                    case 404:
                        troubleshootingTip = 'The model may not exist or be misspelled. Check the model name in your configuration.';
                        break;
                    case 429:
                        troubleshootingTip = 'You have exceeded your quota or rate limit. Wait a few minutes or check your subscription.';
                        break;
                    case 500:
                        troubleshootingTip = 'An internal server error occurred. Check the terminal for more details.';
                        break;
                    case 504:
                        troubleshootingTip = 'The request timed out. Check your internet connection or try again later.';
                        break;
                }

                if (troubleshootingTip) {
                    errorMessage += `\n\nTroubleshooting tip: ${troubleshootingTip}`;
                }

                addMessageToChat('system', errorMessage);
            } catch (parseError) {
                // Fallback if response is not valid JSON
                addMessageToChat('system', `Error: Failed to get response from server (HTTP ${response.status})`);
            }
        }
    } catch (error) {
        console.error('Error sending prompt:', error);
        // Remove thinking indicator
        thinkingMsg.remove();
        // Show error message with troubleshooting tip
        let errorMessage = `Error: ${error.message}`;
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage += '\n\nTroubleshooting tip: Check if the server is running and your internet connection is working.';
        }
        addMessageToChat('system', errorMessage);
    } finally {
        // Re-enable input
        promptInput.disabled = false;
        document.getElementById('send-prompt').disabled = false;
        promptInput.focus();
    }
}

// Add message to chat
function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    let avatar = '';
    if (role === 'user') {
        avatar = '<div class="avatar user-avatar"><i class="bi bi-person-fill"></i></div>';
    } else if (role === 'assistant') {
        avatar = '<div class="avatar assistant-avatar"><i class="bi bi-robot"></i></div>';
    } else {
        avatar = '<div class="avatar system-avatar"><i class="bi bi-info-circle"></i></div>';
    }

    messageDiv.innerHTML = `
        ${avatar}
        <div class="message-content">
            <div class="message-text">${formatMessageContent(content)}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// Add thinking message (with loading animation)
function addThinkingMessage() {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message thinking';
    messageDiv.innerHTML = `
        <div class="avatar assistant-avatar"><i class="bi bi-robot"></i></div>
        <div class="message-content">
            <div class="message-text">
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// Format message content (handle newlines, code blocks, etc.)
function formatMessageContent(content) {
    if (!content) return '';

    // Convert newlines to <br>
    let formatted = content.replace(/\n/g, '<br>');

    // Detect and format code blocks
    // This is a simple implementation - a more robust solution would use a library like marked.js
    formatted = formatted.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, function (match, language, code) {
        return `<pre><code class="language-${language}">${code}</code></pre>`;
    });

    return formatted;
}

// Helper function to update model suggestions based on API type
function updateModelSuggestions(apiTypeSelectId, modelInputId) {
    const apiTypeSelect = document.getElementById(apiTypeSelectId);
    const modelInput = document.getElementById(modelInputId);

    apiTypeSelect.addEventListener('change', function () {
        const apiType = this.value;

        // Clear any existing datalist
        let dataListId = modelInputId + '-suggestions';
        let existingDatalist = document.getElementById(dataListId);
        if (existingDatalist) {
            existingDatalist.remove();
        }

        // Create new datalist
        const datalist = document.createElement('datalist');
        datalist.id = dataListId;

        // Add suggestions based on API type
        switch (apiType) {
            case 'anthropic':
                addSuggestions(datalist, [
                    'claude-3-7-sonnet-20250219',
                    'claude-3-5-sonnet-20240620',
                    'claude-3-haiku-20240307'
                ]);
                modelInput.placeholder = "e.g., claude-3-7-sonnet-20250219";
                break;
            case 'openai':
                addSuggestions(datalist, [
                    'gpt-4o',
                    'gpt-4-turbo',
                    'gpt-3.5-turbo'
                ]);
                modelInput.placeholder = "e.g., gpt-4o";
                break;
            case 'azure':
                modelInput.placeholder = "Your Azure deployment model name";
                break;
            case 'ollama':
                addSuggestions(datalist, [
                    'llama3.2',
                    'mistral',
                    'llama3.2-vision'
                ]);
                modelInput.placeholder = "e.g., llama3.2";
                break;
            default:
                modelInput.placeholder = "Model name";
        }

        // Add datalist to document and connect to input
        document.body.appendChild(datalist);
        modelInput.setAttribute('list', dataListId);
    });
}

// Helper function to add options to datalist
function addSuggestions(datalist, suggestions) {
    suggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion;
        datalist.appendChild(option);
    });
}

// System monitoring functions
function startSystemMonitoring() {
    // Initial update
    updateSystemMetrics();

    // Update every 5 seconds
    setInterval(updateSystemMetrics, 5000);
}

async function updateSystemMetrics() {
    try {
        const response = await fetch('/api/system');
        if (response.ok) {
            const metrics = await response.json();
            updateMetricDisplay(metrics);
        } else {
            console.error('Failed to fetch system metrics');
            document.getElementById('system-status').className = 'badge bg-warning';
            document.getElementById('system-status').textContent = 'Limited';
        }
    } catch (error) {
        console.error('Error fetching system metrics:', error);
        document.getElementById('system-status').className = 'badge bg-danger';
        document.getElementById('system-status').textContent = 'Offline';
    }
}

function updateMetricDisplay(metrics) {
    // CPU usage
    const cpuUsage = metrics.cpu_percent || 0;
    document.getElementById('cpu-usage-value').textContent = `${cpuUsage.toFixed(1)}%`;
    document.getElementById('cpu-gauge').style.width = `${cpuUsage}%`;

    // Memory usage
    const memUsed = formatBytes(metrics.memory_used || 0);
    const memTotal = formatBytes(metrics.memory_total || 0);
    const memPercent = metrics.memory_percent || 0;
    document.getElementById('memory-usage-value').textContent = `${memUsed} / ${memTotal}`;
    document.getElementById('memory-gauge').style.width = `${memPercent}%`;

    // Disk usage
    const diskUsed = formatBytes(metrics.disk_used || 0, true);
    const diskTotal = formatBytes(metrics.disk_total || 0, true);
    const diskPercent = metrics.disk_percent || 0;
    document.getElementById('disk-usage-value').textContent = `${diskUsed} / ${diskTotal}`;
    document.getElementById('disk-gauge').style.width = `${diskPercent}%`;

    // Network usage
    const netSent = formatBytes(metrics.net_sent_per_sec || 0, false, true);
    const netRecv = formatBytes(metrics.net_recv_per_sec || 0, false, true);
    document.getElementById('network-usage-value').textContent = `↓ ${netRecv}/s ↑ ${netSent}/s`;

    // Network gauge - use percentage of a reasonable maximum (e.g., 10MB/s)
    const netTotal = (metrics.net_sent_per_sec || 0) + (metrics.net_recv_per_sec || 0);
    const netPercent = Math.min(100, (netTotal / (10 * 1024 * 1024)) * 100);
    document.getElementById('network-gauge').style.width = `${netPercent}%`;

    // Update system status
    document.getElementById('system-status').className = 'badge bg-success';
    document.getElementById('system-status').textContent = 'Online';
}

function formatBytes(bytes, showGB = false, showSpeed = false) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = showSpeed
        ? ['B', 'KB', 'MB', 'GB']
        : ['B', 'KB', 'MB', 'GB', 'TB'];

    if (showGB && bytes > k * k * k) {
        return (bytes / (k * k * k)).toFixed(2) + ' GB';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
