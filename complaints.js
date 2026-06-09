// Complaints Module (Supabase Connected)
(function() {
  // Load complaints from Supabase
  async function getComplaintsState() {
    try {
      const { data, error } = await window.supabaseClient
        .from('complaints')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      // Map columns back to JS structure
      return (data || []).map(row => ({
        id: row.id,
        studentName: row.student_name,
        roomNo: row.room_no,
        category: row.category,
        title: row.title,
        description: row.description,
        urgency: row.urgency,
        status: row.status,
        date: row.date,
        resolutionNote: row.resolution_note
      }));
    } catch (e) {
      console.error("Failed to load complaints from Supabase:", e);
      return [];
    }
  }

  // Add a new complaint to Supabase
  async function addComplaint(complaintData) {
    try {
      const { data, error } = await window.supabaseClient
        .from('complaints')
        .insert([{
          student_name: complaintData.studentName,
          room_no: complaintData.roomNo,
          category: complaintData.category,
          title: complaintData.title,
          description: complaintData.description,
          urgency: complaintData.urgency,
          status: 'Pending',
          resolution_note: ''
        }]);
        
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Failed to add complaint to Supabase:", e);
      return false;
    }
  }

  // Update a complaint status & note (Warden action) in Supabase
  async function updateComplaint(id, status, resolutionNote) {
    try {
      const { error } = await window.supabaseClient
        .from('complaints')
        .update({ status: status, resolution_note: resolutionNote || '' })
        .match({ id: id });
        
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Failed to update complaint in Supabase:", e);
      return false;
    }
  }

  // Render student's complaints
  async function renderStudentComplaints(container, currentStudentName) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Syncing complaints from database...</div>`;
    
    const complaints = await getComplaintsState();
    
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
              <span class="complaint-id">#${c.id.split('-')[0] || c.id}</span>
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
  async function renderWardenComplaints(container, filters = { status: 'all', category: 'all', urgency: 'all' }) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Syncing active grievance desk...</div>`;
    
    const complaints = await getComplaintsState();

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
              <span class="complaint-id">#${c.id.split('-')[0] || c.id}</span>
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
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const card = container.querySelector(`#warden-card-${id}`);
        const note = card.querySelector('.note-input').value;
        
        e.currentTarget.disabled = true;
        await updateComplaint(id, 'In Progress', note);
        await renderWardenComplaints(container, filters);
        showToast('Status updated to In Progress');
      });
    });

    container.querySelectorAll('.btn-resolve-trigger').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const card = container.querySelector(`#warden-card-${id}`);
        const note = card.querySelector('.note-input').value;
        
        e.currentTarget.disabled = true;
        await updateComplaint(id, 'Resolved', note || 'Resolved by warden.');
        await renderWardenComplaints(container, filters);
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
    addComplaint,
    updateComplaint,
    renderStudentComplaints,
    renderWardenComplaints
  };
})();
