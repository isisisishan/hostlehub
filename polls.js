// Delivery Co-Ordering Pools Module (Global Namespace)
(function() {
  // Get current state from localStorage or seed
  function getPollsState() {
    let polls = localStorage.getItem('hostelhub_polls');
    if (!polls) {
      localStorage.setItem('hostelhub_polls', JSON.stringify(window.MOCK_POLLS));
      polls = JSON.stringify(window.MOCK_POLLS);
    }
    return JSON.parse(polls);
  }

  function savePollsState(polls) {
    localStorage.setItem('hostelhub_polls', JSON.stringify(polls));
  }

  // Add a new delivery pool
  function addPoll(pollData) {
    const polls = getPollsState();
    const newPoll = {
      id: `poll_${Date.now()}`,
      status: 'Active',
      members: [
        {
          name: pollData.creatorName,
          room: pollData.roomNo,
          items: "Host (Order Coordinator)"
        }
      ],
      ...pollData
    };
    polls.unshift(newPoll);
    savePollsState(polls);
    return newPoll;
  }

  // Join an existing pool
  function joinPoll(pollId, memberName, roomNo, itemsList) {
    const polls = getPollsState();
    const index = polls.findIndex(p => p.id === pollId);
    if (index !== -1 && polls[index].status === 'Active') {
      polls[index].members.push({
        name: memberName,
        room: roomNo,
        items: itemsList || 'Join Order'
      });
      savePollsState(polls);
      return true;
    }
    return false;
  }

  // Close/Complete a pool (only host or admin can trigger)
  function closePoll(pollId) {
    const polls = getPollsState();
    const index = polls.findIndex(p => p.id === pollId);
    if (index !== -1) {
      polls[index].status = 'Closed';
      savePollsState(polls);
      return true;
    }
    return false;
  }

  // Render active delivery pools in the student view or admin panel
  function renderDeliveryPolls(container, options = { showJoinAction: true, currentStudentName: '' }) {
    if (!container) return;
    const polls = getPollsState();
    
    // Show active ones first, but show closed ones muted at the end
    const activePolls = polls.filter(p => p.status === 'Active');
    const closedPolls = polls.filter(p => p.status === 'Closed');
    const allToShow = [...activePolls, ...closedPolls];

    if (allToShow.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary); width: 100%;">
          <p>No active delivery pools. Be the first to start a group order!</p>
        </div>
      `;
      return;
    }

    let html = '<div class="polls-grid">';

    allToShow.forEach(p => {
      const appInfo = window.APP_DETAILS[p.appName] || window.APP_DETAILS['Other'];
      const isActive = p.status === 'Active';
      
      html += `
        <div class="glass-panel poll-card" style="opacity: ${isActive ? '1' : '0.6'}; border-top: 4px solid ${appInfo.color};">
          <div class="poll-header">
            <span class="app-badge" style="background-color: ${appInfo.color}; color: ${appInfo.textColor};">
              ${appInfo.logoText}
            </span>
            ${isActive ? `
              <span class="poll-timer">⏱️ order at ${p.targetTime}</span>
            ` : `
              <span class="status-pill" style="font-size:0.7rem; padding: 2px 6px;">Closed</span>
            `}
          </div>

          <p class="poll-desc">${p.description}</p>

          <div class="poll-info-block">
            <div class="poll-info-item">
              <span class="poll-info-label">Host:</span>
              <strong>${p.creatorName} (${p.roomNo})</strong>
            </div>
            <div class="poll-info-item">
              <span class="poll-info-label">Meet Point:</span>
              <strong>${p.meetingSpot}</strong>
            </div>
            <div class="poll-info-item">
              <span class="poll-info-label">Subscribers:</span>
              <strong>${p.members.length} member(s)</strong>
            </div>
          </div>

          <div class="poll-members-title">Pool Members:</div>
          <div class="poll-members-list">
            ${p.members.map(m => `
              <div class="poll-member-item">
                <span class="poll-member-name">${m.name} (${m.room})</span>
                <span class="poll-member-items" title="${m.items}">${m.items}</span>
              </div>
            `).join('')}
          </div>

          ${isActive && options.showJoinAction ? `
            <div style="display: flex; gap: 8px; margin-top: auto;">
              <button class="btn btn-secondary btn-join-pool-modal" data-id="${p.id}" data-app="${p.appName}" style="width: 100%; padding: 8px;">
                ➕ Join Group Order
              </button>
              ${options.currentStudentName && p.creatorName.toLowerCase() === options.currentStudentName.toLowerCase() ? `
                <button class="btn btn-danger btn-close-pool" data-id="${p.id}" style="padding: 8px;" title="Close order">
                  🚫 Close
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add click handlers for joining
    container.querySelectorAll('.btn-join-pool-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const app = e.currentTarget.dataset.app;
        openJoinModal(id, app);
      });
    });

    // Add click handler for closing
    container.querySelectorAll('.btn-close-pool').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        closePoll(id);
        renderDeliveryPolls(container, options);
        showToast('Delivery pool closed.');
      });
    });
  }

  function openJoinModal(pollId, appName) {
    const modal = document.getElementById('join-pool-modal');
    if (!modal) return;
    
    modal.querySelector('#join-poll-id').value = pollId;
    modal.querySelector('#join-app-name').textContent = appName;
    modal.classList.add('active');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
      toast.querySelector('.toast-msg').textContent = msg;
      toast.classList.add('active');
      setTimeout(() => toast.classList.remove('active'), 3000);
    }
  }

  // Export to global scope
  window.PollsModule = {
    getPollsState,
    savePollsState,
    addPoll,
    joinPoll,
    closePoll,
    renderDeliveryPolls
  };
})();
