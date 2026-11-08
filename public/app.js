const form = document.getElementById('noteForm');
const input = document.getElementById('noteInput');
const notesList = document.getElementById('notesList');

// 1. Fetch notes from the server when the page loads
async function loadNotes() {
    const response = await fetch('/api/notes');
    const notes = await response.json();
    
    notesList.innerHTML = ""; 
    notes.forEach(note => {
        const li = document.createElement('li');
        
        // Create the text span
        const span = document.createElement('span');
        span.textContent = note.text;
        
        // Create the delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        
        // Add the click event for deleting
        deleteBtn.addEventListener('click', async () => {
            await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
            loadNotes(); // Refresh the list automatically!
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        notesList.appendChild(li);
    });
}
// 2. Handle the form submission (Adding a new note)
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the page from refreshing

    const text = input.value;

    // Send the data to our Node.js server
    const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: text })
    });

    if (response.ok) {
        input.value = ""; // Clear the input box
        loadNotes(); // Reload the list to show the new note
    } else {
        alert("Failed to save note.");
    }
});

// Run loadNotes when the page first opens
loadNotes();