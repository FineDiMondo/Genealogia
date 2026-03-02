class DashboardApi {
  async getMetrics() {
    const res = await fetch("/api/v1/dashboard/metrics");
    return res.json();
  }
  async getSourceStatistics() {
    const res = await fetch("/api/v1/dashboard/sources");
    return res.json();
  }
  async getProcessingTimeline() {
    const res = await fetch("/api/v1/dashboard/timeline");
    return res.json();
  }
  async getReuseMetrics() {
    const res = await fetch("/api/v1/dashboard/reuse");
    return res.json();
  }
  async getQualityAnalytics() {
    const res = await fetch("/api/v1/dashboard/quality");
    return res.json();
  }
}

class DomainCounters {
  constructor(container, api) {
    this.container = container;
    this.api = api;
    this.domains = [
      "individuals",
      "families",
      "heraldry",
      "noble_titles",
      "possessions",
      "family_history",
      "descriptions",
    ];
  }
  _label(domain) {
    const map = {
      individuals: "Individuals",
      families: "Families",
      heraldry: "Heraldry",
      noble_titles: "Noble Titles",
      possessions: "Possessions",
      family_history: "Family History",
      descriptions: "Descriptions",
    };
    return map[domain] || domain;
  }
  async render() {
    const payload = await this.api.getMetrics();
    const cards = this.domains
      .map((domain) => {
        const data = payload.domains[domain] || { total: 0, normalized: 0, quality_score: 0, avg_confidence: 0 };
        const pct = data.total ? Math.round((data.normalized / data.total) * 100) : 0;
        return `
          <article class="counter-card">
            <h3>${this._label(domain)}</h3>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="metric-row"><strong>${data.normalized}</strong><span> / ${data.total}</span></div>
            <div class="metric-row"><span>${pct}% normalized</span><span>Q ${Number(data.quality_score || 0).toFixed(1)}%</span></div>
          </article>
        `;
      })
      .join("");
    this.container.innerHTML = `<h2>Real-Time Counters</h2><div class="cards-grid">${cards}</div>`;
  }
}

class NormalizationStatus {
  constructor(container, api) {
    this.container = container;
    this.api = api;
  }
  async render() {
    const payload = await this.api.getMetrics();
    const s = payload.overall || {};
    const score = Number(s.quality_score || 0);
    this.container.innerHTML = `
      <h2>Normalization Status</h2>
      <div class="status-grid">
        <div class="status-item"><div>Total Records Processed</div><div class="value">${s.total_records || 0}</div></div>
        <div class="status-item"><div>Auto-Approved</div><div class="value approved">${s.auto_approved || 0}</div></div>
        <div class="status-item"><div>Flagged</div><div class="value flagged">${s.flagged || 0}</div></div>
        <div class="status-item"><div>Pending Review</div><div class="value pending">${s.pending_review || 0}</div></div>
      </div>
      <div class="metric-row"><span>Quality Score</span><strong>${score.toFixed(1)}%</strong></div>
      <div class="bar"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, score))}%"></div></div>
      <div class="metric-row"><span>Last Sync</span><span>${new Date(s.last_sync || Date.now()).toLocaleString()}</span></div>
    `;
  }
}

