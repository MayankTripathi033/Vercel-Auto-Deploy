// DOM Elements
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');
const projectsSection = document.getElementById('projectsSection');
const projectsGrid = document.getElementById('projectsGrid');
const projectsCount = document.getElementById('projectsCount');
const refreshBtn = document.getElementById('refreshBtn');
const manualDeploy = document.getElementById('manualDeploy');
const manualDeployForm = document.getElementById('manualDeployForm');
const globalStatus = document.getElementById('globalStatus');
const recentDeployments = document.getElementById('recentDeployments');
const deploymentHistory = document.getElementById('deploymentHistory');

// Global state
let projects = [];
let deployments = JSON.parse(localStorage.getItem('deployments') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadRecentDeployments();
    setupManualDeployForm();
});

// --- SSE helpers ---
async function streamDeploymentSSE(body, { onEvent, onClose, onError } = {}) {
  const resp = await fetch('/api/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream' // request SSE
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok || !resp.body) {
    const err = await resp.json().catch(() => ({}));
    const msg = `Failed to start deployment: ${err.error || `${resp.status} ${resp.statusText}`}`;
    onError?.(msg);
    throw new Error(msg);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventBlock of events) {
        const lines = eventBlock.split('\n');
        let event = 'message';
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim() || 'message';
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }

        const raw = dataLines.join('\n');
        let data = raw;
        try { data = JSON.parse(raw); } catch {}

        onEvent?.(event, data);
      }
    }
  } catch (err) {
    onError?.(err?.message || String(err));
  } finally {
    onClose?.();
  }
}

function appendProjectLog(projectName, text) {
  const container = document.getElementById(`project-status-${projectName}`);
  if (!container) return;

  let pre = container.querySelector('pre.project-log');
  if (!pre) {
    pre = document.createElement('pre');
    pre.className = 'project-log';
    pre.style.marginTop = '8px';
    pre.style.maxHeight = '180px';
    pre.style.overflow = 'auto';
    pre.style.background = '#0b0b0b';
    pre.style.color = '#ddd';
    pre.style.padding = '8px';
    pre.style.borderRadius = '6px';
    container.appendChild(pre);
  }
  pre.textContent += (pre.textContent ? '\n' : '') + text;
  pre.scrollTop = pre.scrollHeight;
}

function appendGlobalLog(text) {
  const status = document.getElementById('globalStatus');
  if (!status) return;

  let pre = status.querySelector('pre.global-log');
  if (!pre) {
    pre = document.createElement('pre');
    pre.className = 'global-log';
    pre.style.marginTop = '8px';
    pre.style.maxHeight = '220px';
    pre.style.overflow = 'auto';
    pre.style.background = '#0b0b0b';
    pre.style.color = '#ddd';
    pre.style.padding = '8px';
    pre.style.borderRadius = '6px';
    status.appendChild(pre);
  }
  pre.textContent += (pre.textContent ? '\n' : '') + text;
  pre.scrollTop = pre.scrollHeight;
}

// Load projects from Vercel
async function loadProjects() {
    try {
        showLoading(true);
        hideError();
        hideProjectsSection();
        
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = '🔄 Loading...';
        }

        const response = await fetch('/api/projects');
        const result = await response.json();

        if (result.success) {
            projects = result.projects;
            displayProjects(projects);
            showProjectsSection();
            showManualDeploy();
        } else {
            throw new Error(result.error || 'Failed to load projects');
        }

    } catch (err) {
        console.error('Error loading projects:', err);
        showError(err.message);
        showManualDeploy(); // Show manual deploy as fallback
    } finally {
        showLoading(false);
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 Refresh';
        }
    }
}

