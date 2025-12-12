// PlexIQ Web Application - Frontend JavaScript

const API_BASE = '/api';
let currentItems = [];
let analyzedItems = [];
let ws = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadLibraries();
    connectWebSocket();
});

// WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleProgressUpdate(data);
    };
    
    ws.onerror = () => {
        console.warn('WebSocket connection failed, using polling');
    };
    
    ws.onclose = () => {
        console.log('WebSocket closed');
    };
}

// Load libraries
async function loadLibraries() {
    try {
        const response = await fetch(`${API_BASE}/libraries`);
        const data = await response.json();
        const select = document.getElementById('librarySelect');
        select.innerHTML = '<option value="">Select a library...</option>';
        data.libraries.forEach(lib => {
            const option = document.createElement('option');
            option.value = lib.title;
            option.textContent = lib.title;
            select.appendChild(option);
        });
    } catch (error) {
        showStatus('Error loading libraries', 'error');
        console.error(error);
    }
}

// Collect metadata
async function collectMetadata() {
    const library = document.getElementById('librarySelect').value;
    if (!library) {
        alert('Please select a library');
        return;
    }
    
    showProgress('Collecting metadata...');
    setButtonState(false);
    
    try {
        const response = await fetch(`${API_BASE}/collect?library_name=${encodeURIComponent(library)}&enrich=true`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            currentItems = data.items;
            document.getElementById('analyzeBtn').disabled = false;
            showStatus(`Collected ${data.count} items`, 'success');
        }
    } catch (error) {
        showStatus('Collection failed', 'error');
        console.error(error);
    } finally {
        hideProgress();
        setButtonState(true);
    }
}

// Analyze items
async function analyzeItems() {
    if (!currentItems.length) {
        alert('No items to analyze');
        return;
    }
    
    showProgress('Analyzing items...');
    setButtonState(false);
    
    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(currentItems)
        });
        const data = await response.json();
        
        if (data.success) {
            analyzedItems = data.items;
            displayResults(data.items);
            document.getElementById('deleteBtn').disabled = false;
            updateSummary(data.count, data.recommended);
            showStatus(`Analysis complete: ${data.recommended} recommended for deletion`, 'success');
        }
    } catch (error) {
        showStatus('Analysis failed', 'error');
        console.error(error);
    } finally {
        hideProgress();
        setButtonState(true);
    }
}

// Display results
function displayResults(items) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-inbox"></i><p>No items found</p></td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        const score = (item.deletion_score || 0).toFixed(2);
        const recommended = item.deletion_recommended ? '<span class="badge badge-danger">Yes</span>' : '<span class="badge">No</span>';
        row.innerHTML = `
            <td>${escapeHtml(item.title || 'N/A')}</td>
            <td><span class="score-badge">${score}</span></td>
            <td>${item.play_count || 0}</td>
            <td>${item.rating || 'N/A'}</td>
            <td>${formatSize(item.size_bytes || 0)}</td>
            <td>${item.age_days || 0} days</td>
            <td>${recommended}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="viewDetails('${escapeHtml(item.title || '')}')">View</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Update summary
function updateSummary(total, recommended) {
    document.getElementById('summaryBar').innerHTML = `
        <strong>Analyzed ${total} items</strong> | 
        <span style="color: var(--danger)">${recommended} recommended for deletion</span>
    `;
}

// Progress functions
function showProgress(text) {
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('progressText').textContent = text;
    document.getElementById('progressFill').style.width = '0%';
}

function hideProgress() {
    document.getElementById('progressSection').style.display = 'none';
}

function updateProgress(percent) {
    document.getElementById('progressFill').style.width = `${percent}%`;
}

function handleProgressUpdate(data) {
    if (data.task === 'collect' || data.task === 'analyze') {
        if (data.data.status === 'complete') {
            updateProgress(100);
            setTimeout(hideProgress, 1000);
        } else if (data.data.status === 'starting') {
            updateProgress(10);
        }
    }
}

// Status functions
function showStatus(message, type = 'info') {
    const indicator = document.getElementById('statusText');
    indicator.textContent = message;
    const dot = document.querySelector('.status-dot');
    dot.style.background = type === 'error' ? 'var(--danger)' : 
                          type === 'success' ? 'var(--success)' : 'var(--primary)';
}

function setButtonState(enabled) {
    document.getElementById('analyzeBtn').disabled = !enabled;
    document.getElementById('deleteBtn').disabled = !enabled;
}

// Delete items
async function deleteItems() {
    if (!analyzedItems.length) {
        alert('No items to delete');
        return;
    }
    
    const confirmed = confirm(`This will perform a DRY-RUN deletion. ${analyzedItems.filter(i => i.deletion_recommended).length} items would be deleted. Continue?`);
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE}/delete?execute=false&confirm=false`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(analyzedItems)
        });
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            showStatus(data.message, 'success');
        }
    } catch (error) {
        showStatus('Deletion failed', 'error');
        console.error(error);
    }
}

// Utility functions
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions
function exportResults() {
    if (!analyzedItems.length) {
        alert('No results to export');
        return;
    }
    const dataStr = JSON.stringify(analyzedItems, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plexiq-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
}

function refreshResults() {
    if (analyzedItems.length) {
        displayResults(analyzedItems);
    }
}

function viewDetails(title) {
    const item = analyzedItems.find(i => i.title === title);
    if (item) {
        alert(`Details for ${title}:\n\nScore: ${item.deletion_score}\nPlay Count: ${item.play_count}\nRating: ${item.rating}`);
    }
}

// Settings modal
function showSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    loadSettings();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function loadSettings() {
    try {
        const response = await fetch(`${API_BASE}/config`);
        const config = await response.json();
        document.getElementById('settingsContent').innerHTML = `
            <h3>Configuration</h3>
            <p><strong>Plex URL:</strong> ${config.plex_url}</p>
            <p><strong>Dry Run Default:</strong> ${config.dry_run_default ? 'Yes' : 'No'}</p>
            <p><strong>Token Configured:</strong> ${config.has_token ? 'Yes' : 'No'}</p>
        `;
    } catch (error) {
        console.error(error);
    }
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target === modal) {
        closeSettings();
    }
}

