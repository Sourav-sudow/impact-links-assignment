const STORAGE_KEY = "impact-links-demo-v1";

const plans = {
  monthly: { label: "Monthly", price: 12, renewalDays: 30 },
  yearly: { label: "Yearly", price: 120, renewalDays: 365 }
};

const demoData = {
  currentUserId: null,
  drawMode: "random",
  jackpotRollover: 180,
  charities: [
    {
      id: "c1",
      name: "Bright Futures Trust",
      cause: "youth",
      description: "Mentoring, education grants, and safe community spaces for young people.",
      event: "Summer skills day - 18 June"
    },
    {
      id: "c2",
      name: "Care Circle Foundation",
      cause: "health",
      description: "Practical support for families navigating long-term treatment journeys.",
      event: "Wellbeing fundraiser - 09 July"
    },
    {
      id: "c3",
      name: "Local Roots Network",
      cause: "community",
      description: "Neighbourhood projects, food access, and local volunteer-led campaigns.",
      event: "Community impact brunch - 27 May"
    }
  ],
  users: [
    {
      id: "u1",
      role: "subscriber",
      name: "Aarav Sharma",
      email: "member@impactlinks.test",
      password: "member123",
      plan: "monthly",
      subscriptionStatus: "active",
      renewalDate: addDays(new Date(), 18),
      charityId: "c1",
      charityPercent: 15,
      totalWon: 0,
      payoutStatus: "pending",
      proofStatus: "pending",
      drawsEntered: 3,
      scores: [
        { date: "2026-04-26", value: 34 },
        { date: "2026-04-19", value: 28 },
        { date: "2026-04-12", value: 41 },
        { date: "2026-04-05", value: 22 },
        { date: "2026-03-29", value: 31 }
      ],
      activity: ["Welcome email sent", "April draw entry confirmed"]
    },
    {
      id: "u2",
      role: "subscriber",
      name: "Maya Patel",
      email: "maya@impactlinks.test",
      password: "member123",
      plan: "yearly",
      subscriptionStatus: "active",
      renewalDate: addDays(new Date(), 210),
      charityId: "c2",
      charityPercent: 20,
      totalWon: 80,
      payoutStatus: "paid",
      proofStatus: "approved",
      drawsEntered: 7,
      scores: [
        { date: "2026-04-25", value: 18 },
        { date: "2026-04-20", value: 34 },
        { date: "2026-04-11", value: 41 },
        { date: "2026-04-01", value: 29 },
        { date: "2026-03-21", value: 30 }
      ],
      activity: ["Winner proof approved", "Payout marked paid"]
    },
    {
      id: "admin",
      role: "admin",
      name: "Digital Heroes Admin",
      email: "admin@impactlinks.test",
      password: "admin123",
      activity: []
    }
  ],
  draws: [],
  invoices: [],
  winners: [
    {
      id: "w1",
      userId: "u2",
      tier: "3-match",
      amount: 80,
      proofStatus: "approved",
      paymentStatus: "paid"
    }
  ],
  notifications: []
};

let state = loadState();
let editingScoreDate = null;
let lastSimulation = null;
let checkoutPlan = "monthly";
let authMode = "login";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  render();
});

