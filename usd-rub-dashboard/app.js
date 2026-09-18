const forecastData = {
  base: {
    label: "Базовый сценарий",
    color: "#ff7a59",
    yearEndRange: "86–92 ₽",
    description:
      "Высокая ставка держит рубль в первой половине года, но к концу 2026 давление от бюджета, импорта и слабой нефтегазовой выручки возвращает пару вверх.",
    points: [
      { label: "19 мар 2026", value: 83.13, note: "Официальный курс ЦБ" },
      { label: "июн 2026", value: 82.4, note: "Жесткие денежные условия еще поддерживают рубль" },
      { label: "сен 2026", value: 85.8, note: "Импорт и бюджет усиливают давление" },
      { label: "дек 2026", value: 88.6, note: "Мое базовое предположение на конец 2026" },
      { label: "ср. 2027", value: 92.3, note: "Медиана макроопроса ЦБ по среднему курсу 2027" },
      { label: "ср. 2028", value: 97.8, note: "Медиана макроопроса ЦБ по среднему курсу 2028" },
    ],
  },
  optimistic: {
    label: "Сильный рубль",
    color: "#83d4c4",
    yearEndRange: "78–84 ₽",
    description:
      "Сценарий требует дорогой нефти, аккуратного снижения ставки и относительно спокойной логистики экспорта.",
    points: [
      { label: "19 мар 2026", value: 83.13, note: "Официальный курс ЦБ" },
      { label: "июн 2026", value: 80.5, note: "Приток валютной выручки сильнее ожиданий" },
      { label: "сен 2026", value: 81.4, note: "Рынок удерживает крепкий рубль" },
      { label: "дек 2026", value: 83.8, note: "Благоприятный коридор на конец года" },
      { label: "ср. 2027", value: 88.5, note: "Даже при хорошем сценарии дрейф ослабления не исчезает" },
      { label: "ср. 2028", value: 93.5, note: "Долгосрочно нейтральный курс все равно выше" },
    ],
  },
  stress: {
    label: "Стресс-сценарий",
    color: "#ffb165",
    yearEndRange: "95–105 ₽",
    description:
      "Это не одномоментная паника 2022 года, а более вязкое структурное ослабление рубля из-за санкций, экспорта и бюджета.",
    points: [
      { label: "19 мар 2026", value: 83.13, note: "Официальный курс ЦБ" },
      { label: "июн 2026", value: 88.0, note: "Ухудшение внешней торговли быстро отражается на рынке" },
      { label: "сен 2026", value: 94.6, note: "Пара закрепляется выше 90" },
      { label: "дек 2026", value: 101.8, note: "Стрессовый ориентир на конец 2026" },
      { label: "ср. 2027", value: 104.0, note: "Высокий курс сохраняется как новый режим" },
      { label: "ср. 2028", value: 108.0, note: "Дальнейшая адаптация происходит на более слабом рубле" },
    ],
  },
};

const historyData = [
  {
    label: "10 окт 2014",
    value: 39.98,
    note: "До острой фазы девальвации 2014 года",
  },
  {
    label: "18 дек 2014",
    value: 67.79,
    note: "Пик стрессовой фазы 2014 года; ставка 17%",
  },
  {
    label: "23 фев 2022",
    value: 80.42,
    note: "Последний спокойный ориентир перед шоком 2022",
  },
  {
    label: "11 мар 2022",
    value: 120.38,
    note: "Пик санкционного шока; ставка 20%",
  },
  {
    label: "30 июн 2022",
    value: 51.16,
    note: "Аномально сильный рубль из-за ограничений и обвала импорта",
  },
  {
    label: "15 авг 2023",
    value: 101.04,
    note: "Ослабление на фоне торговли и ожиданий; ставка 12%",
  },
  {
    label: "29 ноя 2024",
    value: 109.58,
    note: "Пик позднего эпизода 2024 года; ставка 21%",
  },
  {
    label: "19 мар 2026",
    value: 83.13,
    note: "Текущий официальный курс Банка России",
  },
];

