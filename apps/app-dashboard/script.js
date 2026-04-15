import { trackEvent, getTracker } from '../common/tracking/tracker.js';
import { qs } from '../common/utils/helpers.js';
import { createMetricCard } from './components/MetricCard.js';

function renderMetrics(container) {
  container.replaceChildren(
    createMetricCard({
      label: 'Active sessions',
      value: '128',
      hint: 'Rolling 24h window',
    }),
    createMetricCard({
      label: 'Conversion',
      value: '3.4%',
      hint: 'Demo placeholder',
    }),
    createMetricCard({
      label: 'Latency p95',
      value: '412 ms',
      hint: 'Synthetic',
    }),
  );
}

document.addEventListener('DOMContentLoaded', () => {
  trackEvent('page_view', {
    app: 'app-dashboard',
    path: '/apps/app-dashboard/',
  });

  const metrics = qs('#metrics');
  if (metrics) renderMetrics(metrics);

  qs('#btn-refresh')?.addEventListener('click', () => {
    trackEvent('button_click', {
      app: 'app-dashboard',
      id: 'btn-refresh',
      action: 'simulate_refresh',
    });
    if (metrics) renderMetrics(metrics);
  });

  qs('#btn-export')?.addEventListener('click', () => {
    trackEvent('button_click', {
      app: 'app-dashboard',
      id: 'btn-export',
      action: 'log_tracker_history',
    });
    console.table(getTracker().getHistory());
  });
});