function bindEvents() {
  $("#loginBtn").addEventListener("click", openAuth);
  $("#heroSubscribeBtn").addEventListener("click", openSignup);
  $("#heroDemoBtn").addEventListener("click", () => loginDemo("member"));
  $("#resetDemoBtn").addEventListener("click", resetDemo);
  $$("[data-open-login]").forEach((button) => button.addEventListener("click", openAuth));
  $$("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
  $$("[data-demo-login]").forEach((button) => button.addEventListener("click", () => loginDemo(button.dataset.demoLogin)));
  $("#authSubmit").addEventListener("click", login);
  $("#createAccountBtn").addEventListener("click", () => {
    if (authMode === "login") {
      setAuthMode("signup");
      return;
    }
    createAccount();
  });
  $("#charitySearch").addEventListener("input", renderCharities);
  $("#charityFilter").addEventListener("change", renderCharities);
  $("#scoreForm").addEventListener("submit", saveScore);
  $$(".plan-buttons button[data-plan]").forEach((button) => button.addEventListener("click", () => openCheckout(button.dataset.plan)));
  $("#cancelPlanBtn").addEventListener("click", cancelPlan);
  $("#memberCharityRange").addEventListener("input", () => {
    $("#memberCharityPercent").textContent = `${$("#memberCharityRange").value}%`;
  });
  $("#saveCharityBtn").addEventListener("click", saveCharitySettings);
  $("#donateBtn").addEventListener("click", donate);
  $("#uploadProofBtn").addEventListener("click", uploadProof);
  $$(".segmented button").forEach((button) => button.addEventListener("click", () => setDrawMode(button.dataset.drawMode)));
  $("#simulateDrawBtn").addEventListener("click", simulateDraw);
  $("#publishDrawBtn").addEventListener("click", publishDraw);
  $("#charityForm").addEventListener("submit", addCharity);
  $("#confirmCheckoutBtn").addEventListener("click", confirmCheckout);
  $("#saveUserEditBtn").addEventListener("click", saveUserEdit);
  $("#saveCharityEditBtn").addEventListener("click", saveCharityEdit);
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(demoData);
  try {
    const savedState = normalizeState(JSON.parse(stored));
    savedState.currentUserId = null;
    return savedState;
  } catch {
    return structuredClone(demoData);
  }
}

function normalizeState(nextState) {
  return {
    ...structuredClone(demoData),
    ...nextState,
    invoices: nextState.invoices || [],
    draws: nextState.draws || [],
    winners: nextState.winners || [],
    notifications: nextState.notifications || []
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  renderAuth();
  renderHeroStats();
  renderCharities();
  renderDraws();
  renderMember();
  renderAdmin();
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId) || null;
}

function subscribers() {
  return state.users.filter((user) => user.role === "subscriber");
}

function activeSubscribers() {
  return subscribers().filter((user) => user.subscriptionStatus === "active");
}

function money(value) {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function formatDate(dateText) {
  if (!dateText) return "--";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateText));
}

function nextDrawDate() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().slice(0, 10);
}

function poolBase() {
  return activeSubscribers().reduce((sum, user) => sum + plans[user.plan].price * 0.35, 0);
}

function charityTotal() {
  return activeSubscribers().reduce((sum, user) => sum + plans[user.plan].price * (user.charityPercent / 100), 0);
}

function poolTiers() {
  const base = poolBase();
  return {
    five: base * 0.4 + state.jackpotRollover,
    four: base * 0.35,
    three: base * 0.25
  };
}

function renderAuth() {
  const user = currentUser();
  $("#loginBtn").textContent = user ? user.name.split(" ")[0] : "Login";
  $("#subscribeBtn").textContent = user ? "Logout" : "Subscribe";
  $("#subscribeBtn").onclick = user
    ? () => {
        state.currentUserId = null;
        persist();
        toast("Logged out");
        render();
      }
    : openSignup;
}

function renderHeroStats() {
  const tiers = poolTiers();
  $("#heroPrizePool").textContent = money(tiers.five + tiers.four + tiers.three);
  $("#heroCharityTotal").textContent = money(charityTotal());
  $("#heroNextDraw").textContent = formatDate(nextDrawDate());
}

