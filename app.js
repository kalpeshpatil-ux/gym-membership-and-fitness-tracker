/**
 * =====================================================================
 *  FitZone Gym Management & Fitness Tracker - Application Logic (OOP)
 * =====================================================================
 *  Demonstrating OOP Pillars in ES6 JavaScript mirroring C++ Classes:
 *   - Abstraction     : Base Person & MembershipPlan contracts
 *   - Inheritance     : Member & Trainer derive from Person
 *   - Polymorphism    : Dynamic plan fees, discounts, and polymorphic getters
 *   - Encapsulation   : Validated member mutations and scoped state
 *   - Composition     : Member has-a FitnessTracker; FitnessTracker has-a Workouts
 */

// -------------------------------------------------------------
// 1. Membership Plan Classes (Abstraction & Inheritance)
// -------------------------------------------------------------
class MembershipPlan {
  constructor(name, monthlyFee, benefits, ptDiscount) {
    this.name = name;
    this.monthlyFee = monthlyFee;
    this.benefits = benefits;
    this.ptDiscount = ptDiscount;
  }
}

class BasicPlan extends MembershipPlan {
  constructor() {
    super("Basic", 1000, "Gym floor access (6am - 10am)", 0);
  }
}

class PremiumPlan extends MembershipPlan {
  constructor() {
    super("Premium", 2000, "Full-day access + group classes", 10);
  }
}

class PlatinumPlan extends MembershipPlan {
  constructor() {
    super("Platinum", 3500, "Full-day access + classes + sauna + diet plan", 25);
  }
}

function createPlan(choice) {
  const c = parseInt(choice, 10);
  if (c === 1) return new BasicPlan();
  if (c === 2) return new PremiumPlan();
  return new PlatinumPlan();
}

// -------------------------------------------------------------
// 2. Workout & Fitness Tracker Classes (Composition)
// -------------------------------------------------------------
class Workout {
  constructor(exercise, durationMin, calories, date = null) {
    this.exercise = exercise;
    this.durationMin = durationMin;
    this.calories = Math.round(calories * 10) / 10;
    this.date = date || new Date().toISOString().split("T")[0];
  }
}

const EXERCISE_METS = {
  1: { name: "Running", met: 9.8, icon: "🏃" },
  2: { name: "Cycling", met: 7.5, icon: "🚴" },
  3: { name: "Walking", met: 3.5, icon: "🚶" },
  4: { name: "Swimming", met: 8.0, icon: "🏊" },
  5: { name: "Weightlifting", met: 6.0, icon: "🏋️" },
  6: { name: "Yoga", met: 2.5, icon: "🧘" }
};

class FitnessTracker {
  constructor(heightCm = 170.0, initialWeight = 70.0, weightHistory = null, workouts = null) {
    this.heightCm = heightCm;
    this.weightHistory = weightHistory && weightHistory.length ? [...weightHistory] : [initialWeight];
    this.workouts = workouts ? workouts.map(w => new Workout(w.exercise, w.durationMin, w.calories, w.date)) : [];
  }

  getCurrentWeight() {
    return this.weightHistory[this.weightHistory.length - 1];
  }

  updateWeight(newWeight) {
    this.weightHistory.push(Math.round(newWeight * 10) / 10);
  }

  calculateBMI() {
    const meters = this.heightCm / 100.0;
    const bmi = this.getCurrentWeight() / (meters * meters);
    return Math.round(bmi * 10) / 10;
  }

  static bmiCategory(bmi) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25.0) return "Normal";
    if (bmi < 30.0) return "Overweight";
    return "Obese";
  }

  // Calories = MET * weight(kg) * (minutes / 60)
  logWorkout(exerciseChoice, minutes, customDate = null) {
    const ex = EXERCISE_METS[exerciseChoice] || EXERCISE_METS[1];
    const weight = this.getCurrentWeight();
    const cals = ex.met * weight * (minutes / 60.0);
    const workout = new Workout(ex.name, minutes, cals, customDate);
    this.workouts.unshift(workout); // prepend latest
    return workout;
  }

  totalCalories() {
    return Math.round(this.workouts.reduce((sum, w) => sum + w.calories, 0) * 10) / 10;
  }

  totalMinutes() {
    return this.workouts.reduce((sum, w) => sum + w.durationMin, 0);
  }
}

// -------------------------------------------------------------
// 3. Person, Trainer, Member Hierarchy (Inheritance)
// -------------------------------------------------------------
class Person {
  constructor(id, name, age, phone) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.phone = phone;
  }
}

class Trainer extends Person {
  constructor(id, name, age, phone, specialization, hourlyRate) {
    super(id, name, age, phone);
    this.specialization = specialization;
    this.hourlyRate = hourlyRate;
  }
}