const consensusTrack = [
  { label: "19 мар 2026", value: 83.13, note: "Текущий официальный курс ЦБ" },
  { label: "ср. 2026", value: 84.0, note: "Медианный средний курс 2026 по опросу ЦБ" },
  { label: "ср. 2027", value: 92.3, note: "Медианный средний курс 2027 по опросу ЦБ" },
  { label: "ср. 2028", value: 97.8, note: "Медианный средний курс 2028 по опросу ЦБ" },
];

const canvas = document.getElementById("trendChart");
const chartTitle = document.getElementById("chartTitle");
const legend = document.getElementById("chartLegend");
const tooltip = document.getElementById("chartTooltip");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const scenarioButtons = [...document.querySelectorAll("[data-scenario]")];
const scenarioControls = document.getElementById("scenarioControls");
const ctx = canvas.getContext("2d");

const state = {
  mode: "forecast",
  scenario: "base",
  hoverPoint: null,
  chartPoints: [],
};

function roundChartValue(value) {
  return `${value.toFixed(2)} ₽`;
}

function setActiveButton(buttons, activeValue, key) {
  buttons.forEach((button) => {
    button.classList.toggle("chip--active", button.dataset[key] === activeValue);
  });
}

function formatLegend(items) {
  legend.innerHTML = "";
  items.forEach((item) => {
    const node = document.createElement("div");
    node.className = "legend__item";
    node.innerHTML = `<span class="legend__dot" style="background:${item.color}"></span>${item.label}`;
    legend.appendChild(node);
  });
}

function drawAxes({ x, y, width, height, ticks }) {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.fillStyle = "rgba(170,194,193,0.9)";
  ctx.lineWidth = 1;
  ctx.font = "13px Avenir Next, Trebuchet MS, sans-serif";

  ticks.forEach((tick) => {
    const yPos = y + height - ((tick - ticks[0]) / (ticks[ticks.length - 1] - ticks[0])) * height;
    ctx.beginPath();
    ctx.moveTo(x, yPos);
    ctx.lineTo(x + width, yPos);
    ctx.stroke();
    ctx.fillText(`${tick} ₽`, x + 8, yPos - 8);
  });
}

function drawLabels(points, x, y, width, height) {
  ctx.fillStyle = "rgba(239,245,241,0.78)";
  ctx.textAlign = "right";
  ctx.font = "12px Avenir Next, Trebuchet MS, sans-serif";

  points.forEach((point, index) => {
    const xPos = x + (index / Math.max(points.length - 1, 1)) * width;
    ctx.save();
    ctx.translate(xPos + 18, y + height + 24);
    ctx.rotate(-0.45);
    ctx.fillText(point.label, 0, 0);
    ctx.restore();
  });
}

function getTicks(min, max) {
  const padding = 8;
  const floor = Math.floor((min - padding) / 10) * 10;
  const ceil = Math.ceil((max + padding) / 10) * 10;
  const ticks = [];

  for (let current = floor; current <= ceil; current += 10) {
    ticks.push(current);
  }

  return ticks;
}

function mapPoints(points, bounds, minValue, maxValue) {
  return points.map((point, index) => {
    const xPos = bounds.x + (index / Math.max(points.length - 1, 1)) * bounds.width;
    const normalized = (point.value - minValue) / Math.max(maxValue - minValue, 1);
    const yPos = bounds.y + bounds.height - normalized * bounds.height;

    return { ...point, x: xPos, y: yPos };
  });
}

