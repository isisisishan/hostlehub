// HostelHub Main Coordinator App (Global Scope)
(function() {
  // DOM Cache
  const dom = {
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    roleSelect: document.getElementById('role-select'),
    
    appDashboard: document.getElementById('app-dashboard'),
    currentUserName: document.getElementById('current-user-name'),
    currentUserRoom: document.getElementById('current-user-room'),
    currentUserRole: document.getElementById('current-user-role'),
    btnLogout: document.getElementById('btn-logout'),

    // Dashboards
    studentDashboard: document.getElementById('student-dashboard'),
    wardenDashboard: document.getElementById('warden-dashboard'),
    adminDashboard: document.getElementById('admin-dashboard'),

    // Student Views
    tabComplaints: document.getElementById('tab-btn-complaints'),
    tabPools: document.getElementById('tab-btn-pools'),
    panelComplaints: document.getElementById('panel-complaints'),
    panelPools: document.getElementById('panel-pools'),
    
    menuWidgetContainer: document.getElementById('menu-widget-container'),
    btnViewWeeklyMenu: document.getElementById('btn-view-weekly-menu'),
    
    // Complaints Forms
    btnShowComplaintForm: document.getElementById('btn-show-complaint-form'),
    complaintFormWrapper: document.getElementById('complaint-form-wrapper'),
    complaintForm: document.getElementById('complaint-submission-form'),
    btnCancelComplaint: document.getElementById('btn-cancel-complaint'),
    studentComplaintsContainer: document.getElementById('student-complaints-container'),

    // Delivery Pools
    btnShowPoolForm: document.getElementById('btn-show-pool-form'),
    deliveryPollsContainer: document.getElementById('delivery-polls-container'),
    startPoolModal: document.getElementById('start-pool-modal'),
    btnClosePoolModal: document.getElementById('btn-close-pool-modal'),
    startPoolForm: document.getElementById('start-pool-form'),
    
    // Join Pool Modal
    joinPoolModal: document.getElementById('join-pool-modal'),
    btnCloseJoinModal: document.getElementById('btn-close-join-modal'),
    joinPoolForm: document.getElementById('join-pool-form'),

    // Weekly Menu Modal
    weeklyMenuModal: document.getElementById('weekly-menu-modal'),
    btnCloseWeeklyModal: document.getElementById('btn-close-weekly-modal'),
    weeklyMenuTableContainer: document.getElementById('weekly-menu-table-container'),

    // Warden Controls
    wardenComplaintsContainer: document.getElementById('warden-complaints-container'),
    wardenFilterStatus: document.getElementById('warden-filter-status'),
    wardenFilterCategory: document.getElementById('warden-filter-category'),
    wardenFilterUrgency: document.getElementById('warden-filter-urgency'),

    // Admin Controls
    adminMenuFormContainer: document.getElementById('admin-menu-form-container')
  };

  // State
  let currentUser = null;
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = WEEKDAYS[new Date().getDay()];

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    setupTabListeners();
    setupModalListeners();
    setupComplaintListeners();
    setupPoolListeners();
    setupWardenFilterListeners();
    setupAdminListeners();

    // Session Check
    checkAutoLogin();
  });

  // ==========================================
  // 1. AUTHENTICATION & LOGIN FLOW
  // ==========================================
  function setupAuthListeners() {
    dom.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = dom.usernameInput.value.trim();
      const password = dom.passwordInput.value.trim();
      const role = dom.roleSelect.value;
      
      processLogin(username, password, role);
    });

    document.getElementById('quick-student').addEventListener('click', () => {
      processLogin('student', 'student', 'student');
    });
    document.getElementById('quick-warden').addEventListener('click', () => {
      processLogin('warden', 'warden', 'warden');
    });
    document.getElementById('quick-admin').addEventListener('click', () => {
      processLogin('admin', 'admin', 'admin');
    });

    dom.btnLogout.addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('hostelhub_session');
      
      dom.appDashboard.style.display = 'none';
      dom.loginScreen.style.display = 'flex';
      
      dom.loginForm.reset();
    });
  }

  function processLogin(username, password, selectedRole) {
    if (selectedRole === 'student' && username === 'student' && password === 'student') {
      currentUser = { name: 'Aarav Sharma', room: 'Room B-204', role: 'student' };
    } else if (selectedRole === 'warden' && username === 'warden' && password === 'warden') {
      currentUser = { name: 'Mrs. Indrani Roy', room: 'Warden Office (GF)', role: 'warden' };
    } else if (selectedRole === 'admin' && username === 'admin' && password === 'admin') {
      currentUser = { name: 'Dev Admin (CSE Student)', room: 'Server Room A-10', role: 'admin' };
    } else {
      if (selectedRole === 'student') {
        currentUser = { name: username, room: 'Room C-302', role: 'student' };
      } else if (selectedRole === 'warden') {
        currentUser = { name: username, room: 'Admin Block', role: 'warden' };
      } else {
        currentUser = { name: username, room: 'Hostel Office', role: 'admin' };
      }
    }

    localStorage.setItem('hostelhub_session', JSON.stringify(currentUser));
    enterDashboard();
    showToast(`Welcome back, ${currentUser.name}!`);
  }

  function checkAutoLogin() {
    const session = localStorage.getItem('hostelhub_session');
    if (session) {
      currentUser = JSON.parse(session);
      enterDashboard();
    }
  }

  function enterDashboard() {
    dom.loginScreen.style.display = 'none';
    dom.appDashboard.style.display = 'block';

    dom.currentUserName.textContent = currentUser.name;
    dom.currentUserRoom.textContent = currentUser.room;
    dom.currentUserRole.textContent = currentUser.role;
    
    dom.currentUserRole.className = `user-role-tag ${currentUser.role}`;

    dom.studentDashboard.style.display = 'none';
    dom.wardenDashboard.style.display = 'none';
    dom.adminDashboard.style.display = 'none';

    if (currentUser.role === 'student') {
      dom.studentDashboard.style.display = 'block';
      window.MenuModule.renderTodayMenu(todayDayName, dom.menuWidgetContainer, true);
      window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
      window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
    } else if (currentUser.role === 'warden') {
      dom.wardenDashboard.style.display = 'block';
      loadWardenDashboard();
    } else if (currentUser.role === 'admin') {
      dom.adminDashboard.style.display = 'block';
      loadAdminDashboard();
    }
  }

  // ==========================================
  // 2. VIEW AND TABS TOGGLING
  // ==========================================
  function setupTabListeners() {
    dom.tabComplaints.addEventListener('click', () => {
      dom.tabComplaints.classList.add('active');
      dom.tabPools.classList.remove('active');
      dom.panelComplaints.style.display = 'block';
      dom.panelPools.style.display = 'none';
      
      window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
    });

    dom.tabPools.addEventListener('click', () => {
      dom.tabPools.classList.add('active');
      dom.tabComplaints.classList.remove('active');
      dom.panelPools.style.display = 'block';
      dom.panelComplaints.style.display = 'none';
      
      window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
    });
  }

  // ==========================================
  // 3. MODAL POPUPS TRIGGERS
  // ==========================================
  function setupModalListeners() {
    dom.btnViewWeeklyMenu.addEventListener('click', () => {
      window.MenuModule.renderWeeklyMenuTable(dom.weeklyMenuTableContainer);
      dom.weeklyMenuModal.classList.add('active');
    });

    dom.btnCloseWeeklyModal.addEventListener('click', () => {
      dom.weeklyMenuModal.classList.remove('active');
    });

    dom.btnShowPoolForm.addEventListener('click', () => {
      dom.startPoolModal.classList.add('active');
    });

    dom.btnClosePoolModal.addEventListener('click', () => {
      dom.startPoolModal.classList.remove('active');
      dom.startPoolForm.reset();
    });

    dom.btnCloseJoinModal.addEventListener('click', () => {
      dom.joinPoolModal.classList.remove('active');
      dom.joinPoolForm.reset();
    });

    [dom.weeklyMenuModal, dom.startPoolModal, dom.joinPoolModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          const form = modal.querySelector('form');
          if (form) form.reset();
        }
      });
    });
  }

  // ==========================================
  // 4. STUDENT COMPLAINT INTERFACES
  // ==========================================
  function setupComplaintListeners() {
    dom.btnShowComplaintForm.addEventListener('click', () => {
      dom.complaintFormWrapper.style.display = 'block';
      dom.btnShowComplaintForm.style.display = 'none';
    });

    dom.btnCancelComplaint.addEventListener('click', () => {
      dom.complaintFormWrapper.style.display = 'none';
      dom.btnShowComplaintForm.style.display = 'block';
      dom.complaintForm.reset();
    });

    dom.complaintForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const category = document.getElementById('comp-category').value;
      const urgency = document.getElementById('comp-urgency').value;
      const title = document.getElementById('comp-title').value.trim();
      const description = document.getElementById('comp-desc').value.trim();

      window.ComplaintsModule.addComplaint({
        studentName: currentUser.name,
        roomNo: currentUser.room.replace('Room ', ''),
        category,
        title,
        description,
        urgency
      });

      dom.complaintForm.reset();
      dom.complaintFormWrapper.style.display = 'none';
      dom.btnShowComplaintForm.style.display = 'block';
      
      window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
      showToast('Complaint ticket filed successfully!');
    });
  }

  // ==========================================
  // 5. DELIVERY POOLS GROUP ORDERING
  // ==========================================
  function setupPoolListeners() {
    dom.startPoolForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const appName = document.getElementById('pool-app').value;
      const targetTime = document.getElementById('pool-time').value.trim();
      const meetingSpot = document.getElementById('pool-spot').value.trim();
      const description = document.getElementById('pool-desc').value.trim();

      window.PollsModule.addPoll({
        creatorName: currentUser.name,
        roomNo: currentUser.room.replace('Room ', ''),
        appName,
        targetTime,
        meetingSpot,
        description
      });

      dom.startPoolModal.classList.remove('active');
      dom.startPoolForm.reset();
      
      window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
      showToast('Delivery group order launched!');
    });

    dom.joinPoolForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const pollId = document.getElementById('join-poll-id').value;
      const name = document.getElementById('join-name').value.trim();
      const room = document.getElementById('join-room').value.trim();
      const items = document.getElementById('join-items').value.trim();

      const success = window.PollsModule.joinPoll(pollId, name, room, items);

      dom.joinPoolModal.classList.remove('active');
      dom.joinPoolForm.reset();

      if (success) {
        window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
        showToast('Successfully joined the group order pool!');
      } else {
        showToast('Error: This pool is no longer active.');
      }
    });
  }

  // ==========================================
  // 6. WARDEN INTERFACES & FILTERING
  // ==========================================
  function setupWardenFilterListeners() {
    const triggerFilter = () => {
      const filters = {
        status: dom.wardenFilterStatus.value,
        category: dom.wardenFilterCategory.value,
        urgency: dom.wardenFilterUrgency.value
      };
      window.ComplaintsModule.renderWardenComplaints(dom.wardenComplaintsContainer, filters);
    };

    dom.wardenFilterStatus.addEventListener('change', triggerFilter);
    dom.wardenFilterCategory.addEventListener('change', triggerFilter);
    dom.wardenFilterUrgency.addEventListener('change', triggerFilter);
  }

  function loadWardenDashboard() {
    updateWardenStats();
    window.ComplaintsModule.renderWardenComplaints(dom.wardenComplaintsContainer);
  }

  function updateWardenStats() {
    const complaints = window.ComplaintsModule.getComplaintsState();
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inprogress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const critical = complaints.filter(c => c.urgency === 'Critical' && c.status !== 'Resolved').length;

    document.getElementById('warden-stat-pending').textContent = pending;
    document.getElementById('warden-stat-inprogress').textContent = inprogress;
    document.getElementById('warden-stat-resolved').textContent = resolved;
    document.getElementById('warden-stat-critical').textContent = critical;
  }

  // ==========================================
  // 7. ADMIN STUDIO (YOU)
  // ==========================================
  function setupAdminListeners() {
    const dayButtons = document.querySelectorAll('.admin-day-select');
    
    dayButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        dayButtons.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        
        const selectedDay = target.dataset.day;
        window.MenuModule.renderAdminMenuEditor(selectedDay, dom.adminMenuFormContainer);
      });
    });
  }

  function loadAdminDashboard() {
    const complaints = window.ComplaintsModule.getComplaintsState();
    const polls = window.PollsModule.getPollsState();
    
    const totalComp = complaints.length;
    const activePools = polls.filter(p => p.status === 'Active').length;
    
    const solved = complaints.filter(c => c.status === 'Resolved').length;
    const solvedPct = totalComp > 0 ? Math.round((solved / totalComp) * 100) : 100;

    document.getElementById('admin-stat-total-comp').textContent = totalComp;
    document.getElementById('admin-stat-active-pools').textContent = activePools;
    document.getElementById('admin-stat-solved-pct').textContent = `${solvedPct}%`;

    const dayButtons = document.querySelectorAll('.admin-day-select');
    dayButtons.forEach(btn => {
      if (btn.dataset.day === todayDayName) {
        btn.click();
      }
    });
  }

  // ==========================================
  // 8. GLOBAL UTILITIES
  // ==========================================
  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
      toast.querySelector('.toast-msg').textContent = msg;
      toast.classList.add('active');
      setTimeout(() => {
        toast.classList.remove('active');
      }, 3000);
    }
  }

  dom.wardenDashboard.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-resolve-trigger') || e.target.classList.contains('btn-inprogress-trigger')) {
      setTimeout(() => {
        updateWardenStats();
      }, 50);
    }
  });
})();
