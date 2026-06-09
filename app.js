// HostelHub Main Coordinator App (Supabase Connected)
(function() {
  // DOM Cache
  const dom = {
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginRoomGroup: document.getElementById('login-room-group'),
    loginRoomInput: document.getElementById('login-room'),
    roleSelect: document.getElementById('role-select'),
    registerToggleText: document.getElementById('register-toggle-text'),
    
    registerForm: document.getElementById('register-form'),
    regUsernameInput: document.getElementById('reg-username'),
    regPasswordInput: document.getElementById('reg-password'),
    regRoomInput: document.getElementById('reg-room'),
    btnShowRegister: document.getElementById('btn-show-register'),
    btnShowLogin: document.getElementById('btn-show-login'),
    
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
    const userLabel = document.getElementById('login-label-user');
    const passLabel = document.getElementById('login-label-pass');

    // Toggle between login and registration forms
    dom.btnShowRegister.addEventListener('click', (e) => {
      e.preventDefault();
      dom.loginForm.style.display = 'none';
      dom.registerForm.style.display = 'block';
    });

    dom.btnShowLogin.addEventListener('click', (e) => {
      e.preventDefault();
      dom.registerForm.style.display = 'none';
      dom.loginForm.style.display = 'block';
    });

    // Default: Show Room Number field on load since "student" is default dropdown selection
    dom.loginRoomGroup.style.display = 'block';
    dom.loginRoomInput.required = true;
    userLabel.textContent = "Username / Student ID";
    dom.usernameInput.placeholder = "e.g., student1";
    passLabel.textContent = "Password";
    dom.passwordInput.type = "password";
    dom.passwordInput.placeholder = "••••••••";

    // Dynamically adjust inputs based on role selection
    dom.roleSelect.addEventListener('change', () => {
      const role = dom.roleSelect.value;
      if (role === 'student') {
        userLabel.textContent = "Username / Student ID";
        dom.usernameInput.placeholder = "e.g., student1";
        
        passLabel.textContent = "Password";
        dom.passwordInput.type = "password";
        dom.passwordInput.placeholder = "••••••••";

        dom.loginRoomGroup.style.display = 'block';
        dom.loginRoomInput.required = true;
        dom.registerToggleText.style.display = 'block';
      } else {
        userLabel.textContent = "Staff Username";
        dom.usernameInput.placeholder = "Enter staff username";
        
        passLabel.textContent = "Password";
        dom.passwordInput.type = "password";
        dom.passwordInput.placeholder = "••••••••";

        dom.loginRoomGroup.style.display = 'none';
        dom.loginRoomInput.required = false;
        dom.registerToggleText.style.display = 'none';
      }
      dom.usernameInput.value = "";
      dom.passwordInput.value = "";
      dom.loginRoomInput.value = "";
    });

    // Handle Login Form Submission
    dom.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = dom.usernameInput.value.trim();
      const password = dom.passwordInput.value.trim();
      const role = dom.roleSelect.value;
      const roomNo = dom.loginRoomInput.value.trim();
      
      const submitBtn = dom.loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Authenticating...";

      await processLogin(username, password, role, roomNo);
      
      submitBtn.disabled = false;
      submitBtn.textContent = "Secure Login";
    });

    // Handle Student Registration Form Submission
    dom.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = dom.regUsernameInput.value.trim();
      const password = dom.regPasswordInput.value.trim();
      const roomNo = dom.regRoomInput.value.trim();

      const submitBtn = dom.registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";

      // 1. Check if username exists
      const { data: userExists, error: existError } = await window.supabaseClient
        .from('users')
        .select('username')
        .match({ username: username })
        .maybeSingle();

      if (existError) {
        showToast(`Error checking user: ${existError.message} (Is users table created?)`);
        console.error(existError);
        submitBtn.disabled = false;
        submitBtn.textContent = "Register Account";
        return;
      }

      if (userExists) {
        showToast("Username already exists!");
        submitBtn.disabled = false;
        submitBtn.textContent = "Register Account";
        return;
      }

      // 2. Insert new student user
      const { error } = await window.supabaseClient
        .from('users')
        .insert([{
          username: username,
          password: password,
          role: 'student',
          room_no: roomNo
        }]);

      if (error) {
        showToast(`Registration Error: ${error.message} (Did you disable RLS?)`);
        console.error(error);
      } else {
        showToast("Account created! Please log in.");
        // Redirect to login form
        dom.registerForm.reset();
        dom.registerForm.style.display = 'none';
        dom.loginForm.style.display = 'block';
        
        // Auto fill username
        dom.roleSelect.value = 'student';
        dom.roleSelect.dispatchEvent(new Event('change'));
        dom.usernameInput.value = username;
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = "Register Account";
    });

    // Quick Login Shortcuts - Bypasses Supabase check for easy review of all interfaces
    document.getElementById('quick-student').addEventListener('click', () => {
      loginAsDemo('Aarav Sharma', 'B-204', 'student');
    });
    document.getElementById('quick-warden').addEventListener('click', () => {
      loginAsDemo('Mrs. Indrani Roy', 'Warden Office (GF)', 'warden');
    });
    document.getElementById('quick-admin').addEventListener('click', () => {
      loginAsDemo('Dev Admin (CSE Student)', 'Server Room A-10', 'admin');
    });

    dom.btnLogout.addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('hostelhub_session');
      
      dom.appDashboard.style.display = 'none';
      dom.loginScreen.style.display = 'flex';
      
      dom.loginForm.reset();
      dom.roleSelect.value = 'student';
      dom.roleSelect.dispatchEvent(new Event('change'));
    });
  }

  // Bypasses database validation to quickly inspect UI features
  function loginAsDemo(username, roomValue, role) {
    currentUser = {
      name: username,
      room: role === 'student' ? `Room ${roomValue}` : roomValue,
      role: role
    };
    localStorage.setItem('hostelhub_session', JSON.stringify(currentUser));
    enterDashboard();
    showToast(`Demo mode active: Welcome, ${currentUser.name}!`);
  }

  async function processLogin(username, password, selectedRole, roomNo) {
    let matchQuery = { username: username, password: password, role: selectedRole };
    if (selectedRole === 'student') {
      matchQuery.room_no = roomNo;
    }

    const { data: userRecord, error } = await window.supabaseClient
      .from('users')
      .select('*')
      .match(matchQuery)
      .maybeSingle();

    if (error) {
      console.error("Authentication error:", error);
      showToast(`Database error: ${error.message} (Is users table created?)`);
      return;
    }

    if (!userRecord) {
      if (selectedRole === 'student') {
        showToast("Invalid Student Username, Password, or Room Number!");
      } else {
        showToast("Invalid Staff Username or Password!");
      }
      return;
    }

    // Login successful
    currentUser = {
      name: userRecord.username,
      room: userRecord.role === 'student' ? `Room ${userRecord.room_no}` : 'Staff Block',
      role: userRecord.role
    };

    localStorage.setItem('hostelhub_session', JSON.stringify(currentUser));
    await enterDashboard();
    showToast(`Welcome back, ${currentUser.name}!`);
  }

  function checkAutoLogin() {
    const session = localStorage.getItem('hostelhub_session');
    if (session) {
      currentUser = JSON.parse(session);
      enterDashboard();
    }
  }

  async function enterDashboard() {
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
      await window.MenuModule.renderTodayMenu(todayDayName, dom.menuWidgetContainer, true);
      await window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
      await window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
    } else if (currentUser.role === 'warden') {
      dom.wardenDashboard.style.display = 'block';
      await loadWardenDashboard();
    } else if (currentUser.role === 'admin') {
      dom.adminDashboard.style.display = 'block';
      await loadAdminDashboard();
    }
  }

  // ==========================================
  // 2. VIEW AND TABS TOGGLING
  // ==========================================
  function setupTabListeners() {
    dom.tabComplaints.addEventListener('click', async () => {
      dom.tabComplaints.classList.add('active');
      dom.tabPools.classList.remove('active');
      dom.panelComplaints.style.display = 'block';
      dom.panelPools.style.display = 'none';
      
      await window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
    });

    dom.tabPools.addEventListener('click', async () => {
      dom.tabPools.classList.add('active');
      dom.tabComplaints.classList.remove('active');
      dom.panelPools.style.display = 'block';
      dom.panelComplaints.style.display = 'none';
      
      await window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
    });
  }

  // ==========================================
  // 3. MODAL POPUPS TRIGGERS
  // ==========================================
  function setupModalListeners() {
    dom.btnViewWeeklyMenu.addEventListener('click', async () => {
      dom.weeklyMenuModal.classList.add('active');
      await window.MenuModule.renderWeeklyMenuTable(dom.weeklyMenuTableContainer);
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

    dom.complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const category = document.getElementById('comp-category').value;
      const urgency = document.getElementById('comp-urgency').value;
      const title = document.getElementById('comp-title').value.trim();
      const description = document.getElementById('comp-desc').value.trim();

      const submitBtn = dom.complaintForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting to database...";

      await window.ComplaintsModule.addComplaint({
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
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Ticket";
      
      await window.ComplaintsModule.renderStudentComplaints(dom.studentComplaintsContainer, currentUser.name);
      showToast('Complaint ticket filed successfully!');
    });
  }

  // ==========================================
  // 5. DELIVERY POOLS GROUP ORDERING
  // ==========================================
  function setupPoolListeners() {
    dom.startPoolForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const appName = document.getElementById('pool-app').value;
      const targetTime = document.getElementById('pool-time').value.trim();
      const meetingSpot = document.getElementById('pool-spot').value.trim();
      const description = document.getElementById('pool-desc').value.trim();

      const submitBtn = dom.startPoolForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Launching pool...";

      await window.PollsModule.addPoll({
        creatorName: currentUser.name,
        roomNo: currentUser.room.replace('Room ', ''),
        appName,
        targetTime,
        meetingSpot,
        description
      });

      dom.startPoolModal.classList.remove('active');
      dom.startPoolForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = "Launch Active Group Pool";
      
      await window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
      showToast('Delivery group order launched!');
    });

    dom.joinPoolForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const pollId = document.getElementById('join-poll-id').value;
      const name = document.getElementById('join-name').value.trim();
      const room = document.getElementById('join-room').value.trim();
      const items = document.getElementById('join-items').value.trim();

      const submitBtn = dom.joinPoolForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Joining pool...";

      const success = await window.PollsModule.joinPoll(pollId, name, room, items);

      dom.joinPoolModal.classList.remove('active');
      dom.joinPoolForm.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = "Request Group Inclusion";

      if (success) {
        await window.PollsModule.renderDeliveryPolls(dom.deliveryPollsContainer, { showJoinAction: true, currentStudentName: currentUser.name });
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
    const triggerFilter = async () => {
      const filters = {
        status: dom.wardenFilterStatus.value,
        category: dom.wardenFilterCategory.value,
        urgency: dom.wardenFilterUrgency.value
      };
      await window.ComplaintsModule.renderWardenComplaints(dom.wardenComplaintsContainer, filters);
    };

    dom.wardenFilterStatus.addEventListener('change', triggerFilter);
    dom.wardenFilterCategory.addEventListener('change', triggerFilter);
    dom.wardenFilterUrgency.addEventListener('change', triggerFilter);
  }

  async function loadWardenDashboard() {
    await updateWardenStats();
    await window.ComplaintsModule.renderWardenComplaints(dom.wardenComplaintsContainer);
  }

  async function updateWardenStats() {
    const complaints = await window.ComplaintsModule.getComplaintsState();
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
      btn.addEventListener('click', async (e) => {
        dayButtons.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        
        const selectedDay = target.dataset.day;
        await window.MenuModule.renderAdminMenuEditor(selectedDay, dom.adminMenuFormContainer);
      });
    });
  }

  async function loadAdminDashboard() {
    const complaints = await window.ComplaintsModule.getComplaintsState();
    
    // We get pools directly from Supabase
    let activePools = 0;
    try {
      const { data } = await window.supabaseClient
        .from('polls')
        .select('status')
        .match({ status: 'Active' });
      activePools = data ? data.length : 0;
    } catch(err) {
      console.error(err);
    }
    
    const totalComp = complaints.length;
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
      setTimeout(async () => {
        await updateWardenStats();
      }, 200);
    }
  });
})();
