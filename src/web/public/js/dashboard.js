// src/web/public/js/dashboard.js

class ConfigurationDashboard {
    constructor() {
        this.apiBase = '/api/config';
        this.groups = [];
        this.settings = {};
        this.currentTab = 'groups';
        this.editingGroup = null;
        this.ws = null;
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.isMonitoringConnected = false;
        this.currentCounts = {};
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTabs();
        await this.loadData();
        this.startMonitoring();
        this.connectWebSocket();
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
        document.getElementById('addGroupBtn').addEventListener('click', () => this.openGroupModal());

        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveGroupBtn').addEventListener('click', () => this.saveGroup());
        document.getElementById('testPatternBtn').addEventListener('click', () => this.testPattern());

        // Form events
        document.getElementById('addCharacterBtn').addEventListener('click', () => this.addCharacterInput());
        document.getElementById('colorPicker').addEventListener('change', (e) => this.updateColorHex(e.target.value));
        document.getElementById('colorHex').addEventListener('input', (e) => this.updateColorPicker(e.target.value));

        // Settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());

        // Search and filter
        document.getElementById('searchGroups').addEventListener('input', (e) => this.filterGroups(e.target.value));
        document.getElementById('filterStatus').addEventListener('change', (e) => this.filterGroups(null, e.target.value));

        // Preview updates
        ['groupName', 'displayName', 'emoji'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updatePreview());
        });

        // Modal outside click
        document.getElementById('groupModal').addEventListener('click', (e) => {
            if (e.target.id === 'groupModal') {
                this.closeModal();
            }
        });
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        this.currentTab = tabName;

        // Load tab-specific data
        switch (tabName) {
            case 'monitor':
                this.loadMonitorData();
                break;
            case 'stats':
                this.loadStatsData();
                break;
        }
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadGroups(),
                this.loadSettings()
            ]);
        } catch (error) {
            this.showToast('데이터 로딩 실패: ' + error.message, 'error');
        }
    }

    async loadGroups() {
        try {
            const response = await fetch(`${this.apiBase}/groups`);
            const data = await response.json();
            
            if (data.success) {
                this.groups = data.data;
                this.renderGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Failed to load groups:', error);
            throw error;
        }
    }

    async loadSettings() {
        try {
            const response = await fetch(`${this.apiBase}/settings`);
            const data = await response.json();
            
            if (data.success) {
                this.settings = data.data;
                this.renderSettings();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            throw error;
        }
    }

    renderGroups() {
        const container = document.getElementById('groupsGrid');
        container.innerHTML = '';

        this.groups.forEach(group => {
            const card = this.createGroupCard(group);
            container.appendChild(card);
        });
    }

    createGroupCard(group) {
        const card = document.createElement('div');
        card.className = `group-card ${!group.enabled ? 'disabled' : ''}`;
        card.innerHTML = `
            <div class="group-header">
                <div class="group-title">
                    <span class="group-emoji">${group.emoji}</span>
                    <span class="group-name">${group.display_name}</span>
                </div>
                <div class="group-actions">
                    <button class="action-btn" onclick="dashboard.editGroup('${group.id}')" title="편집">
                        ✏️
                    </button>
                    <button class="action-btn" onclick="dashboard.toggleGroup('${group.id}')" title="${group.enabled ? '비활성화' : '활성화'}">
                        ${group.enabled ? '⏸️' : '▶️'}
                    </button>
                    <button class="action-btn" onclick="dashboard.deleteGroup('${group.id}')" title="삭제">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="group-info">
                <div class="info-item">
                    <span class="info-label">문자:</span>
                    <div class="characters-display">
                        ${group.characters.map(char => `<span class="character-tag">${char}</span>`).join('')}
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-label">임계값:</span>
                    <span>${group.threshold}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">색상:</span>
                    <span style="color: #${group.color.toString(16).padStart(6, '0')}">#${group.color.toString(16).padStart(6, '0').toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">상태:</span>
                    <span class="status-badge ${group.enabled ? 'status-active' : 'status-inactive'}">
                        ${group.enabled ? '활성' : '비활성'}
                    </span>
                </div>
            </div>
        `;
        return card;
    }

    renderSettings() {
        document.getElementById('countThreshold').value = this.settings.countThreshold || 5;
        document.getElementById('alertCooldown').value = Math.floor((this.settings.alertCooldown || 300000) / 60000);
        document.getElementById('resetInterval').value = Math.floor((this.settings.countResetInterval || 60000) / 60000);
    }

    openGroupModal(group = null) {
        this.editingGroup = group;
        const modal = document.getElementById('groupModal');
        const title = document.getElementById('modalTitle');
        
        title.textContent = group ? '그룹 편집' : '새 그룹 추가';
        
        if (group) {
            this.populateGroupForm(group);
        } else {
            this.resetGroupForm();
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.getElementById('groupModal');
        modal.classList.remove('active');
        this.editingGroup = null;
    }

    populateGroupForm(group) {
        document.getElementById('groupName').value = group.name;
        document.getElementById('displayName').value = group.display_name;
        document.getElementById('emoji').value = group.emoji;
        document.getElementById('threshold').value = group.threshold;
        document.getElementById('enabled').checked = group.enabled;
        
        const colorHex = '#' + group.color.toString(16).padStart(6, '0');
        document.getElementById('colorPicker').value = colorHex;
        document.getElementById('colorHex').value = colorHex.toUpperCase();
        
        // Characters
        const container = document.getElementById('charactersContainer');
        container.innerHTML = '';
        group.characters.forEach(char => {
            this.addCharacterInput(char);
        });
        
        this.updatePreview();
    }

    resetGroupForm() {
        document.getElementById('groupForm').reset();
        document.getElementById('enabled').checked = true;
        document.getElementById('colorPicker').value = '#3b82f6';
        document.getElementById('colorHex').value = '#3B82F6';
        document.getElementById('threshold').value = 5;
        
        const container = document.getElementById('charactersContainer');
        container.innerHTML = '';
        this.addCharacterInput();
        
        this.updatePreview();
    }

    addCharacterInput(value = '') {
        const container = document.getElementById('charactersContainer');
        const div = document.createElement('div');
        div.className = 'character-input-group';
        div.innerHTML = `
            <input type="text" class="character-input" maxlength="2" value="${value}" placeholder="문자" required>
            <button type="button" class="remove-character" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
    }

    updateColorHex(colorValue) {
        document.getElementById('colorHex').value = colorValue.toUpperCase();
        this.updatePreview();
    }

    updateColorPicker(hexValue) {
        if (hexValue.match(/^#[0-9A-Fa-f]{6}$/)) {
            document.getElementById('colorPicker').value = hexValue;
            this.updatePreview();
        }
    }

    updatePreview() {
        const emoji = document.getElementById('emoji').value || '🔔';
        const displayName = document.getElementById('displayName').value || '그룹';
        
        document.getElementById('previewEmoji').textContent = emoji;
        document.getElementById('previewEmoji2').textContent = emoji;
        document.getElementById('previewText').textContent = `젖${displayName} 알림`;
    }

    async saveGroup() {
        try {
            const formData = this.getGroupFormData();
            const validation = this.validateGroupData(formData);
            
            if (!validation.valid) {
                this.showToast(validation.error, 'error');
                return;
            }

            let response;
            if (this.editingGroup) {
                response = await fetch(`${this.apiBase}/groups/${this.editingGroup.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                response = await fetch(`${this.apiBase}/groups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const data = await response.json();
            
            if (data.success) {
                this.showToast(this.editingGroup ? '그룹이 수정되었습니다' : '그룹이 생성되었습니다', 'success');
                this.closeModal();
                await this.loadGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showToast('저장 실패: ' + error.message, 'error');
        }
    }

    getGroupFormData() {
        const characters = Array.from(document.querySelectorAll('.character-input'))
            .map(input => input.value.trim())
            .filter(char => char.length > 0);

        const colorHex = document.getElementById('colorHex').value.replace('#', '');
        
        return {
            name: document.getElementById('groupName').value.trim(),
            display_name: document.getElementById('displayName').value.trim(),
            emoji: document.getElementById('emoji').value.trim(),
            color: parseInt(colorHex, 16),
            threshold: parseInt(document.getElementById('threshold').value),
            characters: characters,
            enabled: document.getElementById('enabled').checked
        };
    }

    validateGroupData(data) {
        if (!data.name) return { valid: false, error: '그룹 이름을 입력해주세요' };
        if (!data.display_name) return { valid: false, error: '표시 이름을 입력해주세요' };
        if (!data.emoji) return { valid: false, error: '이모지를 입력해주세요' };
        if (data.characters.length === 0) return { valid: false, error: '최소 하나의 문자를 입력해주세요' };
        if (data.threshold < 1 || data.threshold > 100) return { valid: false, error: '임계값은 1-100 사이여야 합니다' };
        if (isNaN(data.color)) return { valid: false, error: '올바른 색상을 선택해주세요' };
        
        return { valid: true };
    }

    async editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            this.openGroupModal(group);
        }
    }

    async toggleGroup(groupId) {
        try {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return;

            const response = await fetch(`${this.apiBase}/groups/${groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...group, enabled: !group.enabled })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast(`그룹이 ${!group.enabled ? '활성화' : '비활성화'}되었습니다`, 'success');
                await this.loadGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showToast('상태 변경 실패: ' + error.message, 'error');
        }
    }

    async deleteGroup(groupId) {
        if (!confirm('정말 이 그룹을 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`${this.apiBase}/groups/${groupId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showToast('그룹이 삭제되었습니다', 'success');
                await this.loadGroups();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.showToast('삭제 실패: ' + error.message, 'error');
        }
    }

    async saveSettings() {
        try {
            const countThreshold = parseInt(document.getElementById('countThreshold').value);
            const alertCooldown = parseInt(document.getElementById('alertCooldown').value) * 60000;
            const resetInterval = parseInt(document.getElementById('resetInterval').value) * 60000;

            await Promise.all([
                this.updateSetting('countThreshold', countThreshold),
                this.updateSetting('alertCooldown', alertCooldown),
                this.updateSetting('countResetInterval', resetInterval)
            ]);

            this.showToast('설정이 저장되었습니다', 'success');
        } catch (error) {
            this.showToast('설정 저장 실패: ' + error.message, 'error');
        }
    }

    async updateSetting(key, value) {
        const response = await fetch(`${this.apiBase}/settings/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error);
        }
    }

    async refreshData() {
        try {
            await fetch(`${this.apiBase}/reload`, { method: 'POST' });
            await this.loadData();
            this.showToast('설정이 새로고침되었습니다', 'success');
        } catch (error) {
            this.showToast('새로고침 실패: ' + error.message, 'error');
        }
    }

    filterGroups(searchTerm = null, statusFilter = null) {
        const search = searchTerm || document.getElementById('searchGroups').value.toLowerCase();
        const status = statusFilter || document.getElementById('filterStatus').value;
        
        const cards = document.querySelectorAll('.group-card');
        cards.forEach(card => {
            const groupName = card.querySelector('.group-name').textContent.toLowerCase();
            const isEnabled = !card.classList.contains('disabled');
            
            const matchesSearch = !search || groupName.includes(search);
            const matchesStatus = status === 'all' || 
                               (status === 'enabled' && isEnabled) || 
                               (status === 'disabled' && !isEnabled);
            
            card.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
        });
    }

    async loadMonitorData() {
        try {
            const [countsResponse, statusResponse] = await Promise.all([
                fetch(`${this.apiBase}/stats/counts`),
                fetch(`${this.apiBase}/status`)
            ]);

            const countsData = await countsResponse.json();
            const statusData = await statusResponse.json();

            if (countsData.success) {
                this.renderMonitorCounts(countsData.data);
            }
            
            if (statusData.success) {
                this.renderSystemStatus(statusData.data);
            }
        } catch (error) {
            console.error('Failed to load monitor data:', error);
        }
    }

    renderMonitorCounts(counts) {
        const container = document.getElementById('monitorGrid');
        
        if (!counts || Object.keys(counts).length === 0) {
            container.innerHTML = '<div class="no-data">감지 그룹이 없거나 카운트 데이터가 없습니다.</div>';
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const connectionStatus = this.isMonitoringConnected ? 
            '<span class="realtime-indicator">🟢 실시간</span>' : 
            '<span class="realtime-indicator">🔴 오프라인</span>';
        
        let html = `
            <div class="monitor-header">
                <h4>감지 그룹별 누적 카운트</h4>
                <div class="monitor-meta">
                    ${connectionStatus}
                    <span class="last-updated">마지막 업데이트: ${timestamp}</span>
                </div>
            </div>
        `;

        Object.entries(counts).forEach(([group, groupCounts]) => {
            const groupInfo = this.groups.find(g => g.name === group);
            const emoji = groupInfo ? groupInfo.emoji : '🔔';
            const displayName = groupInfo ? groupInfo.display_name : group;
            const threshold = groupInfo ? groupInfo.threshold : 5;
            
            // 그룹별 진행률 계산
            const totalCount = Object.values(groupCounts).reduce((sum, count) => sum + count, 0);
            const avgCount = Object.keys(groupCounts).length > 0 ? 
                Math.floor(totalCount / Object.keys(groupCounts).length) : 0;
            const progress = Math.min((avgCount / threshold) * 100, 100);
            
            html += `
                <div class="monitor-group">
                    <div class="monitor-group-header">
                        <span class="group-emoji">${emoji}</span>
                        <span class="group-name">${displayName}</span>
                        <span class="group-progress">${avgCount}/${threshold} (${progress.toFixed(1)}%)</span>
                    </div>
                    <div class="monitor-group-counts">
            `;
            
            Object.entries(groupCounts).forEach(([char, count]) => {
                const charProgress = Math.min((count / threshold) * 100, 100);
                const isComplete = count >= threshold;
                
                html += `
                    <div class="monitor-item ${isComplete ? 'complete' : ''}">
                        <div class="monitor-char">${char}</div>
                        <div class="monitor-value">${count}</div>
                        <div class="monitor-progress-bar">
                            <div class="monitor-progress-fill" style="width: ${charProgress}%"></div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderSystemStatus(status) {
        const container = document.getElementById('systemStatus');
        container.innerHTML = `
            <div class="monitor-grid">
                <div class="monitor-item">
                    <div class="monitor-value">${status.totalGroups}</div>
                    <div class="monitor-label">총 그룹 수</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value">${status.enabledGroups}</div>
                    <div class="monitor-label">활성 그룹</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value">${Math.floor(status.uptime / 60)}분</div>
                    <div class="monitor-label">가동 시간</div>
                </div>
                <div class="monitor-item">
                    <div class="monitor-value">${status.systemHealth}</div>
                    <div class="monitor-label">시스템 상태</div>
                </div>
            </div>
        `;
    }

    async loadStatsData() {
        try {
            const response = await fetch(`${this.apiBase}/stats/groups`);
            const data = await response.json();
            
            if (data.success) {
                this.renderGroupStats(data.data);
            }
        } catch (error) {
            console.error('Failed to load stats data:', error);
        }
    }

    renderGroupStats(stats) {
        const container = document.getElementById('statsGrid');
        container.innerHTML = '';

        stats.forEach(stat => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-header">
                    <div class="stat-title">${stat.displayName}</div>
                    <div class="status-badge ${stat.enabled ? 'status-active' : 'status-inactive'}">
                        ${stat.enabled ? '활성' : '비활성'}
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-label">임계값:</span>
                    <span class="stat-value">${stat.threshold}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">문자 수:</span>
                    <span class="stat-value">${stat.characterCount}</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    startMonitoring() {
        // 30초마다 모니터링 데이터 업데이트 (WebSocket이 연결되지 않은 경우 대비)
        setInterval(() => {
            if (this.currentTab === 'monitor' && !this.isMonitoringConnected) {
                this.loadMonitorData();
            }
        }, 30000);
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/realtime/counts`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('실시간 모니터링 연결됨');
                this.isMonitoringConnected = true;
                this.wsReconnectAttempts = 0;
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('WebSocket 메시지 파싱 오류:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('실시간 모니터링 연결 해제됨');
                this.isMonitoringConnected = false;
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket 오류:', error);
                this.isMonitoringConnected = false;
                this.updateConnectionStatus(false);
            };
            
            // 30초마다 ping 메시지 전송 (연결 유지)
            setInterval(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000);
            
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            this.isMonitoringConnected = false;
            this.updateConnectionStatus(false);
            this.scheduleReconnect();
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'counts_update':
                this.currentCounts = data.data;
                if (this.currentTab === 'monitor') {
                    this.renderMonitorCounts(this.currentCounts);
                }
                console.log('실시간 카운트 업데이트:', data.data);
                break;
            case 'pong':
                // 서버로부터 pong 응답 받음
                break;
            default:
                console.log('알 수 없는 WebSocket 메시지:', data);
        }
    }

    scheduleReconnect() {
        if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
            console.log('최대 재연결 시도 횟수 초과');
            this.showToast('실시간 연결이 끊어졌습니다. 페이지를 새로고침해주세요.', 'warning');
            return;
        }
        
        const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000);
        this.wsReconnectAttempts++;
        
        console.log(`${delay}ms 후 재연결 시도... (${this.wsReconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
            this.connectWebSocket();
        }, delay);
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (connected) {
            statusDot.style.backgroundColor = '#10b981';
            statusText.textContent = '실시간 연결됨';
        } else {
            statusDot.style.backgroundColor = '#ef4444';
            statusText.textContent = '연결 끊어짐';
        }
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isMonitoringConnected = false;
        this.updateConnectionStatus(false);
    }

    testPattern() {
        const formData = this.getGroupFormData();
        const testText = formData.characters.join('');
        
        this.showToast(`테스트 패턴: "${testText}" → ${formData.emoji} 젖${formData.display_name} 알림 ${formData.emoji}`, 'success');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon');
        const messageEl = toast.querySelector('.toast-message');
        
        // Reset classes
        toast.className = 'toast';
        
        // Set type and content
        toast.classList.add(type);
        messageEl.textContent = message;
        
        // Set icon based on type
        switch (type) {
            case 'success':
                icon.textContent = '✅';
                break;
            case 'error':
                icon.textContent = '❌';
                break;
            case 'warning':
                icon.textContent = '⚠️';
                break;
            default:
                icon.textContent = 'ℹ️';
        }
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ConfigurationDashboard();
});