// Display projects in the grid
function displayProjects(projectsList) {
    projectsCount.textContent = `Found ${projectsList.length} project${projectsList.length !== 1 ? 's' : ''}`;
    
    if (projectsList.length === 0) {
        projectsGrid.innerHTML = `
            <div class="no-projects">
                <p>📭 No projects found in your Vercel account.</p>
                <p>Projects you create will appear here automatically.</p>
            </div>
        `;
        return;
    }

    projectsGrid.innerHTML = projectsList.map(project => `
        <div class="project-card" data-project-id="${escapeHtml(project.id)}">
            <div class="project-header">
                <div class="project-name">
                    📁 ${escapeHtml(project.name)}
                    <span class="project-framework">👤 ${escapeHtml(project.account)}</span>
                    ${project.framework ? `<span class="project-framework">${escapeHtml(project.framework)}</span>` : ''}
                </div>
                ${project.productionUrl !== 'No production URL' ? 
                    `<a href="${project.productionUrl}" target="_blank" class="project-url">${project.productionUrl}</a>` : 
                    '<span class="project-url" style="color: #999;">No production URL</span>'
                }
            </div>
            
            <div class="project-deploy-section">
                <form class="project-deploy-form" onsubmit="deployProject(event, '${escapeHtml(project.name)}', '${escapeHtml(project.id)}')">
                    <div class="project-branch-group">
                        <label for="branch-${escapeHtml(project.name)}">🌿 Branch Name:</label>
                        <input 
                            type="text" 
                            id="branch-${escapeHtml(project.name)}"
                            class="project-branch-input"
                            placeholder="main, develop, feature/xyz" 
                            required
                        >
                    </div>
                    <button type="submit" class="project-deploy-btn">
                        🚀 Deploy
                    </button>
                </form>
                
                <div id="project-status-${escapeHtml(project.name)}" class="project-status hidden">
                    <div id="project-status-message-${escapeHtml(project.name)}"></div>
                    <div id="project-deployment-link-${escapeHtml(project.name)}" class="project-deployment-link hidden"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Deploy to a specific project (SSE streaming)
async function deployProject(event, projectName, projectId) {
  event.preventDefault();

  const branchInput = document.getElementById(`branch-${projectName}`);
  const deployBtn = event.target.querySelector('.project-deploy-btn');
  const branch = branchInput.value.trim();

  if (!branch) {
    showProjectStatus(projectName, 'error', 'Please enter a branch name');
    return;
  }

  const originalButtonText = deployBtn.textContent;

  try {
    // Show loading state
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="mini-spinner"></span>Deploying...';
    showProjectStatus(projectName, 'loading', `🚀 Deploying "${branch}" to "${projectName}"...`);

    // Find project's git repository
    const project = projects.find(p => p.id === projectId);
    const repository = project?.gitRepository;

    await streamDeploymentSSE(
      { projectName, branch, repository, account: project?.account },
      {
        onEvent: (eventName, data) => {
          switch (eventName) {
            case 'deployment-created':
              showProjectStatus(projectName, 'loading', `Deployment created: ${data.deploymentId}`);
              if (data.url) appendProjectLog(projectName, `URL: ${data.url}`);
              break;
            case 'status':
              showProjectStatus(projectName, 'loading', `Status: ${data.state}`);
              break;
            case 'log':
              appendProjectLog(projectName, data.text || data.line || JSON.stringify(data));
              break;
            case 'warn':
              appendProjectLog(projectName, `WARN: ${data.message || JSON.stringify(data)}`);
              break;
            case 'error':
              showProjectStatus(projectName, 'error', `❌ ${data.message || 'Deployment error'}`);
              if (data.details) appendProjectLog(projectName, JSON.stringify(data.details));
              break;
            case 'done':
              if (data.state === 'READY') {
                showProjectStatus(projectName, 'success', '🎉 Deployment ready!');
                if (data.url) {
                  showProjectDeploymentLink(projectName, data.url, '(stream)');
                  // Add to global history
                  addToHistory({
                    deploymentId: '(stream)',
                    deploymentUrl: data.url,
                    repository: repository || 'Unknown',
                    projectName: projectName,
                    branch: branch,
                    status: data.state
                  });
                }
              } else {
                showProjectStatus(projectName, 'error', `❌ ${data.state}`);
              }
              break;
            default:
              appendProjectLog(projectName, `${eventName}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
          }
        },
        onClose: () => appendProjectLog(projectName, 'Stream ended.'),
        onError: (msg) => showProjectStatus(projectName, 'error', `❌ ${msg}`)
      }
    );

    // Clear input after stream completes
    branchInput.value = '';

  } catch (error) {
    console.error('Deployment error:', error);
    showProjectStatus(projectName, 'error', `❌ Deployment failed: ${error.message}`);
  } finally {
    // Reset button state
    deployBtn.disabled = false;
    deployBtn.textContent = originalButtonText;
  }
}

