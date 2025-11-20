document.addEventListener('DOMContentLoaded', () => {
    let dbData = {};

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    const addAnimeForm = document.getElementById('add-anime-form');
    const addEpisodeForm = document.getElementById('add-episode-form');
    const editAnimeSelect = document.getElementById('edit-anime-select');
    const editAnimeForm = document.getElementById('edit-anime-form');
    const deleteAnimeBtn = document.getElementById('delete-anime-btn');
    const editEpisodeSelectDonghua = document.getElementById('edit-episode-select-donghua');
    const editEpisodeSelectEpisode = document.getElementById('edit-episode-select-episode');
    const editEpisodeForm = document.getElementById('edit-episode-form');
    const deleteEpisodeBtn = document.getElementById('delete-episode-btn');
    const scheduleForm = document.getElementById('schedule-form');
    const scheduleList = document.getElementById('schedule-list');
    const resetDataBtn = document.getElementById('reset-data-btn');

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.target;

            tabs.forEach(t => {
                t.classList.remove('text-yellow-400', 'border-yellow-400');
                t.classList.add('text-gray-400', 'border-transparent');
            });
            tab.classList.add('text-yellow-400', 'border-yellow-400');
            tab.classList.remove('text-gray-400', 'border-transparent');

            contents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
    
    const saveDatabase = () => {
        try {
            localStorage.setItem('donghuaDB', JSON.stringify(dbData));
            console.log('--- DATABASE STATE UPDATED AND SAVED TO LOCALSTORAGE ---');
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
            alert("Could not save changes. LocalStorage might be full or disabled.");
        }
    };

    const loadData = async () => {
        try {
            const localData = localStorage.getItem('donghuaDB');
            if (localData) {
                console.log('Loading data from localStorage.');
                dbData = JSON.parse(localData);
            } else {
                console.log('Fetching initial data from db.json.');
                const response = await fetch('../db.json');
                if (!response.ok) throw new Error('Failed to load database.');
                dbData = await response.json();
                localStorage.setItem('donghuaDB', JSON.stringify(dbData)); // Save initial fetch
            }
            if (!dbData.schedule) dbData.schedule = []; // Initialize if not present
            populateSelects();
            renderScheduleList();
        } catch (error) {
            console.error(error);
            alert('Could not load data.');
        }
    };

    const populateSelects = () => {
        const animeOptions = dbData.allDonghua
            .map(d => `<option value="${d.id}">${d.title}</option>`).join('');
        
        addEpisodeForm.querySelector('select').innerHTML = `<option value="">-- Select Anime --</option>${animeOptions}`;
        editAnimeSelect.innerHTML = `<option value="">-- Select Anime to Edit --</option>${animeOptions}`;
        editEpisodeSelectDonghua.innerHTML = `<option value="">-- Select Anime --</option>${animeOptions}`;
        scheduleForm.querySelector('select[name="donghuaId"]').innerHTML = `<option value="">-- Select Anime --</option>${animeOptions}`;

        editEpisodeSelectEpisode.innerHTML = '<option value="">-- Select Episode --</option>';
        editAnimeForm.classList.add('hidden');
        editEpisodeForm.classList.add('hidden');
    };

    // ADD ANIME
    addAnimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAnime = {
            id: Date.now(),
            title: e.target.title.value,
            poster: e.target.poster.value || `https://picsum.photos/200/300?random=${Date.now()}`,
            synopsis: e.target.synopsis.value,
            genres: e.target.genres.value.split(',').map(g => g.trim()),
            type: e.target.type.value,
            rating: parseFloat(e.target.rating.value) || 0,
            isPopular: e.target.isPopular.checked,
            isTopRated: e.target.isTopRated.checked,
            updatedAt: new Date().toISOString(),
            episodes: []
        };
        dbData.allDonghua.unshift(newAnime);
        alert(`'${newAnime.title}' added successfully!`);
        addAnimeForm.reset();
        populateSelects();
        saveDatabase();
    });

    // ADD EPISODE
    addEpisodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const donghuaId = parseInt(e.target.donghua.value);
        if (!donghuaId) return alert('Please select an anime.');
        
        const newEpisode = {
            number: parseInt(e.target.number.value),
            title: e.target.title.value,
            url: e.target.url.value
        };

        const donghuaIndex = dbData.allDonghua.findIndex(d => d.id === donghuaId);
        if (donghuaIndex === -1) return alert('Anime not found.');

        const donghua = dbData.allDonghua[donghuaIndex];
        donghua.episodes.unshift(newEpisode);
        donghua.episodes.sort((a,b) => b.number - a.number); // Keep sorted desc
        donghua.updatedAt = new Date().toISOString();

        // Move donghua to top of the list
        dbData.allDonghua.splice(donghuaIndex, 1);
        dbData.allDonghua.unshift(donghua);

        alert(`Episode ${newEpisode.number} added to ${donghua.title}.`);
        addEpisodeForm.reset();
        populateSelects();
        saveDatabase();
    });

    // EDIT ANIME - Selection
    editAnimeSelect.addEventListener('change', () => {
        const donghuaId = parseInt(editAnimeSelect.value);
        if (!donghuaId) {
            editAnimeForm.classList.add('hidden');
            return;
        }
        const donghua = dbData.allDonghua.find(d => d.id === donghuaId);
        if (!donghua) return;

        editAnimeForm.id.value = donghua.id;
        editAnimeForm.title.value = donghua.title;
        editAnimeForm.poster.value = donghua.poster;
        editAnimeForm.synopsis.value = donghua.synopsis;
        editAnimeForm.genres.value = donghua.genres.join(', ');
        editAnimeForm.type.value = donghua.type;
        editAnimeForm.rating.value = donghua.rating;
        editAnimeForm.isPopular.checked = donghua.isPopular;
        editAnimeForm.isTopRated.checked = donghua.isTopRated || false;
        editAnimeForm.classList.remove('hidden');
    });

    // EDIT ANIME - Submission
    editAnimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const donghuaId = parseInt(e.target.id.value);
        const donghuaIndex = dbData.allDonghua.findIndex(d => d.id === donghuaId);
        if (donghuaIndex === -1) return alert('Anime not found.');

        const donghua = dbData.allDonghua[donghuaIndex];
        const updatedDonghua = {
            ...donghua, // preserve episodes and original ID
            title: e.target.title.value,
            poster: e.target.poster.value,
            synopsis: e.target.synopsis.value,
            genres: e.target.genres.value.split(',').map(g => g.trim()),
            type: e.target.type.value,
            rating: parseFloat(e.target.rating.value),
            isPopular: e.target.isPopular.checked,
            isTopRated: e.target.isTopRated.checked,
            updatedAt: new Date().toISOString(),
        };
        
        dbData.allDonghua[donghuaIndex] = updatedDonghua;
        // Move to top
        dbData.allDonghua.splice(donghuaIndex, 1);
        dbData.allDonghua.unshift(updatedDonghua);

        alert(`'${updatedDonghua.title}' updated successfully.`);
        editAnimeForm.reset();
        editAnimeForm.classList.add('hidden');
        populateSelects();
        editAnimeSelect.value = '';
        saveDatabase();
    });

    // DELETE ANIME
    deleteAnimeBtn.addEventListener('click', () => {
        const donghuaId = parseInt(editAnimeForm.id.value);
        if (!donghuaId) return;

        const donghua = dbData.allDonghua.find(d => d.id === donghuaId);
        if (!donghua) return;

        if (confirm(`Are you sure you want to delete '${donghua.title}'? This action cannot be undone.`)) {
            dbData.allDonghua = dbData.allDonghua.filter(d => d.id !== donghuaId);
            alert(`'${donghua.title}' has been deleted.`);
            
            editAnimeForm.reset();
            editAnimeForm.classList.add('hidden');
            editAnimeSelect.value = '';
            populateSelects();
            saveDatabase();
        }
    });

    // EDIT EPISODE - Donghua Selection
    editEpisodeSelectDonghua.addEventListener('change', () => {
        const donghuaId = parseInt(editEpisodeSelectDonghua.value);
        editEpisodeForm.classList.add('hidden');
        if (!donghuaId) {
            editEpisodeSelectEpisode.innerHTML = '<option value="">-- Select Episode --</option>';
            return;
        }
        const donghua = dbData.allDonghua.find(d => d.id === donghuaId);
        if (!donghua || !donghua.episodes || donghua.episodes.length === 0) {
            editEpisodeSelectEpisode.innerHTML = '<option value="">-- No Episodes Found --</option>';
            return;
        }
        const episodeOptions = donghua.episodes.map(ep => `<option value="${ep.number}">Ep ${ep.number}: ${ep.title}</option>`).join('');
        editEpisodeSelectEpisode.innerHTML = `<option value="">-- Select Episode --</option>${episodeOptions}`;
    });

    // EDIT EPISODE - Episode Selection
    editEpisodeSelectEpisode.addEventListener('change', () => {
        const donghuaId = parseInt(editEpisodeSelectDonghua.value);
        const episodeNumber = parseInt(editEpisodeSelectEpisode.value);
        if (!donghuaId || !episodeNumber) {
            editEpisodeForm.classList.add('hidden');
            return;
        }
        const donghua = dbData.allDonghua.find(d => d.id === donghuaId);
        const episode = donghua.episodes.find(ep => ep.number === episodeNumber);
        if (!episode) return;
        
        editEpisodeForm.donghuaId.value = donghuaId;
        editEpisodeForm.originalNumber.value = episode.number;
        editEpisodeForm.number.value = episode.number;
        editEpisodeForm.title.value = episode.title;
        editEpisodeForm.url.value = episode.url;
        editEpisodeForm.classList.remove('hidden');
    });

    // EDIT EPISODE - Submission
    editEpisodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const donghuaId = parseInt(e.target.donghuaId.value);
        const originalNumber = parseInt(e.target.originalNumber.value);
        
        const donghuaIndex = dbData.allDonghua.findIndex(d => d.id === donghuaId);
        if (donghuaIndex === -1) return alert('Anime not found.');
        
        const donghua = dbData.allDonghua[donghuaIndex];
        const episodeIndex = donghua.episodes.findIndex(ep => ep.number === originalNumber);
        if(episodeIndex === -1) return alert('Episode not found.');

        const updatedEpisode = {
            number: parseInt(e.target.number.value),
            title: e.target.title.value,
            url: e.target.url.value
        };

        donghua.episodes[episodeIndex] = updatedEpisode;
        donghua.episodes.sort((a,b) => b.number - a.number); // re-sort
        donghua.updatedAt = new Date().toISOString();

        // Move donghua to top of the list
        dbData.allDonghua.splice(donghuaIndex, 1);
        dbData.allDonghua.unshift(donghua);

        alert(`Episode ${updatedEpisode.number} of ${donghua.title} updated.`);
        editEpisodeForm.reset();
        editEpisodeForm.classList.add('hidden');
        populateSelects();
        editEpisodeSelectDonghua.value = '';
        editEpisodeSelectEpisode.innerHTML = '<option value="">-- Select Episode --</option>';
        saveDatabase();
    });

    // DELETE EPISODE
    deleteEpisodeBtn.addEventListener('click', () => {
        const donghuaId = parseInt(editEpisodeForm.donghuaId.value);
        const episodeNumber = parseInt(editEpisodeForm.originalNumber.value);
        if (!donghuaId || !episodeNumber) return;

        const donghuaIndex = dbData.allDonghua.findIndex(d => d.id === donghuaId);
        if (donghuaIndex === -1) return;

        const donghua = dbData.allDonghua[donghuaIndex];
        const episode = donghua.episodes.find(ep => ep.number === episodeNumber);
        if (!episode) return;
        
        if (confirm(`Are you sure you want to delete Episode ${episode.number} from '${donghua.title}'?`)) {
            donghua.episodes = donghua.episodes.filter(ep => ep.number !== episodeNumber);
            donghua.updatedAt = new Date().toISOString();

            // Move donghua to top
            dbData.allDonghua.splice(donghuaIndex, 1);
            dbData.allDonghua.unshift(donghua);

            alert(`Episode ${episode.number} deleted from ${donghua.title}.`);
            editEpisodeForm.reset();
            editEpisodeForm.classList.add('hidden');
            populateSelects();
            editEpisodeSelectDonghua.value = '';
            editEpisodeSelectEpisode.innerHTML = '<option value="">-- Select Episode --</option>';
            saveDatabase();
        }
    });

    // --- SCHEDULE MANAGEMENT ---
    const renderScheduleList = () => {
        scheduleList.innerHTML = '';
        if (!dbData.schedule || dbData.schedule.length === 0) {
            scheduleList.innerHTML = '<p class="text-gray-400">No schedule entries yet.</p>';
            return;
        }
        const scheduleItems = dbData.schedule.map(item => {
            const donghua = dbData.allDonghua.find(d => d.id === item.donghuaId);
            return `
                <div class="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                    <div>
                        <p class="font-bold">${donghua ? donghua.title : 'Unknown Anime'}</p>
                        <p class="text-sm text-gray-300">${item.day} at ${item.time}</p>
                    </div>
                    <div class="space-x-2">
                        <button data-id="${item.id}" class="edit-schedule-btn text-blue-400 hover:text-blue-300">Edit</button>
                        <button data-id="${item.id}" class="delete-schedule-btn text-red-500 hover:text-red-400">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        scheduleList.innerHTML = scheduleItems;
    };

    scheduleForm.addEventListener('submit', e => {
        e.preventDefault();
        const scheduleId = parseInt(e.target.scheduleId.value);
        const newEntry = {
            id: scheduleId || Date.now(),
            donghuaId: parseInt(e.target.donghuaId.value),
            day: e.target.day.value,
            time: e.target.time.value
        };

        if (scheduleId) { // Update existing
            const index = dbData.schedule.findIndex(item => item.id === scheduleId);
            if (index !== -1) dbData.schedule[index] = newEntry;
        } else { // Add new
            dbData.schedule.push(newEntry);
        }

        scheduleForm.reset();
        scheduleForm.scheduleId.value = '';
        scheduleForm.querySelector('button[type="submit"]').textContent = 'Add to Schedule';
        renderScheduleList();
        saveDatabase();
    });

    scheduleList.addEventListener('click', e => {
        const id = parseInt(e.target.dataset.id);
        if (e.target.classList.contains('delete-schedule-btn')) {
            if (confirm('Are you sure you want to delete this schedule entry?')) {
                dbData.schedule = dbData.schedule.filter(item => item.id !== id);
                renderScheduleList();
                saveDatabase();
            }
        }
        if (e.target.classList.contains('edit-schedule-btn')) {
            const item = dbData.schedule.find(s => s.id === id);
            if (item) {
                scheduleForm.scheduleId.value = item.id;
                scheduleForm.donghuaId.value = item.donghuaId;
                scheduleForm.day.value = item.day;
                scheduleForm.time.value = item.time;
                scheduleForm.querySelector('button[type="submit"]').textContent = 'Update Schedule';
                scheduleForm.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // RESET DATA
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all data to its original state? All changes will be lost.')) {
                localStorage.removeItem('donghuaDB');
                alert('Data has been reset. The page will now reload.');
                location.reload();
            }
        });
    }

    // Initial Load
    loadData();
});
