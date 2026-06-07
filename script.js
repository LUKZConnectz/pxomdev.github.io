const STORAGE_KEY = "rider-profit-jobs-v1";
const SETTINGS_KEY = "rider-profit-settings-v1";
const FUEL_CACHE_KEY = "rider-profit-fuel-v1";

const fallbackFuels = [
  { name: "Gasohol 95", price: 31.85 },
  { name: "Gasohol 91", price: 31.48 },
  { name: "E20", price: 29.64 },
  { name: "Diesel B7", price: 31.94 },
];

const elements = {
  jobForm: document.getElementById("jobForm"),
  jobDate: document.getElementById("jobDate"),
  fare: document.getElementById("fare"),
  distance: document.getElementById("distance"),
  efficiency: document.getElementById("efficiency"),
  fuelPrice: document.getElementById("fuelPrice"),
  note: document.getElementById("note"),
  previewLiters: document.getElementById("previewLiters"),
  previewFuelCost: document.getElementById("previewFuelCost"),
  previewProfit: document.getElementById("previewProfit"),
  fuelCards: document.getElementById("fuelCards"),
  fuelStatus: document.getElementById("fuelStatus"),
  refreshFuelBtn: document.getElementById("refreshFuelBtn"),
  jobsBody: document.getElementById("jobsBody"),
  emptyState: document.getElementById("emptyState"),
  totalFare: document.getElementById("totalFare"),
  totalFuelCost: document.getElementById("totalFuelCost"),
  totalLiters: document.getElementById("totalLiters"),
  totalProfit: document.getElementById("totalProfit"),
  totalDistance: document.getElementById("totalDistance"),
  totalJobs: document.getElementById("totalJobs"),
  summaryRange: document.getElementById("summaryRange"),
  summaryDate: document.getElementById("summaryDate"),
  rangeJobs: document.getElementById("rangeJobs"),
  rangeFare: document.getElementById("rangeFare"),
  rangeFuel: document.getElementById("rangeFuel"),
  rangeProfit: document.getElementById("rangeProfit"),
  exportExcelBtn: document.getElementById("exportExcelBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  clearBtn: document.getElementById("clearBtn"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
};

let jobs = loadJobs();
let settings = loadSettings();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadJobs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveJobs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function baht(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function decimal(value, digits = 2) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

function getCalculation({ fare, distance, efficiency, fuelPrice }) {
  const liters = efficiency > 0 ? distance / efficiency : 0;
  const fuelCost = liters * fuelPrice;
  const profit = fare - fuelCost;
  return { liters, fuelCost, profit };
}

function hydrateForm() {
  elements.jobDate.value = today();
  elements.summaryDate.value = today();
  elements.efficiency.value = settings.efficiency || 40;
  elements.fuelPrice.value = settings.fuelPrice || fallbackFuels[0].price;
  applyTheme(settings.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  updatePreview();
}

function updatePreview() {
  const fare = Number(elements.fare.value) || 0;
  const distance = Number(elements.distance.value) || 0;
  const efficiency = Number(elements.efficiency.value) || 0;
  const fuelPrice = Number(elements.fuelPrice.value) || 0;
  const { liters, fuelCost, profit } = getCalculation({ fare, distance, efficiency, fuelPrice });

  elements.previewLiters.textContent = `${decimal(liters)} L`;
  elements.previewFuelCost.textContent = baht(fuelCost);
  elements.previewProfit.textContent = baht(profit);
}

function render() {
  renderJobs();
  renderTotals();
  renderRangeSummary();
}

function renderJobs() {
  elements.jobsBody.innerHTML = "";
  elements.emptyState.classList.toggle("hidden", jobs.length > 0);

  [...jobs]
    .sort((a, b) => `${b.date}${b.createdAt}`.localeCompare(`${a.date}${a.createdAt}`))
    .forEach((job) => {
      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50";
      row.innerHTML = `
        <td class="whitespace-nowrap px-4 py-3 font-semibold">${job.date}</td>
        <td class="whitespace-nowrap px-4 py-3">${baht(job.fare)}</td>
        <td class="whitespace-nowrap px-4 py-3">${decimal(job.distance)} กม.</td>
        <td class="whitespace-nowrap px-4 py-3">${decimal(job.liters)} L</td>
        <td class="whitespace-nowrap px-4 py-3 text-rose-500">${baht(job.fuelCost)}</td>
        <td class="whitespace-nowrap px-4 py-3 font-bold text-emerald-500">${baht(job.profit)}</td>
        <td class="min-w-[180px] px-4 py-3 text-slate-500 dark:text-slate-400">${escapeHtml(job.note || "-")}</td>
        <td class="whitespace-nowrap px-4 py-3 text-right">
          <button class="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300" data-delete="${job.id}">ลบ</button>
        </td>
      `;
      elements.jobsBody.appendChild(row);
    });
}

function summarize(list) {
  return list.reduce(
    (sum, job) => ({
      jobs: sum.jobs + 1,
      fare: sum.fare + job.fare,
      distance: sum.distance + job.distance,
      liters: sum.liters + job.liters,
      fuel: sum.fuel + job.fuelCost,
      profit: sum.profit + job.profit,
    }),
    { jobs: 0, fare: 0, distance: 0, liters: 0, fuel: 0, profit: 0 }
  );
}

function renderTotals() {
  const sum = summarize(jobs);
  elements.totalFare.textContent = baht(sum.fare);
  elements.totalFuelCost.textContent = baht(sum.fuel);
  elements.totalLiters.textContent = `${decimal(sum.liters)} ลิตร`;
  elements.totalProfit.textContent = baht(sum.profit);
  elements.totalDistance.textContent = `${decimal(sum.distance)} กม.`;
  elements.totalJobs.textContent = `${sum.jobs} งาน`;
}

function renderRangeSummary() {
  const filtered = jobs.filter((job) => inSelectedRange(job.date));
  const sum = summarize(filtered);
  elements.rangeJobs.textContent = sum.jobs;
  elements.rangeFare.textContent = baht(sum.fare);
  elements.rangeFuel.textContent = baht(sum.fuel);
  elements.rangeProfit.textContent = baht(sum.profit);
}

function inSelectedRange(dateString) {
  const range = elements.summaryRange.value;
  if (range === "all") return true;

  const base = new Date(`${elements.summaryDate.value || today()}T00:00:00`);
  const target = new Date(`${dateString}T00:00:00`);

  if (range === "day") return dateString === (elements.summaryDate.value || today());

  if (range === "week") {
    const day = base.getDay() || 7;
    const start = new Date(base);
    start.setDate(base.getDate() - day + 1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return target >= start && target <= end;
  }

  if (range === "month") {
    return target.getFullYear() === base.getFullYear() && target.getMonth() === base.getMonth();
  }

  return true;
}

function renderFuelCards(fuels, source = "API") {
  elements.fuelCards.innerHTML = "";
  fuels.forEach((fuel) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "fuel-card text-left transition hover:-translate-y-0.5 hover:border-emerald-300";
    card.innerHTML = `
      <p class="text-sm font-bold text-slate-600 dark:text-slate-300">${escapeHtml(fuel.name)}</p>
      <p class="mt-2 text-2xl font-extrabold text-emerald-500">${decimal(fuel.price)} ฿/L</p>
      <p class="mt-1 text-xs text-slate-500">แตะเพื่อใช้ราคานี้</p>
    `;
    card.addEventListener("click", () => {
      elements.fuelPrice.value = fuel.price;
      settings.fuelPrice = Number(fuel.price);
      saveSettings();
      updatePreview();
    });
    elements.fuelCards.appendChild(card);
  });

  const updated = new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  elements.fuelStatus.textContent = `อัปเดตล่าสุด ${updated} • แหล่งข้อมูล: ${source}`;
}

async function fetchFuelPrices() {
  elements.fuelStatus.textContent = "กำลังโหลดราคาน้ำมันแบบ Real-time...";
  const cached = readFuelCache();

  try {
    const response = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://energy.go.th/index"), {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Fuel API unavailable");
    const html = await response.text();
    const fuels = parseFuelPrices(html);
    if (fuels.length < 2) throw new Error("Cannot parse fuel prices");
    localStorage.setItem(FUEL_CACHE_KEY, JSON.stringify({ fuels, savedAt: Date.now() }));
    renderFuelCards(fuels, "energy.go.th");
    if (!settings.fuelPrice) {
      elements.fuelPrice.value = fuels[0].price;
      settings.fuelPrice = fuels[0].price;
      saveSettings();
      updatePreview();
    }
  } catch (error) {
    const fuels = cached?.fuels?.length ? cached.fuels : fallbackFuels;
    renderFuelCards(fuels, cached ? "cache" : "fallback");
    elements.fuelStatus.textContent += " • ใช้ข้อมูลสำรอง เพราะ API อาจติด CORS หรือไม่พร้อมใช้งาน";
  }
}

function parseFuelPrices(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
  const fuelNames = ["Gasohol 95", "Gasohol 91", "E20", "E85", "Diesel", "Premium Diesel"];
  const fuels = [];

  fuelNames.forEach((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escaped}[^0-9]{0,80}(\\d{2,3}\\.\\d{2})`, "i");
    const match = text.match(regex);
    if (match) fuels.push({ name, price: Number(match[1]) });
  });

  return fuels.slice(0, 6);
}

function readFuelCache() {
  try {
    return JSON.parse(localStorage.getItem(FUEL_CACHE_KEY));
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  }[char]));
}

function exportExcel() {
  const rows = jobs.map((job) => `
    <tr>
      <td>${job.date}</td>
      <td>${job.fare}</td>
      <td>${job.distance}</td>
      <td>${job.efficiency}</td>
      <td>${job.fuelPrice}</td>
      <td>${job.liters.toFixed(2)}</td>
      <td>${job.fuelCost.toFixed(2)}</td>
      <td>${job.profit.toFixed(2)}</td>
      <td>${escapeHtml(job.note || "")}</td>
    </tr>`).join("");

  const table = `
    <table>
      <thead><tr><th>วันที่</th><th>ค่ารอบ</th><th>กม.</th><th>กม./ลิตร</th><th>บาท/ลิตร</th><th>ลิตร</th><th>ค่าน้ำมัน</th><th>กำไร</th><th>หมายเหตุ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  const blob = new Blob(["\ufeff", table], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, `rider-profit-${today()}.xls`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  elements.themeIcon.textContent = isDark ? "☀️" : "🌙";
  settings.theme = theme;
  saveSettings();
}

elements.jobForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const fare = Number(elements.fare.value) || 0;
  const distance = Number(elements.distance.value) || 0;
  const efficiency = Number(elements.efficiency.value) || 40;
  const fuelPrice = Number(elements.fuelPrice.value) || 0;
  const { liters, fuelCost, profit } = getCalculation({ fare, distance, efficiency, fuelPrice });

  jobs.push({
    id: crypto.randomUUID(),
    date: elements.jobDate.value || today(),
    fare,
    distance,
    efficiency,
    fuelPrice,
    liters,
    fuelCost,
    profit,
    note: elements.note.value.trim(),
    createdAt: new Date().toISOString(),
  });

  settings.efficiency = efficiency;
  settings.fuelPrice = fuelPrice;
  saveSettings();
  saveJobs();
  elements.jobForm.reset();
  elements.jobDate.value = today();
  elements.efficiency.value = settings.efficiency;
  elements.fuelPrice.value = settings.fuelPrice;
  updatePreview();
  render();
});

[elements.fare, elements.distance, elements.efficiency, elements.fuelPrice].forEach((input) => {
  input.addEventListener("input", updatePreview);
});

elements.efficiency.addEventListener("change", () => {
  settings.efficiency = Number(elements.efficiency.value) || 40;
  saveSettings();
});

elements.fuelPrice.addEventListener("change", () => {
  settings.fuelPrice = Number(elements.fuelPrice.value) || fallbackFuels[0].price;
  saveSettings();
});

elements.jobsBody.addEventListener("click", (event) => {
  const id = event.target.dataset.delete;
  if (!id) return;
  jobs = jobs.filter((job) => job.id !== id);
  saveJobs();
  render();
});

[elements.summaryRange, elements.summaryDate].forEach((input) => {
  input.addEventListener("change", renderRangeSummary);
});

elements.refreshFuelBtn.addEventListener("click", fetchFuelPrices);
elements.exportExcelBtn.addEventListener("click", exportExcel);
elements.exportPdfBtn.addEventListener("click", () => window.print());
elements.clearBtn.addEventListener("click", () => {
  if (!jobs.length || !confirm("ต้องการล้างข้อมูลงานทั้งหมดใช่ไหม?")) return;
  jobs = [];
  saveJobs();
  render();
});

elements.themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
});

hydrateForm();
render();
fetchFuelPrices();