class Member extends Person {
  constructor(id, name, age, phone, height, weight, planChoice, months, joinDate = null, expiryDate = null, totalFeesPaid = null, trainerId = 0, weightHistory = null, workouts = null) {
    super(id, name, age, phone);
    this.plan = createPlan(planChoice);
    this.tracker = new FitnessTracker(height, weight, weightHistory, workouts);
    
    const now = new Date();
    this.joinDate = joinDate ? new Date(joinDate) : now;
    
    if (expiryDate) {
      this.expiryDate = new Date(expiryDate);
    } else {
      const exp = new Date(now.getTime());
      exp.setDate(exp.getDate() + (months * 30));
      this.expiryDate = exp;
    }

    this.totalFeesPaid = totalFeesPaid !== null ? totalFeesPaid : (this.plan.monthlyFee * months);
    this.trainerId = trainerId || 0;
  }

  isActive() {
    return new Date() <= this.expiryDate;
  }

  daysLeft() {
    const diffMs = this.expiryDate - new Date();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  renew(planChoice, months) {
    this.plan = createPlan(planChoice);
    const base = this.isActive() ? new Date(this.expiryDate.getTime()) : new Date();
    base.setDate(base.getDate() + (months * 30));
    this.expiryDate = base;
    this.totalFeesPaid += this.plan.monthlyFee * months;
  }
}

// -------------------------------------------------------------
// 4. Central Gym System & State Management
// -------------------------------------------------------------
class GymSystem {
  constructor(gymName = "FitZone Fitness Club") {
    this.gymName = gymName;
    this.members = [];
    this.trainers = [];
    this.nextMemberId = 1001;
    this.nextTrainerId = 1;
    this.loadState();
  }

  saveState() {
    const data = {
      nextMemberId: this.nextMemberId,
      nextTrainerId: this.nextTrainerId,
      trainers: this.trainers,
      members: this.members.map(m => ({
        id: m.id,
        name: m.name,
        age: m.age,
        phone: m.phone,
        height: m.tracker.heightCm,
        weight: m.tracker.getCurrentWeight(),
        planName: m.plan.name,
        joinDate: m.joinDate.toISOString(),
        expiryDate: m.expiryDate.toISOString(),
        totalFeesPaid: m.totalFeesPaid,
        trainerId: m.trainerId,
        weightHistory: m.tracker.weightHistory,
        workouts: m.tracker.workouts
      }))
    };
    try {
      localStorage.setItem("fitzone_gym_db", JSON.stringify(data));
    } catch (e) {
      console.warn("Storage quota or error:", e);
    }
  }

  loadState() {
    const raw = localStorage.getItem("fitzone_gym_db");
    if (!raw) {
      this.seedInitialData();
      return;
    }
    try {
      const data = JSON.parse(raw);
      this.nextMemberId = data.nextMemberId || 1001;
      this.nextTrainerId = data.nextTrainerId || 1;

      this.trainers = (data.trainers || []).map(t => new Trainer(t.id, t.name, t.age, t.phone, t.specialization, t.hourlyRate));

      this.members = (data.members || []).map(m => {
        let pChoice = 2;
        if (m.planName === "Basic") pChoice = 1;
        else if (m.planName === "Platinum") pChoice = 3;

        return new Member(
          m.id, m.name, m.age, m.phone, m.height, m.weight,
          pChoice, 1, m.joinDate, m.expiryDate, m.totalFeesPaid,
          m.trainerId, m.weightHistory, m.workouts
        );
      });
    } catch (err) {
      console.error("Failed to parse storage, reseeding demo data", err);
      this.seedInitialData();
    }
  }

