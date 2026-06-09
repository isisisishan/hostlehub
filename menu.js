// Mess Menu Module (Supabase Connected)
(function() {
  // Get current state from Supabase database
  async function getMenuState() {
    try {
      const { data, error } = await window.supabaseClient
        .from('menu_meals')
        .select('*');
        
      if (error || !data || data.length === 0) {
        console.warn("Could not load menu from Supabase (or table is empty). Falling back to static DEFAULT_MENU.", error);
        return window.DEFAULT_MENU;
      }

      // Reconstruct the nested structure: menu[day][meal_type] = { time, items }
      const menu = {};
      data.forEach(row => {
        if (!menu[row.day]) menu[row.day] = {};
        menu[row.day][row.meal_type] = {
          time: row.serving_time,
          items: row.items
        };
      });
      return menu;
    } catch (e) {
      console.error("Failed to fetch menu state:", e);
      return window.DEFAULT_MENU;
    }
  }

  // Update a specific meal's items in Supabase
  async function saveMenuMealState(day, mealType, itemsArray) {
    const { error } = await window.supabaseClient
      .from('menu_meals')
      .update({ items: itemsArray })
      .match({ day: day, meal_type: mealType });

    if (error) {
      console.error("Error updating menu meal in Supabase:", error);
      return false;
    }
    return true;
  }

  // Get ratings from Supabase feedback table
  async function getMenuFeedback() {
    try {
      const { data, error } = await window.supabaseClient
        .from('menu_feedback')
        .select('*');
        
      if (error) throw error;
      
      const feedback = {};
      data.forEach(row => {
        const key = `${row.day}_${row.meal_type}`;
        
        // Retrieve this specific user's vote history from localStorage to style buttons correctly
        const localVoteKey = `hostelhub_vote_${row.day}_${row.meal_type}`;
        const userVote = localStorage.getItem(localVoteKey);

        feedback[key] = {
          up: row.upvotes,
          down: row.downvotes,
          userVote: userVote // 'up', 'down', or null
        };
      });
      return feedback;
    } catch (e) {
      console.error("Failed to load feedback from Supabase:", e);
      return {};
    }
  }

  // Render the today's menu layout in the student/main views
  async function renderTodayMenu(day, container, showFeedback = true) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Loading menu from cloud database...</div>`;
    
    const menu = await getMenuState();
    const feedback = await getMenuFeedback();
    const dayMenu = menu[day];

    if (!dayMenu) {
      container.innerHTML = `<p class="text-secondary">No menu set for ${day}.</p>`;
      return;
    }

    // Determine which meal is active based on current time
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
        btn.addEventListener('click', async (e) => {
          const targetBtn = e.currentTarget;
          const day = targetBtn.dataset.day;
          const meal = targetBtn.dataset.meal;
          const voteType = targetBtn.dataset.vote;
          
          targetBtn.disabled = true; // prevent double taps during async ops
          await handleVote(day, meal, voteType);
          await renderTodayMenu(day, container, showFeedback);
        });
      });
    }
  }

  // Handle voting write operation in Supabase
  async function handleVote(day, meal, voteType) {
    // 1. Fetch current votes first
    const { data } = await window.supabaseClient
      .from('menu_feedback')
      .select('*')
      .match({ day, meal_type: meal })
      .maybeSingle();

    let upvotes = data ? data.upvotes : 0;
    let downvotes = data ? data.downvotes : 0;

    // 2. Process local voter check via localStorage
    const localVoteKey = `hostelhub_vote_${day}_${meal}`;
    const pastVote = localStorage.getItem(localVoteKey); // 'up', 'down', or null

    if (pastVote === voteType) {
      // Clicked same button -> Undo vote
      if (voteType === 'up') upvotes = Math.max(0, upvotes - 1);
      if (voteType === 'down') downvotes = Math.max(0, downvotes - 1);
      localStorage.removeItem(localVoteKey);
    } else {
      // Undo past different vote if exists
      if (pastVote === 'up') upvotes = Math.max(0, upvotes - 1);
      if (pastVote === 'down') downvotes = Math.max(0, downvotes - 1);

      // Add new vote
      if (voteType === 'up') upvotes++;
      if (voteType === 'down') downvotes++;
      localStorage.setItem(localVoteKey, voteType);
    }

    // 3. Upsert to Supabase
    await window.supabaseClient
      .from('menu_feedback')
      .upsert({
        day: day,
        meal_type: meal,
        upvotes: upvotes,
        downvotes: downvotes
      }, { onConflict: 'day,meal_type' });
  }

  // Render weekly menu inside the modal table
  async function renderWeeklyMenuTable(container) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Fetching weekly menu schedule...</div>`;
    
    const menu = await getMenuState();
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
  async function renderAdminMenuEditor(day, container) {
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">Loading edit form...</div>`;
    
    const menu = await getMenuState();
    const dayMenu = menu[day];

    if (!dayMenu) {
      container.innerHTML = `<p class="text-secondary">Could not fetch menu details for ${day}.</p>`;
      return;
    }

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
          <button type="submit" class="btn btn-primary" id="btn-save-admin-menu" style="flex: 1;">Save ${day} Menu</button>
        </div>
      </form>
    `;

    container.innerHTML = html;

    // Add submit listener
    const form = container.querySelector('#menu-editor-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const saveBtn = form.querySelector('#btn-save-admin-menu');
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving to database...";

      const formData = new FormData(form);

      for (const mealName of ['Breakfast', 'Lunch', 'Snacks', 'Dinner']) {
        const itemsString = formData.get(mealName) || '';
        const itemsArray = itemsString.split(',').map(item => item.trim()).filter(item => item !== '');
        await saveMenuMealState(day, mealName, itemsArray);
      }
      
      saveBtn.disabled = false;
      saveBtn.textContent = `Save ${day} Menu`;

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
    renderTodayMenu,
    renderWeeklyMenuTable,
    renderAdminMenuEditor
  };
})();