function renderCharities() {
  const search = $("#charitySearch").value.trim().toLowerCase();
  const filter = $("#charityFilter").value;
  const charities = state.charities.filter((charity) => {
    const matchesSearch = [charity.name, charity.description, charity.event, charity.cause].join(" ").toLowerCase().includes(search);
    const matchesFilter = filter === "all" || charity.cause.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  $("#charityGrid").innerHTML = charities
    .map(
      (charity) => `
        <article class="charity-card">
          <div class="charity-visual" aria-hidden="true"></div>
          <div class="charity-body">
            <span class="tag">${escapeHtml(charity.cause)}</span>
            <h3>${escapeHtml(charity.name)}</h3>
            <p>${escapeHtml(charity.description)}</p>
            <strong>${escapeHtml(charity.event)}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDraws() {
  const tiers = poolTiers();
  $("#tier5").textContent = money(tiers.five);
  $("#tier4").textContent = money(tiers.four);
  $("#tier3").textContent = money(tiers.three);

  const latest = state.draws.at(-1);
  $("#latestNumbers").textContent = latest ? latest.numbers.join("  ") : "-- -- -- -- --";
  $("#latestDrawMeta").textContent = latest
    ? `${formatDate(latest.date)} official ${latest.mode} draw with ${latest.winners.length} winner records.`
    : "No official draw published yet.";
}

function renderMember() {
  const user = currentUser();
  const isSubscriber = user?.role === "subscriber";
  $("#memberLoggedOut").classList.toggle("hidden", isSubscriber);
  $("#memberDashboard").classList.toggle("hidden", !isSubscriber);
  if (!isSubscriber) return;

  const charity = state.charities.find((item) => item.id === user.charityId);
  $("#subscriptionStatus").textContent = user.subscriptionStatus;
  $("#subscriptionStatus").className = `status-pill ${user.subscriptionStatus}`;
  $("#memberPlan").textContent = user.plan ? plans[user.plan].label : "None";
  $("#memberRenewal").textContent = user.subscriptionStatus === "active" ? formatDate(user.renewalDate) : "--";
  $("#memberDraws").textContent = user.drawsEntered;
  $("#memberWon").textContent = money(user.totalWon);
  renderInvoice(user);
  $("#memberCharityPercent").textContent = `${user.charityPercent}%`;
  $("#memberCharityRange").value = user.charityPercent;
  $("#memberCharity").innerHTML = state.charities.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  $("#memberCharity").value = charity?.id || state.charities[0]?.id;
  $("#proofStatus").textContent = user.proofStatus || "pending";
  $("#proofStatus").className = `status-pill ${user.proofStatus || "pending"}`;

  renderScores(user);
  $("#memberActivity").innerHTML = (user.activity || [])
    .slice(-5)
    .reverse()
    .map((activity) => `<div class="activity-item"><span>${escapeHtml(activity)}</span></div>`)
    .join("");
}

function renderInvoice(user) {
  const invoice = state.invoices.filter((item) => item.userId === user.id).at(-1);
  $("#memberInvoice").innerHTML = invoice
    ? `<span>Latest invoice</span><strong>${invoice.id}</strong><span>${money(invoice.amount)} · ${formatDate(invoice.date)} · ${invoice.status}</span>`
    : `<span>No checkout record yet</span><strong>Simulation ready</strong><span>Select a plan to generate one.</span>`;
}

function renderScores(user) {
  const scores = [...user.scores].sort((a, b) => b.date.localeCompare(a.date));
  $("#scoreList").innerHTML = scores
    .map(
      (score) => `
      <div class="score-item">
        <span>${formatDate(score.date)}</span>
        <strong>${score.value}</strong>
        <div class="score-actions">
          <button type="button" data-edit-score="${score.date}">Edit</button>
          <button type="button" data-delete-score="${score.date}">Delete</button>
        </div>
      </div>
    `
    )
    .join("");

  $$("[data-edit-score]").forEach((button) => button.addEventListener("click", () => startScoreEdit(button.dataset.editScore)));
  $$("[data-delete-score]").forEach((button) => button.addEventListener("click", () => deleteScore(button.dataset.deleteScore)));
}

function renderAdmin() {
  const user = currentUser();
  const isAdmin = user?.role === "admin";
  $("#adminLoggedOut").classList.toggle("hidden", isAdmin);
  $("#adminDashboard").classList.toggle("hidden", !isAdmin);
  if (!isAdmin) return;

  $("#adminUsers").textContent = subscribers().length;
  $("#adminActive").textContent = activeSubscribers().length;
  $("#adminPool").textContent = money(Object.values(poolTiers()).reduce((sum, value) => sum + value, 0));
  $("#adminCharity").textContent = money(charityTotal());
  $("#drawModeLabel").textContent = state.drawMode === "weighted" ? "Weighted" : "Random";
  $$(".segmented button").forEach((button) => button.classList.toggle("active", button.dataset.drawMode === state.drawMode));

  $("#adminUserRows").innerHTML = subscribers()
    .map((subscriber) => {
      const charity = state.charities.find((item) => item.id === subscriber.charityId);
      return `<tr>
        <td>${escapeHtml(subscriber.name)}</td>
        <td>${escapeHtml(subscriber.email)}</td>
        <td>${subscriber.subscriptionStatus} / ${plans[subscriber.plan].label}</td>
        <td>${subscriber.scores.length} latest</td>
        <td>${escapeHtml(charity?.name || "None")} (${subscriber.charityPercent}%)</td>
        <td><button class="secondary-button" type="button" data-edit-user="${subscriber.id}">Edit</button></td>
      </tr>`;
    })
    .join("");

  $$("[data-edit-user]").forEach((button) => button.addEventListener("click", () => openUserEdit(button.dataset.editUser)));

  $("#winnerList").innerHTML = state.winners.length
    ? state.winners
        .map((winner) => {
          const winnerUser = state.users.find((item) => item.id === winner.userId);
          return `<div class="activity-item">
            <span>${escapeHtml(winnerUser?.name || "Unknown")} · ${winner.tier} · ${money(winner.amount)}</span>
            <span>
              <button class="secondary-button" type="button" data-approve-winner="${winner.id}">Approve</button>
              <button class="ghost-button" type="button" data-pay-winner="${winner.id}">Paid</button>
            </span>
          </div>`;
        })
        .join("")
    : `<div class="activity-item"><span>No winners yet</span></div>`;

  $$("[data-approve-winner]").forEach((button) => button.addEventListener("click", () => approveWinner(button.dataset.approveWinner)));
  $$("[data-pay-winner]").forEach((button) => button.addEventListener("click", () => payWinner(button.dataset.payWinner)));

  $("#adminCharities").innerHTML = state.charities
    .map(
      (charity) => `<div class="activity-item">
        <span>${escapeHtml(charity.name)} · ${escapeHtml(charity.cause)}</span>
        <span>
          <button class="secondary-button" type="button" data-edit-charity="${charity.id}">Edit</button>
          <button class="ghost-button" type="button" data-delete-charity="${charity.id}">Delete</button>
        </span>
      </div>`
    )
    .join("");

  renderDrawHistory();
  $$("[data-edit-charity]").forEach((button) => button.addEventListener("click", () => openCharityEdit(button.dataset.editCharity)));
  $$("[data-delete-charity]").forEach((button) => button.addEventListener("click", () => deleteCharity(button.dataset.deleteCharity)));
}

function renderDrawHistory() {
  $("#drawHistory").innerHTML = state.draws.length
    ? [...state.draws]
        .reverse()
        .map(
          (draw) => `<div class="activity-item">
            <span>${formatDate(draw.date)} · ${draw.mode} · ${draw.numbers.join(" ")}</span>
            <strong>${draw.winners.length} winners</strong>
          </div>`
        )
        .join("")
    : `<div class="activity-item"><span>No published draws yet</span></div>`;
}

function openAuth() {
  setAuthMode("login");
  $("#authDialog").showModal();
}

function openSignup() {
  $("#authDialog").showModal();
  setAuthMode("signup");
}

function setAuthMode(mode) {
  authMode = mode;
  $$("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  $$(".signup-only").forEach((element) => element.classList.toggle("hidden", mode !== "signup"));
  $("#authSubmit").textContent = mode === "signup" ? "Create account" : "Login";
  $("#createAccountBtn").classList.toggle("hidden", mode === "signup");
  $("#authError").textContent = "";
  if (mode === "signup") {
    $("#authEmail").value = "";
    $("#authPassword").value = "";
    $("#authName").focus();
  }
}

function loginDemo(type) {
  const user = type === "admin" ? state.users.find((item) => item.role === "admin") : state.users.find((item) => item.role === "subscriber");
  state.currentUserId = user.id;
  persist();
  $("#authDialog").close();
  toast(`${user.name} logged in`);
  render();
  location.hash = user.role === "admin" ? "#admin" : "#dashboard";
}

function login() {
  if (authMode === "signup") {
    createAccount();
    return;
  }
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!user) {
    $("#authError").textContent = "Invalid credentials. Try the demo buttons.";
    return;
  }
  state.currentUserId = user.id;
  persist();
  $("#authDialog").close();
  $("#authError").textContent = "";
  toast(`Welcome back, ${user.name}`);
  render();
  location.hash = user.role === "admin" ? "#admin" : "#dashboard";
}

function createAccount() {
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const name = $("#authName").value.trim() || email.split("@")[0].replace(/[._-]/g, " ");
  if (!email.includes("@")) {
    $("#authError").textContent = "Enter a valid email.";
    return;
  }
  if (password.length < 6) {
    $("#authError").textContent = "Password must be at least 6 characters.";
    return;
  }
  if (state.users.some((user) => user.email.toLowerCase() === email)) {
    $("#authError").textContent = "This email already exists.";
    return;
  }
  const id = `u${Date.now()}`;
  state.users.push({
    id,
    role: "subscriber",
    name,
    email,
    password,
    plan: "monthly",
    subscriptionStatus: "active",
    renewalDate: addDays(new Date(), 30),
    charityId: state.charities[0].id,
    charityPercent: 10,
    totalWon: 0,
    payoutStatus: "pending",
    proofStatus: "pending",
    drawsEntered: 0,
    scores: [],
    activity: ["Account created", "Subscription activated"]
  });
  state.invoices.push(makeInvoice(id, "monthly"));
  state.currentUserId = id;
  persist();
  $("#authDialog").close();
  toast("Subscriber account created");
  render();
  location.hash = "#dashboard";
}

function openCheckout(plan) {
  const user = currentUser();
  if (!user || user.role !== "subscriber") {
    openAuth();
    return;
  }
  checkoutPlan = plan;
  const price = plans[plan].price;
  const charityAmount = price * (user.charityPercent / 100);
  const poolAmount = price * 0.35;
  $("#checkoutPlan").textContent = plans[plan].label;
  $("#checkoutPrice").textContent = money(price);
  $("#checkoutCharity").textContent = money(charityAmount);
  $("#checkoutPool").textContent = money(poolAmount);
  $("#checkoutError").textContent = "";
  $("#checkoutDialog").showModal();
}

function confirmCheckout() {
  const user = currentUser();
  const card = $("#cardNumber").value.replace(/\s/g, "");
  if (!/^\d{12,19}$/.test(card)) {
    $("#checkoutError").textContent = "Enter a valid test card number.";
    return;
  }
  updatePlan(checkoutPlan, true);
  state.invoices.push(makeInvoice(user.id, checkoutPlan));
  user.activity.push(`Checkout completed with test card ending ${card.slice(-4)}`);
  persist();
  $("#checkoutDialog").close();
  toast("Checkout successful");
  render();
}

function makeInvoice(userId, plan) {
  const user = state.users.find((item) => item.id === userId);
  const amount = plans[plan].price;
  return {
    id: `INV-${String(state.invoices.length + 1).padStart(4, "0")}`,
    userId,
    plan,
    amount,
    charityAmount: Math.round(amount * ((user?.charityPercent || 10) / 100)),
    poolAmount: Math.round(amount * 0.35),
    status: "paid",
    date: new Date().toISOString().slice(0, 10)
  };
}

function saveScore(event) {
  event.preventDefault();
  const user = currentUser();
  const date = $("#scoreDate").value;
  const value = Number($("#scoreValue").value);
  const error = $("#scoreError");
  error.textContent = "";

  if (!user || user.role !== "subscriber") return;
  if (!date) {
    error.textContent = "Select a score date.";
    return;
  }
  if (value < 1 || value > 45) {
    error.textContent = "Stableford score must be between 1 and 45.";
    return;
  }
  const duplicate = user.scores.some((score) => score.date === date && score.date !== editingScoreDate);
  if (duplicate) {
    error.textContent = "Only one score entry is allowed per date.";
    return;
  }

  if (editingScoreDate) {
    user.scores = user.scores.filter((score) => score.date !== editingScoreDate);
  }
  user.scores.push({ date, value });
  user.scores = user.scores.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  user.activity.push(`Score saved for ${formatDate(date)}`);
  editingScoreDate = null;
  $("#scoreForm").reset();
  persist();
  toast("Score saved");
  render();
}

function startScoreEdit(date) {
  const user = currentUser();
  const score = user.scores.find((item) => item.date === date);
  if (!score) return;
  editingScoreDate = date;
  $("#scoreDate").value = score.date;
  $("#scoreValue").value = score.value;
  $("#scoreError").textContent = "Editing existing score entry.";
}

function deleteScore(date) {
  const user = currentUser();
  user.scores = user.scores.filter((score) => score.date !== date);
  user.activity.push(`Score deleted for ${formatDate(date)}`);
  persist();
  toast("Score deleted");
  render();
}

function updatePlan(plan, fromCheckout = false) {
  const user = currentUser();
  user.plan = plan;
  user.subscriptionStatus = "active";
  user.renewalDate = addDays(new Date(), plans[plan].renewalDays);
  user.activity.push(`${plans[plan].label} subscription ${fromCheckout ? "paid" : "activated"}`);
  persist();
  if (!fromCheckout) {
    toast(`${plans[plan].label} plan activated`);
    render();
  }
}

function cancelPlan() {
  const user = currentUser();
  user.subscriptionStatus = "inactive";
  user.activity.push("Subscription cancelled");
  persist();
  toast("Subscription cancelled");
  render();
}

function saveCharitySettings() {
  const user = currentUser();
  user.charityId = $("#memberCharity").value;
  user.charityPercent = Number($("#memberCharityRange").value);
  user.activity.push(`Charity contribution updated to ${user.charityPercent}%`);
  persist();
  toast("Charity settings updated");
  render();
}

function donate() {
  const user = currentUser();
  user.activity.push("Independent donation recorded");
  state.notifications.push({ type: "donation", message: `${user.name} made an independent donation` });
  persist();
  toast("Donation recorded");
  render();
}

function uploadProof() {
  const user = currentUser();
  if (!$("#proofUpload").files.length) {
    toast("Choose a proof file first");
    return;
  }
  user.proofStatus = "pending";
  user.activity.push("Winner proof uploaded for admin review");
  persist();
  toast("Proof uploaded");
  render();
}

function setDrawMode(mode) {
  state.drawMode = mode;
  persist();
  render();
}

function simulateDraw() {
  lastSimulation = buildDraw(state.drawMode);
  $("#drawPreview").innerHTML = drawSummary(lastSimulation, "Simulation");
  toast("Simulation ready");
}

function publishDraw() {
  const draw = lastSimulation || buildDraw(state.drawMode);
  draw.id = `d${Date.now()}`;
  draw.date = new Date().toISOString().slice(0, 10);
  draw.published = true;
  state.draws.push(draw);
  state.winners.push(...draw.winners);

  if (!draw.winners.some((winner) => winner.tier === "5-match")) {
    state.jackpotRollover = poolTiers().five;
  } else {
    state.jackpotRollover = 0;
  }

  draw.winners.forEach((winner) => {
    const user = state.users.find((item) => item.id === winner.userId);
    if (user) {
      user.totalWon += winner.amount;
      user.payoutStatus = "pending";
      user.proofStatus = "pending";
      user.activity.push(`${winner.tier} winner alert sent`);
    }
  });
  activeSubscribers().forEach((user) => {
    user.drawsEntered += 1;
  });

  state.notifications.push({ type: "draw", message: `Published ${draw.mode} draw ${draw.numbers.join(", ")}` });
  lastSimulation = null;
  persist();
  $("#drawPreview").innerHTML = drawSummary(draw, "Published");
  toast("Official draw published");
  render();
}

function buildDraw(mode) {
  const numbers = mode === "weighted" ? weightedNumbers() : randomNumbers();
  const tiers = poolTiers();
  const winners = [];
  const tierCounts = { "5-match": 0, "4-match": 0, "3-match": 0 };

  activeSubscribers().forEach((user) => {
    const values = user.scores.map((score) => score.value);
    const matchCount = numbers.filter((number) => values.includes(number)).length;
    if (matchCount >= 5) tierCounts["5-match"] += 1;
    else if (matchCount === 4) tierCounts["4-match"] += 1;
    else if (matchCount === 3) tierCounts["3-match"] += 1;
  });

  activeSubscribers().forEach((user) => {
    const values = user.scores.map((score) => score.value);
    const matchCount = numbers.filter((number) => values.includes(number)).length;
    if (matchCount >= 5) winners.push(makeWinner(user.id, "5-match", tiers.five / tierCounts["5-match"]));
    else if (matchCount === 4) winners.push(makeWinner(user.id, "4-match", tiers.four / tierCounts["4-match"]));
    else if (matchCount === 3) winners.push(makeWinner(user.id, "3-match", tiers.three / tierCounts["3-match"]));
  });

  return { mode, numbers, winners, published: false };
}

function makeWinner(userId, tier, amount) {
  return {
    id: `w${Date.now()}${Math.random().toString(16).slice(2)}`,
    userId,
    tier,
    amount: Math.round(amount || 0),
    proofStatus: "pending",
    paymentStatus: "pending"
  };
}

function randomNumbers() {
  const set = new Set();
  while (set.size < 5) {
    set.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...set].sort((a, b) => a - b);
}

function weightedNumbers() {
  const frequency = new Map();
  activeSubscribers().forEach((user) => user.scores.forEach((score) => frequency.set(score.value, (frequency.get(score.value) || 0) + 1)));
  const ranked = [...frequency.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);
  const numbers = [...new Set(ranked)].slice(0, 5);
  while (numbers.length < 5) {
    const next = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(next)) numbers.push(next);
  }
  return numbers.sort((a, b) => a - b);
}

function drawSummary(draw, label) {
  const winnersText = draw.winners.length
    ? draw.winners
        .map((winner) => {
          const user = state.users.find((item) => item.id === winner.userId);
          return `${user?.name || "Unknown"} ${winner.tier} ${money(winner.amount)}`;
        })
        .join("<br>")
    : "No winners. 5-match jackpot rolls over if published.";
  return `<div class="activity-item"><span>${label}: ${draw.numbers.join(" · ")}</span></div><div class="activity-item"><span>${winnersText}</span></div>`;
}

function approveWinner(id) {
  const winner = state.winners.find((item) => item.id === id);
  if (!winner) return;
  winner.proofStatus = "approved";
  const user = state.users.find((item) => item.id === winner.userId);
  if (user) {
    user.proofStatus = "approved";
    user.activity.push("Winner proof approved by admin");
  }
  persist();
  toast("Winner approved");
  render();
}

function payWinner(id) {
  const winner = state.winners.find((item) => item.id === id);
  if (!winner) return;
  winner.paymentStatus = "paid";
  const user = state.users.find((item) => item.id === winner.userId);
  if (user) {
    user.payoutStatus = "paid";
    user.activity.push("Payout marked as paid");
  }
  persist();
  toast("Payout marked paid");
  render();
}

function openUserEdit(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  const latest = [...user.scores].sort((a, b) => b.date.localeCompare(a.date))[0];
  $("#editUserId").value = user.id;
  $("#editUserName").value = user.name;
  $("#editUserStatus").value = user.subscriptionStatus;
  $("#editUserPlan").value = user.plan;
  $("#editUserScoreDate").value = latest?.date || "";
  $("#editUserScoreValue").value = latest?.value || "";
  $("#editUserError").textContent = "";
  $("#userEditDialog").showModal();
}

function saveUserEdit() {
  const user = state.users.find((item) => item.id === $("#editUserId").value);
  if (!user) return;
  const scoreDate = $("#editUserScoreDate").value;
  const scoreValue = Number($("#editUserScoreValue").value);
  if (scoreDate && (scoreValue < 1 || scoreValue > 45)) {
    $("#editUserError").textContent = "Score must be between 1 and 45.";
    return;
  }
  user.name = $("#editUserName").value.trim() || user.name;
  user.subscriptionStatus = $("#editUserStatus").value;
  user.plan = $("#editUserPlan").value;
  if (user.subscriptionStatus === "active" && !user.renewalDate) {
    user.renewalDate = addDays(new Date(), plans[user.plan].renewalDays);
  }
  if (scoreDate) {
    user.scores = user.scores.filter((score) => score.date !== scoreDate);
    user.scores.push({ date: scoreDate, value: scoreValue });
    user.scores = user.scores.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }
  user.activity.push("Admin updated subscriber profile");
  persist();
  $("#userEditDialog").close();
  toast("Subscriber updated");
  render();
}

function openCharityEdit(id) {
  const charity = state.charities.find((item) => item.id === id);
  if (!charity) return;
  $("#editCharityId").value = charity.id;
  $("#editCharityName").value = charity.name;
  $("#editCharityCause").value = charity.cause;
  $("#editCharityEvent").value = charity.event;
  $("#editCharityDescription").value = charity.description;
  $("#charityEditDialog").showModal();
}

function saveCharityEdit() {
  const charity = state.charities.find((item) => item.id === $("#editCharityId").value);
  if (!charity) return;
  charity.name = $("#editCharityName").value.trim() || charity.name;
  charity.cause = $("#editCharityCause").value.trim().toLowerCase() || charity.cause;
  charity.event = $("#editCharityEvent").value.trim() || charity.event;
  charity.description = $("#editCharityDescription").value.trim() || charity.description;
  persist();
  $("#charityEditDialog").close();
  toast("Charity updated");
  render();
}

function addCharity(event) {
  event.preventDefault();
  state.charities.push({
    id: `c${Date.now()}`,
    name: $("#newCharityName").value.trim(),
    cause: $("#newCharityCause").value.trim().toLowerCase(),
    description: "New charity profile ready for admin content updates.",
    event: $("#newCharityEvent").value.trim()
  });
  $("#charityForm").reset();
  persist();
  toast("Charity added");
  render();
}

function deleteCharity(id) {
  if (state.charities.length <= 1) {
    toast("At least one charity is required");
    return;
  }
  state.charities = state.charities.filter((charity) => charity.id !== id);
  state.users.forEach((user) => {
    if (user.charityId === id) user.charityId = state.charities[0].id;
  });
  persist();
  toast("Charity deleted");
  render();
}

function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(demoData);
  lastSimulation = null;
  editingScoreDate = null;
  persist();
  toast("Demo data reset");
  render();
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
