// Delivery Co-Ordering Pools Module (Supabase Connected)
(function() {
  // Get current state from Supabase
  async function getPollsState() {
    try {
      const { data, error } = await window.supabaseClient
        .from('polls')
        .select('*')
        .order('status', { ascending: true }); // Active first (Active < Closed alphabetically)
        
      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        creatorName: row.creator_name,
        roomNo: row.room_no,
        appName: row.app_name,
        targetTime: row.target_time,
        meetingSpot: row.meeting_spot,
        description: row.description,
        status: row.status,
        members: row.members // jsonb array
      }));
    } catch (e) {
      console.error("Failed to load delivery pools from Supabase:", e);
      return [];
    }
  }

  // Add a new delivery pool to Supabase
  async function addPoll(pollData) {
    try {
      const { data, error } = await window.supabaseClient
        .from('polls')
        .insert([{
          creator_name: pollData.creatorName,
          room_no: pollData.roomNo,
          app_name: pollData.appName,
          target_time: pollData.targetTime,
          meeting_spot: pollData.meetingSpot,
          description: pollData.description,
          status: 'Active',
          members: [
            {
              name: pollData.creatorName,
              room: pollData.roomNo,
              items: "Host (Order Coordinator)"
            }
          ]
        }]);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Failed to create delivery pool in Supabase:", e);
      return false;
    }
  }

  // Join an existing pool in Supabase (modifying the JSON array)
  async function joinPoll(pollId, memberName, roomNo, itemsList) {
    try {
      // 1. Fetch current members
      const { data, error: fetchError } = await window.supabaseClient
        .from('polls')
        .select('members, status')
        .match({ id: pollId })
        .single();
        
      if (fetchError || !data || data.status !== 'Active') {
        throw new Error("Pool is not active or could not be found.");
      }

      // 2. Append new member details
      const updatedMembers = [...data.members, {
        name: memberName,
        room: roomNo,
        items: itemsList || 'Join Order'
      }];

      // 3. Update row in Supabase
      const { error: updateError } = await window.supabaseClient
        .from('polls')
        .update({ members: updatedMembers })
        .match({ id: pollId });

      if (updateError) throw updateError;
      return true;
    } catch (e) {
      console.error("Failed to join delivery pool in Supabase:", e);
      return false;
    }
  }

  // Close/Complete a pool (only host or admin can trigger) in Supabase
  async function closePoll(pollId) {
    try {
      const { error } = await window.supabaseClient
        .from('polls')
        .update({ status: 'Closed' })
        .match({ id: pollId });

      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Failed to close delivery pool in Supabase:", e);
      return false;
    }
  }

  // Render active delivery pools in the student view or admin panel
  async function renderDeliveryPolls(container, options = { showJoinAction: true, currentStudentName: '' }) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Syncing active delivery pools...</div>`;
    
    const polls = await getPollsState();
    
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
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        
        e.currentTarget.disabled = true;
        await closePoll(id);
        await renderDeliveryPolls(container, options);
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
    addPoll,
    joinPoll,
    closePoll,
    renderDeliveryPolls
  };
})();