  seedInitialData() {
    this.trainers = [
      new Trainer(1, "Vikram Singh", 28, "9876543210", "Strength & Conditioning", 600),
      new Trainer(2, "Anjali Mehta", 26, "9876543211", "Yoga & Mobility", 500),
      new Trainer(3, "Rahul Verma", 32, "9876543212", "Cardio & HIIT", 450)
    ];
    this.nextTrainerId = 4;

    // Seed realistic demo members
    const m1 = new Member(1001, "Aarav Patel", 22, "9123456780", 175, 72.0, 3, 6); // Platinum
    m1.trainerId = 1;
    m1.tracker.weightHistory = [76.0, 74.5, 73.0, 72.0];
    m1.tracker.logWorkout(1, 45, "2026-10-18"); // Running
    m1.tracker.logWorkout(5, 60, "2026-10-19"); // Weightlifting
    m1.tracker.logWorkout(4, 40, "2026-10-21"); // Swimming

    const m2 = new Member(1002, "Sneha Kulkarni", 24, "9123456781", 162, 58.0, 2, 3); // Premium
    m2.trainerId = 2;
    m2.tracker.weightHistory = [60.0, 59.0, 58.0];
    m2.tracker.logWorkout(6, 45, "2026-10-19"); // Yoga
    m2.tracker.logWorkout(2, 30, "2026-10-20"); // Cycling

    const m3 = new Member(1003, "Rohan Deshmukh", 29, "9123456782", 180, 84.0, 1, 2); // Basic
    m3.tracker.weightHistory = [87.0, 85.5, 84.0];
    m3.tracker.logWorkout(3, 50, "2026-10-20"); // Walking
    m3.tracker.logWorkout(5, 45, "2026-10-21"); // Lifting

    const m4 = new Member(1004, "Kavya Iyer", 27, "9123456783", 168, 64.0, 3, 12); // Platinum
    m4.trainerId = 1;
    m4.tracker.weightHistory = [67.0, 65.5, 64.0];
    m4.tracker.logWorkout(1, 40, "2026-10-21");
    m4.tracker.logWorkout(2, 45, "2026-10-21");

    const m5 = new Member(1005, "Tanvi Joshi", 21, "9123456784", 165, 55.0, 2, 1); // Expired demo
    m5.expiryDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    m5.tracker.logWorkout(6, 30, "2026-10-10");

    this.members = [m1, m2, m3, m4, m5];
    this.nextMemberId = 1006;
    this.saveState();
  }

  findMember(id) {
    return this.members.find(m => m.id === parseInt(id, 10)) || null;
  }

  findTrainer(id) {
    return this.trainers.find(t => t.id === parseInt(id, 10)) || null;
  }

  addMember(name, age, phone, height, weight, planChoice, months) {
    const member = new Member(this.nextMemberId++, name, age, phone, height, weight, planChoice, months);
    this.members.push(member);
    this.saveState();
    return member;
  }

  renewMember(id, planChoice, months) {
    const member = this.findMember(id);
    if (!member) return null;
    member.renew(planChoice, months);
    this.saveState();
    return member;
  }

  removeMember(id) {
    const idx = this.members.findIndex(m => m.id === parseInt(id, 10));
    if (idx !== -1) {
      this.members.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  addTrainer(name, age, phone, spec, rate) {
    const trainer = new Trainer(this.nextTrainerId++, name, age, phone, spec, rate);
    this.trainers.push(trainer);
    this.saveState();
    return trainer;
  }

  assignTrainer(memberId, trainerId) {
    const member = this.findMember(memberId);
    const trainer = this.findTrainer(trainerId);
    if (member && trainer) {
      member.trainerId = trainer.id;
      this.saveState();
      return { member, trainer };
    }
    return null;
  }

  getLeaderboard() {
    return [...this.members].sort((a, b) => b.tracker.totalCalories() - a.tracker.totalCalories());
  }

  getTotalRevenue() {
    return this.members.reduce((sum, m) => sum + m.totalFeesPaid, 0);
  }

  getTotalCalories() {
    return Math.round(this.members.reduce((sum, m) => sum + m.tracker.totalCalories(), 0));
  }

  generateTextReport() {
    const nowStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    let text = `=======================================================================\n`;
    text += `       FITZONE FITNESS CLUB - ADMINISTRATIVE AUDIT & REVENUE REPORT    \n`;
    text += `       Generated On: ${nowStr} | System Architecture: C++ / OOP Model \n`;
    text += `=======================================================================\n\n`;

    text += `--- REVENUE & METRICS SUMMARY ---\n`;
    const activeCount = this.members.filter(m => m.isActive()).length;
    text += `Total Registered Members : ${this.members.length}\n`;
    text += `Active Subscriptions     : ${activeCount}\n`;
    text += `Expired Subscriptions    : ${this.members.length - activeCount}\n`;
    text += `Total Certified Trainers : ${this.trainers.length}\n`;
    text += `Gross Revenue Collected  : Rs. ${this.getTotalRevenue().toLocaleString("en-IN")}\n`;
    text += `Total Calories Burned    : ${this.getTotalCalories().toLocaleString("en-IN")} kcal\n\n`;

    text += `-----------------------------------------------------------------------\n`;
    text += `ID   | Name                 | Plan     | Status  | Workouts | Calories | BMI \n`;
    text += `-----------------------------------------------------------------------\n`;
    for (const m of this.members) {
      const status = m.isActive() ? "Active " : "EXPIRED";
      text += `${String(m.id).padEnd(4)} | ${m.name.padEnd(20)} | ${m.plan.name.padEnd(8)} | ${status} | ` +
              `${String(m.tracker.workouts.length).padEnd(8)} | ${String(m.tracker.totalCalories()).padEnd(8)} | ${m.tracker.calculateBMI()}\n`;
    }
    text += `-----------------------------------------------------------------------\n`;
    text += `END OF AUDIT REPORT - FitZone Management System\n`;
    return text;
  }

  generateCsv() {
    let csv = "Member_ID,Full_Name,Age,Phone,Height_cm,Current_Weight_kg,BMI,BMI_Category,Plan,Status,Days_Left,Total_Fees_Paid_INR,Total_Workouts,Total_Calories_Burned,Trainer_Assigned\n";
    for (const m of this.members) {
      const trainer = this.findTrainer(m.trainerId);
      const trainerName = trainer ? trainer.name : "None";
      csv += `${m.id},"${m.name}",${m.age},"${m.phone}",${m.tracker.heightCm},${m.tracker.getCurrentWeight()},${m.tracker.calculateBMI()},"${FitnessTracker.bmiCategory(m.tracker.calculateBMI())}","${m.plan.name}","${m.isActive() ? 'Active' : 'Expired'}",${m.daysLeft()},${m.totalFeesPaid},${m.tracker.workouts.length},${m.tracker.totalCalories()},"${trainerName}"\n`;
    }
    return csv;
  }
}

// -------------------------------------------------------------
// 5. UI Controller & Interactive Elements
// -------------------------------------------------------------
const gym = new GymSystem();
let weightChartInstance = null;
let revenueChartInstance = null;
let statusChartInstance = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupEventListeners();
  renderAllViews();
});

function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> <span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 3200);
}

