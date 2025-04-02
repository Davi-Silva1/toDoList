document.addEventListener('DOMContentLoaded', function() {

    const themeToggle = document.getElementById('theme-toggle');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const newTaskBtn = document.getElementById('new-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const taskList = document.getElementById('task-list');
    const taskInputContainer = document.getElementById('task-input-container');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const filterLinks = document.querySelectorAll('.nav-link[data-filter]');
    const currentFilterEl = document.getElementById('current-filter');
    const priorityBtns = document.querySelectorAll('.priority-btn');
    const taskActionsEl = document.getElementById('task-actions');
    const toastEl = document.getElementById('toast');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentPriority = 'medium';
    let darkMode = localStorage.getItem('darkMode') === 'true';

    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    renderTasks();
    updateStats();
    hideTaskInput();
    updateNewTaskButtonVisibility();

    themeToggle.addEventListener('click', toggleTheme);
    newTaskBtn.addEventListener('click', showTaskInput);
    cancelTaskBtn.addEventListener('click', hideTaskInput);
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    filterLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            currentFilter = this.dataset.filter;
            updateActiveNav();
            renderTasks();
            updateNewTaskButtonVisibility();
        });
    });

    priorityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            priorityBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPriority = this.dataset.priority;
        });
    });

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        darkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', darkMode);
    }

    function showTaskInput() {
        taskInputContainer.style.display = 'block';
        taskInput.focus();
    }

    function hideTaskInput() {
        taskInputContainer.style.display = 'none';
        taskInput.value = '';
        priorityBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.priority-btn[data-priority="medium"]').classList.add('active');
        currentPriority = 'medium';
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if (!taskText) {
            showToast("Please type some task to add!", true);
            taskInput.focus();
            return;
        }

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            important: false,
            priority: currentPriority,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        hideTaskInput();
        renderTasks();
        updateStats();
        
        showToast("Task added successfully!");
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;

        switch (currentFilter) {
            case 'important':
                filteredTasks = filteredTasks.filter(task => task.important);
                currentFilterEl.textContent = 'Important Tasks';
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                currentFilterEl.textContent = 'Completed Tasks';
                break;
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                currentFilterEl.textContent = 'Pending Tasks';
                break;
            default:
                currentFilterEl.textContent = 'All Tasks';
        }

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-inbox"></i></div>
                    <p>No tasks found. ${currentFilter === 'all' || currentFilter === 'pending' ? 'Add a new task!' : ''}</p>
                </div>
            `;
            return;
        }

        filteredTasks.forEach(task => {
            const taskEl = document.createElement('li');
            taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskEl.dataset.id = task.id;

            taskEl.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">
                        <span class="priority-indicator priority-${task.priority}"></span>
                        <span class="task-important ${task.important ? 'active' : ''}">${task.important ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'}</span>
                        ${task.text}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button class="task-btn delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

   
            const checkbox = taskEl.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderTasks();
                updateStats();
            });


            const importantBtn = taskEl.querySelector('.task-important');
            importantBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                task.important = !task.important;
                saveTasks();
                renderTasks();
            });

            const deleteBtn = taskEl.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
                updateStats();
                showToast("Task deleted!");
            });

            const editBtn = taskEl.querySelector('.edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(task);
            });

            taskList.appendChild(taskEl);
        });
    }

    function editTask(task) {
        const newText = prompt('Edit task text:', task.text);
        if (newText === null) return;
        
        const newPriority = prompt('Edit priority (low/medium/high):', task.priority);
        if (newPriority === null) return;
        
        if (newText && newText.trim() !== '') {
            task.text = newText.trim();
        }
        
        if (['low', 'medium', 'high'].includes(newPriority.toLowerCase())) {
            task.priority = newPriority.toLowerCase();
        }
        
        saveTasks();
        renderTasks();
        showToast("Task updated!");
    }

    function updateActiveNav() {
            filterLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.filter === currentFilter);
        });
    }

    function updateNewTaskButtonVisibility() {
        if (currentFilter === 'completed' || currentFilter === 'important') {
            taskActionsEl.style.display = 'none';
        } else {
            taskActionsEl.style.display = 'flex';
        }
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    function showToast(message, isError = false) {
        toastEl.textContent = message;
        toastEl.className = 'toast';
        
        if (isError) {
            toastEl.classList.add('error');
        } else {
            toastEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--toast');
        }
        
        toastEl.classList.add('show');
        
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }
});