function drawSeries(points, color, options = {}) {
  if (!points.length) {
    return;
  }

  ctx.save();
  ctx.lineWidth = options.width || 3;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (options.dashed) {
    ctx.setLineDash([7, 9]);
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  points.forEach((point) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, options.radius || 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, (options.radius || 5) / 2.1, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawBand(lowSeries, highSeries) {
  if (!lowSeries.length || !highSeries.length) {
    return;
  }

  ctx.save();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(255, 177, 101, 0.22)");
  gradient.addColorStop(1, "rgba(127, 199, 255, 0.06)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  lowSeries.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  for (let index = highSeries.length - 1; index >= 0; index -= 1) {
    ctx.lineTo(highSeries[index].x, highSeries[index].y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderForecastChart() {
  chartTitle.textContent = "Сценарии курса USD/RUB";
  scenarioControls.hidden = false;

  const optimistic = forecastData.optimistic.points;
  const base = forecastData.base.points;
  const stress = forecastData.stress.points;
  const selected = forecastData[state.scenario].points;

  const allValues = [...optimistic, ...base, ...stress, ...consensusTrack].map((item) => item.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const bounds = { x: 70, y: 44, width: canvas.width - 120, height: canvas.height - 148 };
  const ticks = getTicks(minValue, maxValue);

  drawAxes({ ...bounds, ticks });
  drawLabels(base, bounds.x, bounds.y, bounds.width, bounds.height);

  const optimisticMapped = mapPoints(optimistic, bounds, ticks[0], ticks[ticks.length - 1]);
  const stressMapped = mapPoints(stress, bounds, ticks[0], ticks[ticks.length - 1]);
  const baseMapped = mapPoints(base, bounds, ticks[0], ticks[ticks.length - 1]);
  const selectedMapped = mapPoints(selected, bounds, ticks[0], ticks[ticks.length - 1]);
  const consensusMapped = mapPoints(consensusTrack, bounds, ticks[0], ticks[ticks.length - 1]);

  drawBand(optimisticMapped, stressMapped);
  drawSeries(baseMapped, "rgba(255,255,255,0.22)", { width: 2, radius: 4 });
  drawSeries(optimisticMapped, "rgba(131,212,196,0.45)", { width: 2, radius: 4 });
  drawSeries(stressMapped, "rgba(255,177,101,0.45)", { width: 2, radius: 4 });
  drawSeries(consensusMapped, "rgba(127, 199, 255, 0.9)", { width: 2.4, radius: 4, dashed: true });
  drawSeries(selectedMapped, forecastData[state.scenario].color, { width: 4, radius: 6 });

  state.chartPoints = selectedMapped;

  formatLegend([
    { label: `${forecastData[state.scenario].label} (${forecastData[state.scenario].yearEndRange})`, color: forecastData[state.scenario].color },
    { label: "Коридор между сильным рублем и стресс-сценарием", color: "#ffb165" },
    { label: "Медианный средний курс по опросу ЦБ", color: "#7fc7ff" },
  ]);
}

function renderHistoryChart() {
  chartTitle.textContent = "Исторические точки USD/RUB";
  scenarioControls.hidden = true;

  const values = historyData.map((item) => item.value);
  const bounds = { x: 70, y: 44, width: canvas.width - 120, height: canvas.height - 148 };
  const ticks = getTicks(Math.min(...values), Math.max(...values));

  drawAxes({ ...bounds, ticks });
  drawLabels(historyData, bounds.x, bounds.y, bounds.width, bounds.height);

  const mapped = mapPoints(historyData, bounds, ticks[0], ticks[ticks.length - 1]);
  drawSeries(mapped, "#ffbf69", { width: 4, radius: 6 });

  state.chartPoints = mapped;

  formatLegend([
    { label: "Ключевые официальные точки Банка России", color: "#ffbf69" },
    { label: "Самый близкий текущий аналог: 2023–2024", color: "#83d4c4" },
  ]);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderChart() {
  clearCanvas();

  if (state.mode === "forecast") {
    renderForecastChart();
  } else {
    renderHistoryChart();
  }
}

function updateTooltip(point, event) {
  tooltip.hidden = false;
  tooltip.innerHTML = `<strong>${point.label}: ${roundChartValue(point.value)}</strong><span>${point.note}</span>`;

  const rect = canvas.getBoundingClientRect();
  const maxLeft = rect.width - 260;
  const left = Math.min(Math.max(event.offsetX + 16, 16), Math.max(maxLeft, 16));
  const top = Math.max(event.offsetY - 20, 16);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = event.offsetX * scaleX;
  const mouseY = event.offsetY * scaleY;

  const hit = state.chartPoints.find((point) => {
    const dx = point.x - mouseX;
    const dy = point.y - mouseY;
    return Math.sqrt(dx * dx + dy * dy) < 18;
  });

  if (!hit) {
    hideTooltip();
    return;
  }

  updateTooltip(hit, event);
});

canvas.addEventListener("mouseleave", hideTooltip);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    setActiveButton(modeButtons, state.mode, "mode");
    renderChart();
  });
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.scenario = button.dataset.scenario;
    setActiveButton(scenarioButtons, state.scenario, "scenario");
    renderChart();
  });
});

renderChart();