function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add("active");

      // Redraw charts if entering relevant tabs
      if (btn.dataset.tab === "tab-analytics") renderAnalyticsCharts();
      if (btn.dataset.tab === "tab-tracker") updateProgressView();
    });
  });
}

function renderAllViews() {
  updateHeaderStats();
  renderMembersGrid();
  renderLeaderboard();
  renderTrainersGrid();
  populateMemberSelectDropdowns();
  updateCalorieLiveMeter();
  updateProgressView();
  renderReportPreview();
}

function updateHeaderStats() {
  const activeMembers = gym.members.filter(m => m.isActive()).length;
  document.getElementById("stat-active-members").textContent = `${activeMembers} / ${gym.members.length}`;
  document.getElementById("stat-total-trainers").textContent = `${gym.trainers.length}`;
  document.getElementById("stat-total-calories").textContent = `${gym.getTotalCalories().toLocaleString("en-IN")} kcal`;
  document.getElementById("stat-total-revenue").textContent = `₹${gym.getTotalRevenue().toLocaleString("en-IN")}`;
}

// -------------------------------------------------------------
// Render Members Directory Grid
// -------------------------------------------------------------
function renderMembersGrid() {
  const container = document.getElementById("members-grid-container");
  const query = (document.getElementById("member-search-input").value || "").toLowerCase();
  const planFilter = document.getElementById("member-plan-filter").value;
  const statusFilter = document.getElementById("member-status-filter").value;

  const filtered = gym.members.filter(m => {
    const matchesQuery = m.name.toLowerCase().includes(query) || String(m.id).includes(query);
    const matchesPlan = planFilter === "ALL" || m.plan.name === planFilter;
    const matchesStatus = statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && m.isActive()) ||
      (statusFilter === "EXPIRED" && !m.isActive());
    return matchesQuery && matchesPlan && matchesStatus;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">No members found matching your search criteria.</p>
        <button id="btn-reset-filters" class="btn btn-secondary btn-sm">Clear Search & Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById("btn-reset-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        document.getElementById("member-search-input").value = "";
        document.getElementById("member-plan-filter").value = "ALL";
        document.getElementById("member-status-filter").value = "ALL";
        renderMembersGrid();
      });
    }
    return;
  }

  container.innerHTML = filtered.map(m => {
    const active = m.isActive();
    const trainer = gym.findTrainer(m.trainerId);
    const trainerName = trainer ? trainer.name : "None assigned";
    const statusClass = active ? "status-active" : "status-expired";
    const statusText = active ? `Active (${m.daysLeft()}d left)` : "Expired";

    return `
      <div class="member-card plan-${m.plan.name}">
        <div class="member-header">
          <div>
            <span class="member-id">#${m.id}</span>
            <div class="member-name">${m.name}</div>
          </div>
          <span class="plan-badge badge-${m.plan.name}">${m.plan.name}</span>
        </div>
        <div class="member-details-list">
          <div class="detail-row">
            <span>Status:</span>
            <span class="status-pill ${statusClass}">● ${statusText}</span>
          </div>
          <div class="detail-row">
            <span>BMI &amp; Category:</span>
            <strong>${m.tracker.calculateBMI()} (${FitnessTracker.bmiCategory(m.tracker.calculateBMI())})</strong>
          </div>
          <div class="detail-row">
            <span>Workouts Logged:</span>
            <strong>${m.tracker.workouts.length} sessions (${m.tracker.totalCalories()} kcal)</strong>
          </div>
          <div class="detail-row">
            <span>Trainer:</span>
            <strong style="color: var(--cyan-accent);">${trainerName}</strong>
          </div>
        </div>
        <div class="member-card-footer">
          <button class="btn btn-secondary btn-sm btn-view-pass" data-id="${m.id}" title="View & Print Digital Membership Card">
            <span>🪪</span> Pass
          </button>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary btn-sm btn-renew-modal" data-id="${m.id}" title="Renew Subscription">
              Renew
            </button>
            <button class="btn btn-cyan btn-sm btn-assign-modal" data-id="${m.id}" title="Assign Personal Trainer">
              Trainer
            </button>
            <button class="btn btn-secondary btn-sm btn-delete-member" data-id="${m.id}" style="color: var(--rose-accent);" title="Remove Member">
              ✕
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  attachMemberCardActionListeners();
}

function attachMemberCardActionListeners() {
  document.querySelectorAll(".btn-view-pass").forEach(btn => {
    btn.addEventListener("click", () => openMemberPassModal(btn.dataset.id));
  });
  document.querySelectorAll(".btn-renew-modal").forEach(btn => {
    btn.addEventListener("click", () => openRenewModal(btn.dataset.id));
  });
  document.querySelectorAll(".btn-assign-modal").forEach(btn => {
    btn.addEventListener("click", () => openAssignTrainerModal(btn.dataset.id));
  });
  document.querySelectorAll(".btn-delete-member").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const m = gym.findMember(id);
      if (m && confirm(`Are you sure you want to remove ${m.name} (#${m.id}) from the gym roster?`)) {
        gym.removeMember(id);
        renderAllViews();
        showToast(`Member #${id} removed successfully.`, "info");
      }
    });
  });
}

