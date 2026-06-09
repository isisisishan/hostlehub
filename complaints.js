// Complaints Module (Global Namespace)
(function() {
  // Load complaints from localStorage or seed
  function getComplaintsState() {
    let complaints = localStorage.getItem('hostelhub_complaints');
    if (!complaints) {
      localStorage.setItem('hostelhub_complaints', JSON.stringify(window.MOCK_COMPLAINTS));
      complaints = JSON.stringify(window.MOCK_COMPLAINTS);
    }
    return JSON.parse(complaints);
  }

  function saveComplaintsState(complaints) {
    localStorage.setItem('hostelhub_complaints', JSON.stringify(complaints));
  }

  // Add a new complaint
  function addComplaint(complaintData) {
    const complaints = getComplaintsState();
    const newComplaint = {
      id: `comp_${Date.now()}`,
      date: new Date().toISOString(),
      status: 'Pending',
      resolutionNote: '',
      ...complaintData
    };
    complaints.unshift(newComplaint); // Add to the top
    saveComplaintsState(complaints);
    return newComplaint;
  }

  // Update a complaint status & note (Warden action)
  function updateComplaint(id, status, resolutionNote) {
    const complaints = getComplaintsState();
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      complaints[index].status = status;
      complaints[index].resolutionNote = resolutionNote || '';
      saveComplaintsState(complaints);
      return true;
    }
    return false;
  }

  // Render student's complaints
  function renderStudentComplaints(container, currentStudentName) {
    if (!container) return;
    const complaints = getComplaintsState();
    
    const myComplaints = complaints.filter(c => c.studentName.toLowerCase() === currentStudentName.toLowerCase() || currentStudentName === 'student');

    if (myComplaints.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <p>No complaints submitted yet. Use the form on the left to report an issue.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="complaints-list">';
    
    myComplaints.forEach(c => {
      const formattedDate = new Date(c.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <div class="complaint-card ${c.status.toLowerCase().replace(' ', '')}">
          <div class="complaint-meta">
            <div class="complaint-top-left">
              <span class="complaint-id">#${c.id.split('_')[1] || c.id}</span>
              <span class="complaint-category">${c.category}</span>
            </div>
            <span class="urgency-badge ${c.urgency.toLowerCase()}">${c.urgency} Urgency</span>
          </div>
          
          <h3>${c.title}</h3>
          <p class="complaint-desc">${c.description}</p>
          
          ${c.resolutionNote ? `
            <div class="resolution-box">
              <h4>Warden Resolution Note</h4>
              <p>${c.resolutionNote}</p>
            </div>
          ` : ''}

          <div class="complaint-footer">
            <span>Reported by: <strong>Self (${c.roomNo})</strong> on ${formattedDate}</span>
            <span class="status-pill ${c.status.toLowerCase().replace(' ', '')}">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:currentColor;"></span>
              ${c.status}
            </span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // Render Warden Complaints Dashboard with Filters
  function renderWardenComplaints(container, filters = { status: 'all', category: 'all', urgency: 'all' }) {
    if (!container) return;
    const complaints = getComplaintsState();

    // Apply filters
    const filtered = complaints.filter(c => {
      const matchStatus = filters.status === 'all' || c.status.toLowerCase() === filters.status.toLowerCase();
      const matchCategory = filters.category === 'all' || c.category.toLowerCase() === filters.category.toLowerCase();
      const matchUrgency = filters.urgency === 'all' || c.urgency.toLowerCase() === filters.urgency.toLowerCase();
      return matchStatus && matchCategory && matchUrgency;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <p>No complaints match the selected filter criteria.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="complaints-list">';

    filtered.forEach(c => {
      const formattedDate = new Date(c.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <div class="complaint-card ${c.status.toLowerCase().replace(' ', '')}" id="warden-card-${c.id}">
          <div class="complaint-meta">
            <div class="complaint-top-left">
              <span class="complaint-id">#${c.id.split('_')[1] || c.id}</span>
              <span class="complaint-category">${c.category}</span>
            </div>
            <span class="urgency-badge ${c.urgency.toLowerCase()}">${c.urgency} Urgency</span>
          </div>
          
          <h3>${c.title}</h3>
          <p class="complaint-desc">${c.description}</p>
          
          <!-- Action Row for Warden -->
          <div style="margin: 15px 0; padding: 12px; background: rgba(0, 0, 0, 0.2); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.04);">
            <div class="form-group" style="margin-bottom: 10px;">
              <label style="font-size:0.75rem; margin-bottom:4px;">Warden Notes / Resolution Comments</label>
              <input type="text" class="form-control note-input" style="padding: 8px 12px; font-size: 0.85rem;" 
                     placeholder="Enter updates or resolution notes..." value="${c.resolutionNote || ''}">
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button class="btn btn-shortcut btn-inprogress-trigger" data-id="${c.id}" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(59, 130, 246, 0.15); color: var(--status-inprogress); border: 1px solid rgba(59, 130, 246, 0.3);">
                🔧 In Progress
              </button>
              <button class="btn btn-shortcut btn-resolve-trigger" data-id="${c.id}" style="padding: 6px 12px; font-size: 0.8rem; background: rgba(16, 185, 129, 0.15); color: var(--status-resolved); border: 1px solid rgba(16, 185, 129, 0.3);">
                ✅ Resolve
              </button>
            </div>
          </div>

          <div class="complaint-footer">
            <span>Submitted by: <strong>${c.studentName} (${c.roomNo})</strong> on ${formattedDate}</span>
            <span class="status-pill ${c.status.toLowerCase().replace(' ', '')}">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:currentColor;"></span>
              ${c.status}
            </span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add listeners to Warden buttons
    container.querySelectorAll('.btn-inprogress-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const card = container.querySelector(`#warden-card-${id}`);
        const note = card.querySelector('.note-input').value;
        updateComplaint(id, 'In Progress', note);
        renderWardenComplaints(container, filters);
        showToast('Status updated to In Progress');
      });
    });

    container.querySelectorAll('.btn-resolve-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const card = container.querySelector(`#warden-card-${id}`);
        const note = card.querySelector('.note-input').value;
        updateComplaint(id, 'Resolved', note || 'Resolved by warden.');
        renderWardenComplaints(container, filters);
        showToast('Complaint resolved successfully!');
      });
    });
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
  window.ComplaintsModule = {
    getComplaintsState,
    saveComplaintsState,
    addComplaint,
    updateComplaint,
    renderStudentComplaints,
    renderWardenComplaints
  };
})();
