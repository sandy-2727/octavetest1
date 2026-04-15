import { trackEvent } from '../common/tracking/tracker.js';
import { formatShortTime, qs } from '../common/utils/helpers.js';
import { createTaskItem } from './components/TaskItem.js';

/** @type {{ id: string; title: string; done: boolean }[]} */
let tasks = [
  { id: 't1', title: 'Wire shared tracker into apps', done: true },
  { id: 't2', title: 'Open via local static server', done: false },
];

function renderList() {
  const list = qs('#task-list');
  if (!list) return;

  list.replaceChildren();
  tasks.forEach((task) => {
    const row = createTaskItem({
      ...task,
      onToggle: (id) => {
        tasks = tasks.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t,
        );
        const updated = tasks.find((t) => t.id === id);
        trackEvent('task_toggle', {
          app: 'app-tasks',
          taskId: id,
          done: updated?.done ?? false,
          at: formatShortTime(Date.now()),
        });
        renderList();
      },
    });
    list.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  trackEvent('page_view', {
    app: 'app-tasks',
    path: '/apps/app-tasks/',
    taskCount: tasks.length,
  });

  renderList();

  qs('#btn-add-sample')?.addEventListener('click', () => {
    const id = `t${Date.now()}`;
    tasks.push({
      id,
      title: `Sample task ${tasks.length + 1}`,
      done: false,
    });
    trackEvent('button_click', {
      app: 'app-tasks',
      id: 'btn-add-sample',
      action: 'add_sample_task',
      newTaskId: id,
    });
    renderList();
  });
});