// -------------------------------------------------------------
// Leaderboard & Trainers Rendering
// -------------------------------------------------------------
function renderLeaderboard() {
  const container = document.getElementById("leaderboard-container");
  const sorted = gym.getLeaderboard();

  container.innerHTML = sorted.map((m, idx) => {
    const rank = idx + 1;
    let badgeClass = "rank-other";
    if (rank === 1) badgeClass = "rank-1";
    else if (rank === 2) badgeClass = "rank-2";
    else if (rank === 3) badgeClass = "rank-3";

    return `
      <div class="leaderboard-item">
        <div class="rank-badge ${badgeClass}">${rank}</div>
        <div class="leaderboard-user">
          <div class="name">${m.name} <span class="plan-badge badge-${m.plan.name}" style="font-size: 0.65rem; padding: 2px 6px;">${m.plan.name}</span></div>
          <div class="sub">#${m.id} • ${m.tracker.workouts.length} total sessions logged • Current Weight: ${m.tracker.getCurrentWeight()} kg</div>
        </div>
        <div class="leaderboard-score">${m.tracker.totalCalories()} kcal</div>
      </div>
    `;
  }).join("");
}

function renderTrainersGrid() {
  const container = document.getElementById("trainers-grid-container");
  container.innerHTML = gym.trainers.map(t => {
    const assignedCount = gym.members.filter(m => m.trainerId === t.id).length;
    return `
      <div class="trainer-card">
        <div class="trainer-avatar">🥊</div>
        <div class="trainer-name">${t.name}</div>
        <div class="trainer-spec">${t.specialization}</div>
        <div class="trainer-rate-badge">Rate: ₹${t.hourlyRate} / hour</div>
        <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 14px;">
          Age: ${t.age} • Phone: ${t.phone}<br>
          <strong style="color: var(--emerald-accent);">${assignedCount} active assigned members</strong>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------------------------------------------------
// Workout Logging & Biometrics Controller
// -------------------------------------------------------------
function populateMemberSelectDropdowns() {
  const workoutSel = document.getElementById("workout-member-select");
  const weightSel = document.getElementById("weight-member-select");
  const progressSel = document.getElementById("progress-member-select");

  const opts = gym.members.map(m => `<option value="${m.id}">${m.name} (#${m.id})</option>`).join("");
  workoutSel.innerHTML = opts;
  weightSel.innerHTML = opts;
  progressSel.innerHTML = opts;
}

function updateCalorieLiveMeter() {
  const duration = parseInt(document.getElementById("workout-duration-range").value, 10);
  document.getElementById("duration-display").textContent = `${duration} mins`;

  const memberId = document.getElementById("workout-member-select").value;
  const member = gym.findMember(memberId);
  const weight = member ? member.tracker.getCurrentWeight() : 70;

  const checkedRadio = document.querySelector('input[name="exercise"]:checked');
  const met = checkedRadio ? parseFloat(checkedRadio.dataset.met) : 9.8;

  const cals = met * weight * (duration / 60.0);
  document.getElementById("estimated-calories-burn").textContent = `${cals.toFixed(1)} kcal`;
}

function updateProgressView() {
  const select = document.getElementById("progress-member-select");
  if (!select) return;
  const memberId = select.value;
  const member = gym.findMember(memberId);
  if (!member) return;

  const pills = document.getElementById("progress-summary-pills");
  const bmi = member.tracker.calculateBMI();
  const cat = FitnessTracker.bmiCategory(bmi);
  const weightChange = member.tracker.weightHistory.length > 1
    ? (member.tracker.getCurrentWeight() - member.tracker.weightHistory[0]).toFixed(1)
    : "0.0";

  pills.innerHTML = `
    <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
      <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Current Weight</div>
      <div style="font-size: 1.2rem; font-weight: 700; color: var(--gold-accent);">${member.tracker.getCurrentWeight()} kg</div>
      <div style="font-size: 0.72rem; color: ${weightChange < 0 ? 'var(--emerald-accent)' : 'var(--text-muted)'};">${weightChange} kg total change</div>
    </div>
    <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
      <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">BMI Metric</div>
      <div style="font-size: 1.2rem; font-weight: 700; color: var(--cyan-accent);">${bmi}</div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">${cat}</div>
    </div>
    <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
      <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Total Calories</div>
      <div style="font-size: 1.2rem; font-weight: 700; color: var(--emerald-accent);">${member.tracker.totalCalories()} kcal</div>
      <div style="font-size: 0.72rem; color: var(--text-muted);">${member.tracker.totalMinutes()} total minutes</div>
    </div>
  `;

  // Render Table
  const tbody = document.getElementById("workout-history-tbody");
  if (!member.tracker.workouts.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: var(--text-muted);">No workouts logged yet.</td></tr>`;
  } else {
    tbody.innerHTML = member.tracker.workouts.slice(0, 10).map(w => `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 8px 12px; font-family: var(--font-mono); font-size: 0.78rem;">${w.date}</td>
        <td style="padding: 8px 12px; font-weight: 600;">${w.exercise}</td>
        <td style="padding: 8px 12px; color: var(--text-muted);">${w.durationMin} mins</td>
        <td style="padding: 8px 12px; text-align: right; color: var(--gold-accent); font-weight: 700;">${w.calories} kcal</td>
      </tr>
    `).join("");
  }

  renderWeightProgressChart(member);
}

function renderWeightProgressChart(member) {
  const canvas = document.getElementById("weight-progress-chart");
  if (!canvas) return;

  const labels = member.tracker.weightHistory.map((_, i) => `Check-in ${i + 1}`);
  const data = member.tracker.weightHistory;

  if (weightChartInstance) weightChartInstance.destroy();

  weightChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `${member.name}'s Weight Progression (kg)`,
        data: data,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.35,
        fill: true,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#fff",
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { family: "Plus Jakarta Sans" } } }
      },
      scales: {
        y: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#94a3b8" }
        },
        x: {
          grid: { color: "rgba(255,255,255,0.06)" },
          ticks: { color: "#94a3b8" }
        }
      }
    }
  });
}