// Show project-specific status
function showProjectStatus(projectName, type, message) {
    const statusEl = document.getElementById(`project-status-${projectName}`);
    const statusMessageEl = document.getElementById(`project-status-message-${projectName}`);
    const deploymentLinkEl = document.getElementById(`project-deployment-link-${projectName}`);
    
    statusEl.className = `project-status ${type}`;
    statusMessageEl.textContent = message;
    statusEl.classList.remove('hidden');
    deploymentLinkEl.classList.add('hidden');
}

// Show project deployment link
function showProjectDeploymentLink(projectName, url, deploymentId) {
    const deploymentLinkEl = document.getElementById(`project-deployment-link-${projectName}`);
    deploymentLinkEl.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener">${url}</a>
        <br><small style="opacity: 0.7;">ID: ${deploymentId}</small>
    `;
    deploymentLinkEl.classList.remove('hidden');
}

// Manual deploy form setup
function setupManualDeployForm() {
    manualDeployForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const repository = document.getElementById('repository').value.trim();
        const branch = document.getElementById('manualBranch').value.trim();
        
        if (!repository || !branch) {
            showGlobalStatus('error', 'Please fill in both repository and branch fields');
            return;
        }

        // Validate repository format
        const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
        if (!repoPattern.test(repository)) {
            showGlobalStatus('error', 'Repository must be in format: username/repository');
            return;
        }

        await deployManual(repository, branch);
    });

    // Repository input validation
    const repositoryInput = document.getElementById('repository');
    repositoryInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
        
        if (value && !repoPattern.test(value)) {
            e.target.setCustomValidity('Please enter in format: username/repository');
        } else {
            e.target.setCustomValidity('');
        }
    });
}

// Manual deployment function (SSE streaming)
async function deployManual(repository, branch) {
  const deployBtn = document.getElementById('manualDeployBtn');
  const originalButtonContent = deployBtn.innerHTML;
  
  try {
    // Show loading state
    setManualLoadingState(true);
    showGlobalStatus('loading', `🚀 Deploying ${repository}@${branch} to Vercel...`);

    await streamDeploymentSSE(
      { repository, branch },
      {
        onEvent: (eventName, data) => {
          switch (eventName) {
            case 'deployment-created':
              showGlobalStatus('loading', `Deployment created: ${data.deploymentId}`);
              if (data.url) appendGlobalLog(`URL: ${data.url}`);
              break;
            case 'status':
              showGlobalStatus('loading', `Status: ${data.state}`);
              break;
            case 'log':
              appendGlobalLog(data.text || data.line || JSON.stringify(data));
              break;
            case 'warn':
              appendGlobalLog(`WARN: ${data.message || JSON.stringify(data)}`);
              break;
            case 'error':
              showGlobalStatus('error', `❌ ${data.message || 'Deployment error'}`);
              if (data.details) appendGlobalLog(JSON.stringify(data.details));
              break;
            case 'done':
              if (data.state === 'READY') {
                showGlobalStatus('success', '🎉 Deployment ready!');
                if (data.url) {
                  showGlobalDeploymentDetails({ deploymentUrl: data.url, deploymentId: '(stream)', status: data.state });
                }
              } else {
                showGlobalStatus('error', `❌ ${data.state}`);
              }
              break;
            default:
              appendGlobalLog(`${eventName}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
          }
        },
        onClose: () => appendGlobalLog('Stream ended.'),
        onError: (msg) => showGlobalStatus('error', `❌ ${msg}`)
      }
    );

    // Clear form
    manualDeployForm.reset();

  } catch (error) {
    console.error('Manual deployment error:', error);
    showGlobalStatus('error', `❌ Network error: ${error.message}`);
  } finally {
    setManualLoadingState(false);
    deployBtn.innerHTML = originalButtonContent;
  }
}

