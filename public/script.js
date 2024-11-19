const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ]
    }
});

const noteForm = document.getElementById('noteForm');
const titleInput = document.getElementById('titleInput');
const noteIdInput = document.getElementById('noteId');
const notesList = document.getElementById('notesList');
const resetBtn = document.getElementById('resetBtn');
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let noteToDeleteIndex = null;

const viewNoteTitle = document.getElementById('viewNoteTitle');
const viewNoteDate = document.getElementById('viewNoteDate');
const viewNoteContent = document.getElementById('viewNoteContent');
const noResultsAlert = document.getElementById('noResultsAlert');
const searchInput = document.querySelector('input[type="search"]');
const mainContainer = document.getElementById('mainContainer');

function updateContainerClass() {
    if (window.innerWidth < 768) {
        mainContainer.classList.remove('container');
        mainContainer.classList.add('container-fluid');
    } else {
        mainContainer.classList.remove('container-fluid');
        mainContainer.classList.add('container');
    }
}

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});

updateContainerClass();

window.addEventListener('resize', updateContainerClass);

let notes = JSON.parse(localStorage.getItem('notes')) || [];

function saveNotesToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function displayNotes(filteredNotes) {
    notesList.innerHTML = '';
    const sortedNotes = (filteredNotes || notes).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.date) - new Date(a.date);
    });

    if (sortedNotes.length === 0) {
        noResultsAlert.classList.remove('d-none');
    } else {
        noResultsAlert.classList.add('d-none');
    }

    sortedNotes.forEach((note, index) => {
        const truncatedTitle = note.title.length > 15 ? note.title.substring(0, 15) + '...' : note.title;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-3 mb-3';
        col.innerHTML = `
           <div class="shadow-lg card note-card h-100 border border-2 rounded-3 ${note.pinned ? 'border-secondary' : ''}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title text-light text-truncate" title="${note.title}">${truncatedTitle}</h5>
                        <button class="btn btn-sm btn-light pin-btn" data-index="${index}">
                            <i class="bi ${note.pinned ? 'bi-pin-fill' : 'bi-pin-angle-fill'}"></i>
                        </button>
                    </div>
                    <p class="card-text small text-secondary">${new Date(note.date).toLocaleString()}</p>
                    <div class="mt-auto d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-light view-btn" data-index="${index}">
                            <i class="bi bi-search"></i>
                        </button>
                        <button class="btn btn-sm btn-light edit-btn" data-index="${index}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-light delete-btn" data-index="${index}" data-bs-toggle="modal" data-bs-target="#deleteConfirmModal">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        notesList.appendChild(col);
    });
}

noteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value;
    const content = quill.root.innerHTML;
    const date = new Date().toISOString();

    if (noteIdInput.value) {
        notes[noteIdInput.value] = { title, content, date };
        noteIdInput.value = '';
    } else {
        notes.push({ title, content, date });
    }

    saveNotesToLocalStorage();
    displayNotes();
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
    const modal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
    modal.hide();
});

resetBtn.addEventListener('click', () => {
    quill.setContents([]);
    titleInput.value = '';
    noteIdInput.value = '';
    document.getElementById('noteModalLabel').innerText = 'Add Note';
});

notesList.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const index = button.getAttribute('data-index');

    if (button.classList.contains('view-btn')) {
        const note = notes[index];
        viewNoteTitle.innerText = note.title;
        viewNoteDate.innerText = new Date(note.date).toLocaleString();
        viewNoteContent.innerHTML = note.content;

        const viewModal = new bootstrap.Modal(document.getElementById('viewNoteModal'));
        viewModal.show();
    } else if (button.classList.contains('edit-btn')) {
        const note = notes[index];
        titleInput.value = note.title;
        noteIdInput.value = index;
        quill.root.innerHTML = note.content;
        document.getElementById('noteModalLabel').innerText = 'Edit Note';

        const editModal = bootstrap.Modal.getInstance(document.getElementById('noteModal'));
        if (editModal) {
            editModal.show();
        } else {
            const newEditModal = new bootstrap.Modal(document.getElementById('noteModal'));
            newEditModal.show();
        }
    } else if (button.classList.contains('delete-btn')) {
        noteToDeleteIndex = index;
    } else if (button.classList.contains('pin-btn')) {
        const note = notes[index];
        note.pinned = !note.pinned;

        notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });

        saveNotesToLocalStorage();
        displayNotes();
    }
});

confirmDeleteBtn.addEventListener('click', () => {
    if (noteToDeleteIndex !== null) {
        notes.splice(noteToDeleteIndex, 1);
        saveNotesToLocalStorage();
        displayNotes();
        noteToDeleteIndex = null;
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toast.show();
    }
    deleteConfirmModal.hide();
});


const noteModal = document.getElementById('noteModal');

noteModal.addEventListener('show.bs.modal', () => {
    if (noteIdInput.value) {
        document.getElementById('noteModalLabel').innerText = 'Edit Note';
    } else {
        document.getElementById('noteModalLabel').innerText = 'Add Note';
    }
});
noteModal.addEventListener('hidden.bs.modal', () => {
    quill.setContents([]);
    titleInput.value = '';
    noteIdInput.value = '';
});

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => note.title.toLowerCase().includes(searchTerm));
    displayNotes(filteredNotes);
});

displayNotes();