class DataSources {
  constructor(container, api) {
    this.container = container;
    this.api = api;
  }
  async render() {
    const payload = await this.api.getSourceStatistics();
    const items = Object.entries(payload.sources || {})
      .map(([name, data]) => {
        const pct = Number(data.percentage || 0);
        return `
          <div class="source-item">
            <div class="metric-row"><span>${name}</span><span>${data.count || 0} records</span></div>
            <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      })
      .join("");
    const flow = payload.data_flow || {};
    this.container.innerHTML = `
      <h2>Data Sources & Lineage</h2>
      <div class="sources-list">${items || "<p>No source data yet.</p>"}</div>
      <div class="metric-row"><span>Imported Data (raw)</span><strong>${flow.imported_raw || 0}</strong></div>
      <div class="metric-row"><span>Normalized Data (clean)</span><strong>${flow.normalized_clean || 0}</strong></div>
      <div class="metric-row"><span>Quality Improvement</span><strong>+${Number(flow.quality_improvement || 0).toFixed(1)}%</strong></div>
    `;
  }
}

class ProcessingTimeline {
  constructor(container, api) {
    this.container = container;
    this.api = api;
  }
  async render() {
    const payload = await this.api.getProcessingTimeline();
    const rows = payload.timeline || [];
    const max = Math.max(1, ...rows.map((r) => Number(r.normalized || 0)));
    const html = rows
      .map((r) => {
        const width = Math.round((Number(r.normalized || 0) / max) * 100);
        const change = Number(r.change || 0);
        const trendClass = change > 0 ? "increasing" : change < 0 ? "decreasing" : "stable";
        const marker = change > 0 ? "↑" : change < 0 ? "↓" : "→";
        return `
          <div class="timeline-item">
            <div class="metric-row"><span>${r.label}</span><span>${r.normalized || 0}</span></div>
            <div class="bar"><div class="bar-fill" style="width:${width}%"></div></div>
            <div class="period-stats"><span class="trend ${trendClass}">${marker} ${Math.abs(change)}%</span></div>
          </div>
        `;
      })
      .join("");
    this.container.innerHTML = `
      <h2>Processing Timeline</h2>
      ${html || "<p>No timeline yet.</p>"}
      <p><strong>Trend:</strong> ${payload.trend || "N/A"}</p>
    `;
  }
}

class ReuseOptimization {
  constructor(container, api) {
    this.container = container;
    this.api = api;
  }
  async render() {
    const r = await this.api.getReuseMetrics();
    const byDomain = (r.by_domain || [])
      .map((d) => `<div class="cache-domain"><span>${d.name}</span><span>${d.cached} cached / ${d.times_reused} reused</span></div>`)
      .join("");
    this.container.innerHTML = `
      <h2>Reuse Optimization</h2>
      <div class="metric-row"><span>Records in Cache</span><strong>${r.cache_records || 0}</strong></div>
      <div class="metric-row"><span>Cache Hit Rate</span><strong>${Number(r.cache_hit_rate || 0).toFixed(1)}%</strong></div>
      <div class="metric-row"><span>Time Saved</span><strong>${Number((r.time_saved_total_minutes || 0) / 60).toFixed(1)}h</strong></div>
      <div class="metric-row"><span>Research Efficiency Gain</span><strong>+${Number(r.efficiency_gain || 0).toFixed(0)}%</strong></div>
      <h3>Cache by Domain</h3>
      ${byDomain || "<p>No cache data yet.</p>"}
    `;
  }
}

class QualityAnalytics {
  constructor(container, api) {
    this.container = container;
    this.api = api;
  }
  async render() {
    const q = await this.api.getQualityAnalytics();
    const metrics = [
      ["Data Completeness", q.completeness],
      ["Source Agreement", q.source_agreement],
      ["Avg Confidence Score", q.avg_confidence],
      ["Conflict Resolution Rate", q.conflict_resolution_rate],
    ];
    this.container.innerHTML = `
      <h2>Quality Analytics</h2>
      ${metrics
        .map(
          ([label, value]) => `
            <div class="quality-item">
              <div class="metric-row"><span>${label}</span><strong>${Number(value || 0).toFixed(1)}%</strong></div>
              <div class="bar"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, Number(value || 0)))}%"></div></div>
            </div>
          `
        )
        .join("")}
    `;
  }
}

class DashboardMonitor {
  constructor(updateInterval = 30000) {
    this.updateInterval = updateInterval;
    this.components = [];
  }
  register(component) {
    this.components.push(component);
  }
  async updateAll() {
    for (const section of this.components) {
      try {
        section.el.classList.add("updating");
        await section.component.render();
      } catch (err) {
        section.el.innerHTML = `<h2>${section.title}</h2><p>Update error: ${err}</p>`;
      } finally {
        section.el.classList.remove("updating");
      }
    }
  }
  startMonitoring() {
    this.updateAll();
    setInterval(() => this.updateAll(), this.updateInterval);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const api = new DashboardApi();
  const monitor = new DashboardMonitor(30000);
  monitor.register({
    title: "Real-Time Counters",
    el: document.getElementById("domain-counters"),
    component: new DomainCounters(document.getElementById("domain-counters"), api),
  });
  monitor.register({
    title: "Normalization Status",
    el: document.getElementById("normalization-status"),
    component: new NormalizationStatus(document.getElementById("normalization-status"), api),
  });
  monitor.register({
    title: "Data Sources & Lineage",
    el: document.getElementById("data-sources"),
    component: new DataSources(document.getElementById("data-sources"), api),
  });
  monitor.register({
    title: "Processing Timeline",
    el: document.getElementById("processing-timeline"),
    component: new ProcessingTimeline(document.getElementById("processing-timeline"), api),
  });
  monitor.register({
    title: "Reuse Optimization",
    el: document.getElementById("reuse-optimization"),
    component: new ReuseOptimization(document.getElementById("reuse-optimization"), api),
  });
  monitor.register({
    title: "Quality Analytics",
    el: document.getElementById("quality-analytics"),
    component: new QualityAnalytics(document.getElementById("quality-analytics"), api),
  });
  monitor.startMonitoring();
});