// Show global status
function showGlobalStatus(type, message) {
    const globalStatusIcon = document.getElementById('globalStatusIcon');
    const globalStatusMessage = document.getElementById('globalStatusMessage');
    const globalDeploymentDetails = document.getElementById('globalDeploymentDetails');
    
    globalStatus.className = `status ${type} fade-in`;
    globalStatusMessage.textContent = message;
    
    const icons = {
        loading: '⏳',
        success: '✅',
        error: '❌'
    };
    
    globalStatusIcon.textContent = icons[type] || '📝';
    globalDeploymentDetails.classList.add('hidden');
    globalStatus.classList.remove('hidden');
}

// Show global deployment details
function showGlobalDeploymentDetails(result) {
    const globalDeploymentLink = document.getElementById('globalDeploymentLink');
    const globalDeploymentMeta = document.getElementById('globalDeploymentMeta');
    const globalDeploymentDetails = document.getElementById('globalDeploymentDetails');
    
    globalDeploymentLink.href = result.deploymentUrl;
    globalDeploymentLink.textContent = result.deploymentUrl;
    
    let metaText = `Deployment ID: ${result.deploymentId}`;
    if (result.status) {
        metaText += ` • Status: ${result.status}`;
    }
    
    globalDeploymentMeta.textContent = metaText;
    globalDeploymentDetails.classList.remove('hidden');
}

// Set manual loading state
function setManualLoadingState(loading) {
    const deployBtn = document.getElementById('manualDeployBtn');
    deployBtn.disabled = loading;
    
    if (loading) {
        deployBtn.innerHTML = `
            <span class="button-content">
                <span class="button-icon mini-spinner">⏳</span>
                <span class="button-text">Deploying...</span>
            </span>
        `;
    }
}

// Add deployment to history
function addToHistory(result) {
    const deployment = {
        id: result.deploymentId,
        repository: result.repository || 'Unknown',
        projectName: result.projectName || 'Unknown',
        branch: result.branch,
        url: result.deploymentUrl,
        timestamp: new Date().toISOString(),
        status: result.status
    };
    
    deployments.unshift(deployment);
    deployments = deployments.slice(0, 5); // Keep only last 5
    
    localStorage.setItem('deployments', JSON.stringify(deployments));
    loadRecentDeployments();
}

// Load recent deployments
function loadRecentDeployments() {
    if (deployments.length === 0) {
        recentDeployments.classList.add('hidden');
        return;
    }
    
    recentDeployments.classList.remove('hidden');
    
    deploymentHistory.innerHTML = deployments.map(deployment => `
        <div class="deployment-item slide-in">
            <div class="deployment-item-header">
                📁 ${deployment.projectName || deployment.repository}@${deployment.branch}
            </div>
            <div class="deployment-item-meta">
                🕒 ${formatDate(deployment.timestamp)} • Status: ${deployment.status || 'Unknown'}
            </div>
            <div class="deployment-item-url">
                <a href="${deployment.url}" target="_blank" rel="noopener">
                    🔗 ${deployment.url}
                </a>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function hideError() {
    error.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

function hideProjectsSection() {
    projectsSection.classList.add('hidden');
}

function showProjectsSection() {
    projectsSection.classList.remove('hidden');
}

function showManualDeploy() {
    manualDeploy.classList.remove('hidden');
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // Try to submit focused form
        const focusedForm = document.activeElement?.closest('form');
        if (focusedForm) {
            focusedForm.dispatchEvent(new Event('submit'));
        }
    }
    
    if (e.key === 'Escape') {
        globalStatus.classList.add('hidden');
    }
});

// Auto-refresh projects every 5 minutes
setInterval(loadProjects, 5 * 60 * 1000);