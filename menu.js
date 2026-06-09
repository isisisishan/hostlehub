// Mess Menu Module (Global Namespace)
(function() {
  // Get current state from localStorage or seed it
  function getMenuState() {
    let menu = localStorage.getItem('hostelhub_menu');
    if (!menu) {
      localStorage.setItem('hostelhub_menu', JSON.stringify(window.DEFAULT_MENU));
      menu = JSON.stringify(window.DEFAULT_MENU);
    }
    return JSON.parse(menu);
  }

  function saveMenuState(menu) {
    localStorage.setItem('hostelhub_menu', JSON.stringify(menu));
  }

  // Get feedback state (upvotes/downvotes)
  function getMenuFeedback() {
    let feedback = localStorage.getItem('hostelhub_menu_feedback');
    if (!feedback) {
      feedback = JSON.stringify({});
      localStorage.setItem('hostelhub_menu_feedback', feedback);
    }
    return JSON.parse(feedback);
  }

  function saveMenuFeedback(feedback) {
    localStorage.setItem('hostelhub_menu_feedback', JSON.stringify(feedback));
  }

  // Render the today's menu layout in the student/main views
  function renderTodayMenu(day, container, showFeedback = true) {
    if (!container) return;
    const menu = getMenuState();
    const feedback = getMenuFeedback();
    const dayMenu = menu[day];

    if (!dayMenu) {
      container.innerHTML = `<p class="text-secondary">No menu set for ${day}.</p>`;
      return;
    }

    // Determine which meal is active based on current time (rough estimation)
    const currentHour = new Date().getHours();
    let activeMeal = 'Breakfast';
    if (currentHour >= 10 && currentHour < 15) activeMeal = 'Lunch';
    else if (currentHour >= 15 && currentHour < 18) activeMeal = 'Snacks';
    else if (currentHour >= 18 || currentHour < 4) activeMeal = 'Dinner';

    let html = `
      <div class="menu-title-row">
        <h2 style="font-family: var(--font-title); font-size: 1.2rem; font-weight: 700;">Mess Menu</h2>
        <span class="menu-day-badge">${day}</span>
      </div>
      <div class="meal-sections">
    `;

    for (const [mealName, mealData] of Object.entries(dayMenu)) {
      const isActive = mealName === activeMeal;
      const feedbackKey = `${day}_${mealName}`;
      const votes = feedback[feedbackKey] || { up: 0, down: 0, userVote: null };

      html += `
        <div class="meal-card ${isActive ? 'active-meal' : ''}">
          <div class="meal-header">
            <span class="meal-name">
              ${mealName === 'Breakfast' ? '🍳' : mealName === 'Lunch' ? '🍛' : mealName === 'Snacks' ? '☕' : '🍲'}
              ${mealName}
            </span>
            <span class="meal-time">${mealData.time}</span>
          </div>
          <div class="meal-items-list">
            ${mealData.items.map(item => {
              const isNonVeg = item.toLowerCase().includes('chicken') || item.toLowerCase().includes('egg') || item.toLowerCase().includes('fish');
              return `
                <span class="dish-pill">
                  <span class="dish-tag ${isNonVeg ? 'nonveg' : 'veg'}"></span>
                  ${item}
                </span>
              `;
            }).join('')}
          </div>
          ${showFeedback ? `
            <div class="meal-feedback">
              <button class="feedback-btn ${votes.userVote === 'up' ? 'upvoted' : ''}" data-day="${day}" data-meal="${mealName}" data-vote="up">
                👍 <span class="up-count">${votes.up}</span>
              </button>
              <button class="feedback-btn ${votes.userVote === 'down' ? 'downvoted' : ''}" data-day="${day}" data-meal="${mealName}" data-vote="down">
                👎 <span class="down-count">${votes.down}</span>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Add click handlers for feedback buttons
    if (showFeedback) {
      container.querySelectorAll('.feedback-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetBtn = e.currentTarget;
          const day = targetBtn.dataset.day;
          const meal = targetBtn.dataset.meal;
          const voteType = targetBtn.dataset.vote;
          handleVote(day, meal, voteType);
          renderTodayMenu(day, container, showFeedback);
        });
      });
    }
  }

  // Handle voting click
  function handleVote(day, meal, voteType) {
    const feedback = getMenuFeedback();
    const feedbackKey = `${day}_${meal}`;
    
    if (!feedback[feedbackKey]) {
      feedback[feedbackKey] = { up: 0, down: 0, userVote: null };
    }
    
    const current = feedback[feedbackKey];
    
    if (current.userVote === voteType) {
      // Undo vote
      current[voteType]--;
      current.userVote = null;
    } else {
      // Change or add vote
      if (current.userVote) {
        current[current.userVote]--;
      }
      current[voteType]++;
      current.userVote = voteType;
    }
    
    feedback[feedbackKey] = current;
    saveMenuFeedback(feedback);
  }

  // Render weekly menu inside the modal table
  function renderWeeklyMenuTable(container) {
    if (!container) return;
    const menu = getMenuState();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let html = `
      <table class="menu-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Snacks</th>
            <th>Dinner</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    days.forEach(day => {
      const dayMenu = menu[day] || { Breakfast: {items: []}, Lunch: {items: []}, Snacks: {items: []}, Dinner: {items: []} };
      html += `
        <tr>
          <td style="font-weight: 700; color: var(--accent-purple);">${day}</td>
          <td>
            <ul>
              ${dayMenu.Breakfast.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul>
              ${dayMenu.Lunch.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul>
              ${dayMenu.Snacks.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </td>
          <td>
            <ul>
              ${dayMenu.Dinner.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </td>
        </tr>
      `;
    });
    
    html += `
        </tbody>
      </table>
    `;
    container.innerHTML = html;
  }

  // Render editable menu editor inside the Admin section
  function renderAdminMenuEditor(day, container) {
    if (!container) return;
    const menu = getMenuState();
    const dayMenu = menu[day];

    let html = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-family: var(--font-title); margin-bottom: 12px;">Edit Mess Menu: ${day}</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px;">
          Update the dishes separated by commas. Changes will reflect instantly on the student portal.
        </p>
      </div>
      <form id="menu-editor-form">
    `;

    for (const [mealName, mealData] of Object.entries(dayMenu)) {
      html += `
        <div class="form-group">
          <label>${mealName} Items (comma-separated)</label>
          <input type="text" class="form-control" name="${mealName}" value="${mealData.items.join(', ')}">
        </div>
      `;
    }

    html += `
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save ${day} Menu</button>
        </div>
      </form>
    `;

    container.innerHTML = html;

    // Add submit listener
    const form = container.querySelector('#menu-editor-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updatedMenu = getMenuState();

      for (const [mealName, mealData] of Object.entries(updatedMenu[day])) {
        const itemsString = formData.get(mealName) || '';
        mealData.items = itemsString.split(',').map(item => item.trim()).filter(item => item !== '');
      }

      saveMenuState(updatedMenu);
      
      // Trigger toast notification
      const toast = document.getElementById('toast-notification');
      if (toast) {
        toast.querySelector('.toast-msg').textContent = `Successfully updated ${day} Menu!`;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
      }
    });
  }

  // Export to global scope
  window.MenuModule = {
    getMenuState,
    saveMenuState,
    getMenuFeedback,
    saveMenuFeedback,
    renderTodayMenu,
    renderWeeklyMenuTable,
    renderAdminMenuEditor
  };
})();