function renderAnalyticsCharts() {
  const planCounts = { Basic: 0, Premium: 0, Platinum: 0 };
  const planRevenue = { Basic: 0, Premium: 0, Platinum: 0 };
  let active = 0, expired = 0;

  for (const m of gym.members) {
    if (m.isActive()) active++; else expired++;
    if (planCounts[m.plan.name] !== undefined) {
      planCounts[m.plan.name]++;
      planRevenue[m.plan.name] += m.totalFeesPaid;
    }
  }

  // 1. Revenue by Plan Doughnut
  const revCanvas = document.getElementById("plan-revenue-chart");
  if (revCanvas) {
    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(revCanvas, {
      type: "doughnut",
      data: {
        labels: ["Basic (₹1,000/mo)", "Premium (₹2,000/mo)", "Platinum (₹3,500/mo)"],
        datasets: [{
          data: [planRevenue.Basic, planRevenue.Premium, planRevenue.Platinum],
          backgroundColor: ["#f59e0b", "#06b6d4", "#8b5cf6"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8" } }
        }
      }
    });
  }

  // 2. Status Breakdown Pie
  const statusCanvas = document.getElementById("status-ratio-chart");
  if (statusCanvas) {
    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(statusCanvas, {
      type: "pie",
      data: {
        labels: ["Active Subscriptions", "Expired Subscriptions"],
        datasets: [{
          data: [active, expired],
          backgroundColor: ["#10b981", "#f43f5e"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#94a3b8" } }
        }
      }
    });
  }

  renderReportPreview();
}

function renderReportPreview() {
  const el = document.getElementById("raw-report-preview");
  if (el) el.textContent = gym.generateTextReport();
}

// -------------------------------------------------------------
// Modals Open / Close Handlers
// -------------------------------------------------------------
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

function openMemberPassModal(id) {
  const member = gym.findMember(id);
  if (!member) return;
  const trainer = gym.findTrainer(member.trainerId);

  document.getElementById("pass-name").textContent = member.name;
  document.getElementById("pass-id").textContent = `MEMBERSHIP ID: #${member.id}`;
  document.getElementById("pass-status").textContent = member.isActive() ? "ACTIVE" : "EXPIRED";
  document.getElementById("pass-status").className = `val ${member.isActive() ? 'status-active' : 'status-expired'}`;
  document.getElementById("pass-expiry").textContent = member.expiryDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  document.getElementById("pass-bmi").textContent = `${member.tracker.calculateBMI()} (${FitnessTracker.bmiCategory(member.tracker.calculateBMI())})`;
  document.getElementById("pass-trainer").textContent = trainer ? trainer.name : "Not assigned";

  const badge = document.getElementById("pass-plan-badge");
  badge.textContent = `${member.plan.name.toUpperCase()} VIP`;
  badge.className = `plan-badge badge-${member.plan.name}`;

  openModal("modal-member-pass");
}

function openRenewModal(id) {
  const member = gym.findMember(id);
  if (!member) return;
  document.getElementById("renew-member-id").value = member.id;
  document.getElementById("renew-member-name-label").textContent = `${member.name} (#${member.id}) — Current Plan: ${member.plan.name}`;
  openModal("modal-renew-member");
}

function openAssignTrainerModal(id) {
  const member = gym.findMember(id);
  if (!member) return;
  document.getElementById("assign-member-id").value = member.id;
  document.getElementById("assign-member-name-label").textContent = `${member.name} (#${member.id}) — Plan: ${member.plan.name}`;

  const sel = document.getElementById("assign-trainer-select");
  sel.innerHTML = gym.trainers.map(t => `<option value="${t.id}">${t.name} (${t.specialization}) — ₹${t.hourlyRate}/hr</option>`).join("");

  const updateDiscountPreview = () => {
    const tid = parseInt(sel.value, 10);
    const trainer = gym.findTrainer(tid);
    if (!trainer) return;
    const disc = member.plan.ptDiscount;
    const effectiveRate = trainer.hourlyRate * (1.0 - disc / 100.0);
    document.getElementById("assign-discount-preview").innerHTML = `
      Plan Privilege: <strong>${disc}% discount</strong> on personal training.<br>
      Standard Rate: ₹${trainer.hourlyRate}/hr &nbsp;➔&nbsp; <strong style="color: var(--emerald-accent);">Effective Rate: ₹${Math.round(effectiveRate)}/hr</strong>
    `;
  };
  sel.onchange = updateDiscountPreview;
  updateDiscountPreview();

  openModal("modal-assign-trainer");
}

// -------------------------------------------------------------
// Form Submissions & Event Listeners
// -------------------------------------------------------------
function setupEventListeners() {
  // Modal Close buttons
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });

  // Top Action Buttons
  document.getElementById("btn-quick-register").addEventListener("click", () => openModal("modal-register-member"));
  document.getElementById("btn-add-member-top").addEventListener("click", () => openModal("modal-register-member"));
  document.getElementById("btn-add-trainer").addEventListener("click", () => openModal("modal-add-trainer"));
  document.getElementById("btn-quick-workout").addEventListener("click", () => {
    document.querySelector('.tab-btn[data-tab="tab-tracker"]').click();
  });
  document.getElementById("btn-quick-export").addEventListener("click", () => {
    document.querySelector('.tab-btn[data-tab="tab-analytics"]').click();
  });

  // Member Search & Filters
  document.getElementById("member-search-input").addEventListener("input", renderMembersGrid);
  document.getElementById("member-plan-filter").addEventListener("change", renderMembersGrid);
  document.getElementById("member-status-filter").addEventListener("change", renderMembersGrid);

  // Workout Duration Range
  document.getElementById("workout-duration-range").addEventListener("input", updateCalorieLiveMeter);
  document.querySelectorAll('input[name="exercise"]').forEach(r => r.addEventListener("change", updateCalorieLiveMeter));
  document.getElementById("workout-member-select").addEventListener("change", updateCalorieLiveMeter);

  // Progress Member Select
  document.getElementById("progress-member-select").addEventListener("change", updateProgressView);

  // Print Pass
  document.getElementById("btn-print-pass").addEventListener("click", () => window.print());

  // Form: Register Member
  document.getElementById("form-register-member").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const age = parseInt(document.getElementById("reg-age").value, 10);
    const phone = document.getElementById("reg-phone").value.trim();
    const height = parseFloat(document.getElementById("reg-height").value);
    const weight = parseFloat(document.getElementById("reg-weight").value);
    const plan = parseInt(document.getElementById("reg-plan").value, 10);
    const months = parseInt(document.getElementById("reg-months").value, 10);

    const newMember = gym.addMember(name, age, phone, height, weight, plan, months);
    closeModal("modal-register-member");
    e.target.reset();
    renderAllViews();
    showToast(`Member #${newMember.id} (${newMember.name}) registered successfully!`);
    openMemberPassModal(newMember.id);
  });

  // Form: Log Workout
  document.getElementById("workout-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const memberId = document.getElementById("workout-member-select").value;
    const member = gym.findMember(memberId);
    if (!member) return;

    if (!member.isActive()) {
      alert("This member's subscription has expired. Please renew first!");
      return;
    }

    const exChoice = parseInt(document.querySelector('input[name="exercise"]:checked').value, 10);
    const mins = parseInt(document.getElementById("workout-duration-range").value, 10);

    const logged = member.tracker.logWorkout(exChoice, mins);
    gym.saveState();
    renderAllViews();
    showToast(`Logged ${logged.exercise} for ${member.name}: ${logged.calories} kcal burned!`);
  });

  // Form: Update Weight
  document.getElementById("update-weight-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const memberId = document.getElementById("weight-member-select").value;
    const member = gym.findMember(memberId);
    if (!member) return;

    const newWeight = parseFloat(document.getElementById("new-weight-input").value);
    member.tracker.updateWeight(newWeight);
    gym.saveState();
    renderAllViews();
    showToast(`Updated ${member.name}'s weight to ${newWeight} kg (New BMI: ${member.tracker.calculateBMI()})`);
  });

  // Form: Renew Member
  document.getElementById("form-renew-member").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("renew-member-id").value;
    const plan = parseInt(document.getElementById("renew-plan-select").value, 10);
    const months = parseInt(document.getElementById("renew-months-input").value, 10);

    const updated = gym.renewMember(id, plan, months);
    closeModal("modal-renew-member");
    renderAllViews();
    showToast(`Renewed membership for ${updated.name} (+${months} months)!`);
  });

  // Form: Add Trainer
  document.getElementById("form-add-trainer").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("trainer-name").value.trim();
    const age = parseInt(document.getElementById("trainer-age").value, 10);
    const phone = document.getElementById("trainer-phone").value.trim();
    const spec = document.getElementById("trainer-spec").value.trim();
    const rate = parseFloat(document.getElementById("trainer-rate").value);

    const trainer = gym.addTrainer(name, age, phone, spec, rate);
    closeModal("modal-add-trainer");
    e.target.reset();
    renderAllViews();
    showToast(`Trainer #${trainer.id} (${trainer.name}) added to roster!`);
  });

  // Form: Assign Trainer
  document.getElementById("form-assign-trainer").addEventListener("submit", (e) => {
    e.preventDefault();
    const memberId = document.getElementById("assign-member-id").value;
    const trainerId = document.getElementById("assign-trainer-select").value;

    const res = gym.assignTrainer(memberId, trainerId);
    closeModal("modal-assign-trainer");
    renderAllViews();
    if (res) {
      showToast(`Assigned trainer ${res.trainer.name} to ${res.member.name}!`);
    }
  });

  // File Downloads
  document.getElementById("btn-download-txt-report").addEventListener("click", () => {
    const text = gym.generateTextReport();
    downloadBlob(text, "gym_report.txt", "text/plain");
    showToast("Downloaded gym_report.txt");
  });

  document.getElementById("btn-download-csv").addEventListener("click", () => {
    const csv = gym.generateCsv();
    downloadBlob(csv, "fitzone_members.csv", "text/csv");
    showToast("Exported fitzone_members.csv");
  });
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
