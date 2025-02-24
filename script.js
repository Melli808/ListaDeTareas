const DOM = {
    taskForm: document.getElementById('task-form'),
    taskInput: document.getElementById('task-input'),
    taskPriority: document.getElementById('task-priority'),
    taskDueDate: document.getElementById('task-due-date'),
    taskCategory: document.getElementById('task-category'),
    taskList: document.getElementById('task-list'),
    filters: {
      all: document.getElementById('filter-all'),
      completed: document.getElementById('filter-completed'),
      pending: document.getElementById('filter-pending')
    },
    searchInput: document.getElementById('search-input'),
    taskCount: document.getElementById('task-count'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    toggleDarkMode: document.getElementById('toggle-dark-mode')
  };
  
  class TaskManager {
    constructor() {
      this.tasks = this.loadTasks();
      this.renderTasks();
      this.updateTaskCount();
      this.setupEventListeners();
      this.checkDueDates();
    }
  
    loadTasks() {
      return JSON.parse(localStorage.getItem('tasks')) || [];
    }
  
    saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
  
    addTask(taskData) {
      const task = {
        id: Date.now(),
        text: taskData.text,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        category: taskData.category,
        completed: false,
        subtasks: []
      };
      this.tasks.push(task);
      this.saveTasks();
      this.addTaskToDOM(task);
      this.updateTaskCount();
    }
  
    addTaskToDOM(task) {
      const li = document.createElement('li');
      li.className = `task-item priority-${task.priority} category-${task.category}`;
      li.dataset.id = task.id;
      li.draggable = true;
      if (task.completed) li.classList.add('completed');
  
      li.innerHTML = `
        <span class="task-text">${task.text}</span>
        <small>(${task.priority}, ${task.category})</small>
        <div class="task-actions">
          <small class="due-date">${task.dueDate || ''}</small>
          <button class="edit-btn">Editar</button>
          <button class="delete-btn">Eliminar</button>
          <button class="add-subtask-btn">+ Subtarea</button>
        </div>
        <ul class="subtask-list">${this.renderSubtasks(task.subtasks)}</ul>
      `;
  
      this.setupTaskEventListeners(li, task);
      DOM.taskList.appendChild(li);
    }
  
    setupTaskEventListeners(li, task) {
      li.querySelector('.task-text').addEventListener('click', () => this.toggleTask(task));
      li.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task, li));
      li.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task, li));
      li.querySelector('.add-subtask-btn').addEventListener('click', () => this.addSubtask(task));
      
      // Subtareas completables
      li.querySelectorAll('.subtask-list input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const subtaskId = Number(checkbox.dataset.id);
          const subtask = task.subtasks.find(st => st.id === subtaskId);
          subtask.completed = checkbox.checked;
          this.saveTasks();
          this.renderTasks();
        });
      });
    }
  
    toggleTask(task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateTaskCount();
    }
  
    editTask(task, li) {
      const span = li.querySelector('.task-text');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = task.text;
      input.className = 'edit-input';
      span.replaceWith(input);
      input.focus();
  
      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
          task.text = newText;
          this.saveTasks();
          this.renderTasks();
        }
      };
  
      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
      });
    }
  
    deleteTask(task, li) {
      this.tasks = this.tasks.filter(t => t.id !== task.id);
      this.saveTasks();
      li.remove();
      this.updateTaskCount();
    }
  
    addSubtask(task) {
      const subtaskText = prompt('Añade una subtarea:')?.trim();
      if (subtaskText) {
        const subtask = { id: Date.now(), text: subtaskText, completed: false };
        task.subtasks = task.subtasks || [];
        task.subtasks.push(subtask);
        this.saveTasks();
        this.renderTasks();
      }
    }
  
    renderSubtasks(subtasks) {
      return (subtasks || []).map(subtask => `
        <li class="${subtask.completed ? 'completed' : ''}">
          <input type="checkbox" ${subtask.completed ? 'checked' : ''} data-id="${subtask.id}">
          ${subtask.text}
        </li>
      `).join('');
    }
  
    renderTasks(filter = 'all') {
      DOM.taskList.innerHTML = '';
      this.tasks
        .filter(task => filter === 'all' || 
               (filter === 'completed' && task.completed) || 
               (filter === 'pending' && !task.completed))
        .forEach(task => this.addTaskToDOM(task));
    }
  
    updateTaskCount() {
    const completed = this.tasks.filter(t => t.completed).length;
    const total = this.tasks.length;
    DOM.taskCount.textContent = `Tareas: ${total} | Completadas: ${completed}`;
    document.getElementById('progress-fill').style.width = total ? `${(completed / total) * 100}%` : '0%';
  
    // Estadísticas de prioridad
    const high = this.tasks.filter(t => t.priority === 'alta').length;
    const medium = this.tasks.filter(t => t.priority === 'media').length;
    const low = this.tasks.filter(t => t.priority === 'baja').length;
    document.getElementById('priority-stats').textContent = `Prioridades: Alta: ${high} | Media: ${medium} | Baja: ${low}`;
  
    // Estadísticas de categoría
    const work = this.tasks.filter(t => t.category === 'trabajo').length;
    const personal = this.tasks.filter(t => t.category === 'personal').length;
    const study = this.tasks.filter(t => t.category === 'estudio').length;
    const others = this.tasks.filter(t => t.category === 'otros').length;
    document.getElementById('category-stats').textContent = `Categorías: Trabajo: ${work} | Personal: ${personal} | Estudio: ${study} | Otros: ${others}`;
  }
  
    searchTasks(searchText) {
      DOM.taskList.innerHTML = '';
      this.tasks
        .filter(task => task.text.toLowerCase().includes(searchText.toLowerCase()))
        .forEach(task => this.addTaskToDOM(task));
    }
  
    exportTasks() {
      const blob = new Blob([JSON.stringify(this.tasks)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tareas_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  
    importTasks(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.tasks = JSON.parse(e.target.result);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();
      };
      reader.readAsText(file);
    }
  
    updateTaskOrder() {
      const taskIds = [...DOM.taskList.querySelectorAll('.task-item')].map(item => Number(item.dataset.id));
      this.tasks.sort((a, b) => taskIds.indexOf(a.id) - taskIds.indexOf(b.id));
      this.saveTasks();
    }
  
    checkDueDates() {
      this.tasks.forEach(task => {
        if (!task.dueDate || task.completed) return;
        const dueDate = new Date(task.dueDate);
        const hoursDiff = (dueDate - new Date()) / (1000 * 60 * 60);
        if (hoursDiff <= 24 && hoursDiff > 0) {
          this.showNotification(`La tarea "${task.text}" vence en menos de 24 horas`);
        }
      });
    }
  
    showNotification(message) {
      if (Notification.permission === 'granted') {
        new Notification(message);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') new Notification(message);
        });
      }
    }
  
    setupEventListeners() {
      DOM.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = DOM.taskInput.value.trim();
        if (taskText) {
          this.addTask({
            text: taskText,
            priority: DOM.taskPriority.value,
            dueDate: DOM.taskDueDate.value,
            category: DOM.taskCategory.value
          });
          DOM.taskInput.value = '';
          DOM.taskDueDate.value = '';
        }
      });
  
      DOM.filters.all.addEventListener('click', () => this.renderTasks('all'));
      DOM.filters.completed.addEventListener('click', () => this.renderTasks('completed'));
      DOM.filters.pending.addEventListener('click', () => this.renderTasks('pending'));
  
      DOM.searchInput.addEventListener('input', (e) => this.searchTasks(e.target.value));
      DOM.exportBtn.addEventListener('click', () => this.exportTasks());
      DOM.importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => this.importTasks(e.target.files[0]);
        input.click();
      });
  
      DOM.toggleDarkMode.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
      });
  
      DOM.taskList.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.task-item');
        if (item) {
          e.dataTransfer.setData('text/plain', item.dataset.id);
          item.classList.add('dragging');
        }
      });
  
      DOM.taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = DOM.taskList.querySelector('.dragging');
        const afterElement = this.getDragAfterElement(e.clientY);
        if (afterElement) {
          DOM.taskList.insertBefore(draggingItem, afterElement);
        } else {
          DOM.taskList.appendChild(draggingItem);
        }
      });
  
      DOM.taskList.addEventListener('dragend', (e) => {
        const item = e.target.closest('.task-item');
        if (item) {
          item.classList.remove('dragging');
          this.updateTaskOrder();
        }
      });
    }
  
    getDragAfterElement(y) {
      const items = [...DOM.taskList.querySelectorAll('.task-item:not(.dragging)')];
      return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset) ? 
          { offset, element: child } : closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }
  
  const app = new TaskManager();
  setInterval(() => app.checkDueDates(), 60000);
  
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }