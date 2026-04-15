/**
 * Single task row component for the tasks app.
 * @param {{ id: string; title: string; done: boolean; onToggle: (id: string) => void }} props
 * @returns {HTMLElement}
 */
export function createTaskItem({ id, title, done, onToggle }) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.taskId = id;

  const label = document.createElement('label');
  label.className = 'task-item__label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = done;
  checkbox.addEventListener('change', () => onToggle(id));

  const span = document.createElement('span');
  span.textContent = title;
  if (done) span.classList.add('task-item__title--done');

  label.append(checkbox, span);
  li.appendChild(label);
  return li;
}
