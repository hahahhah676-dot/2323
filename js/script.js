document.addEventListener('DOMContentLoaded', () => {
    let dbData = {};

    // =======================================================
    // BAGIAN ROUTER (PENGONTROL NAVIGASI)
    // =======================================================
    const router = () => {
        const path = window.location.pathname;

        // Pola: /player/donghua-slug/episode-slug
        const playerMatch = path.match(/^\/player\/([a-z0-9-]+)\/([a-z0-9-]+)$/);
        if (playerMatch) {
            const [, donghuaSlug, episodeSlug] = playerMatch;
            const item = dbData.allDonghua.find(d => d.slug === donghuaSlug);
            if (item) {
                const episode = item.episodes.find(ep => ep.slug === episodeSlug);
                if (episode) {
                    renderPlayerPage(item, episode);
                } else { console.error("Episode not found!"); }
            } else { console.error("Donghua not found!"); }
            return;
        }

        // Pola: /detail/donghua-slug
        const detailMatch = path.match(/^\/detail\/([a-z0-9-]+)$/);
        if (detailMatch) {
            const [, donghuaSlug] = detailMatch;
            const item = dbData.allDonghua.find(d => d.slug === donghuaSlug);
            if (item) {
                renderDetailPage(item);
            } else { console.error("Donghua not found!"); }
            return;
        }

        // Routing untuk halaman statis
        if (path === '/donghua') {
            showPage('donghua-page');
            return;
        }
        if (path === '/movie') {
            showPage('movie-page');
            return;
        }
        if (path === '/genre') {
            renderAllGenresPage();
            return;
        }
        if (path === '/schedule') {
            showPage('schedule-page');
            return;
        }

        // Jika tidak ada yang cocok (termasuk path '/'), tampilkan halaman utama
        showPage('home-page');
    };
    
    // =======================================================
    // FUNGSI INTI
    // =======================================================

    const pages = document.querySelectorAll('.page-content');
    const mobileNavLinks = document.querySelectorAll('nav.lg\\:hidden a.nav-link');
    const desktopNavLinks = document.querySelectorAll('nav.lg\\:flex a.nav-link');

    function showPage(pageId) {
        pages.forEach(page => page.classList.add('hidden'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            window.scrollTo(0, 0);
        }

        // Logika untuk menandai link navigasi yang aktif (opsional tapi bagus)
        const currentPath = window.location.pathname;
        const targetPath = (pageId === 'home-page') ? '/' : `/${pageId.replace('-page', '')}`;
        
        [...mobileNavLinks, ...desktopNavLinks].forEach(link => {
            link.classList.remove('text-yellow-400', 'font-bold');
            link.classList.add('text-gray-400');
            const linkPath = link.getAttribute('href');
            if (linkPath === currentPath || linkPath === targetPath) {
                 link.classList.add('text-yellow-400', 'font-bold');
                 link.classList.remove('text-gray-400');
            }
        });
    }

    const loadContent = async () => {
        try {
            const response = await fetch('./db.json');
            if (!response.ok) throw new Error('Network response was not ok');
            dbData = await response.json();
            
            dbData.allDonghua.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            populatePopularSlider(dbData.allDonghua.filter(item => item.isPopular));
            populateLatestEpisodes(dbData.allDonghua);
            populatePopularDonghua(dbData.allDonghua.filter(item => item.isPopular));
            populateSidebarPopular(dbData.allDonghua);
            populateGenres(dbData.genres);
            populateSchedulePage(dbData.schedule, dbData.allDonghua);
            populateDonghuaPage(dbData.allDonghua.filter(item => item.type === 'TV Series'));
            populateMoviePage(dbData.allDonghua.filter(item => item.type === 'Movie'));
        } catch (error) {
            console.error('Failed to load content:', error);
        }
    };

    const createDonghuaCard = (item) => {
        let typeTagHtml = '';
        if (item.type === 'TV Series' && item.episodes && item.episodes.length > 0) {
            const latestEp = Math.max(...item.episodes.map(ep => ep.number));
            typeTagHtml = `<div class="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md">${latestEp}</div>`;
        } else if (item.type === 'Movie') {
            typeTagHtml = `<div class="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md">Movie</div>`;
        }
        return `
            <a href="/detail/${item.slug}" class="nav-link block relative bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition duration-300">
                <img src="${item.poster}" alt="${item.title}" class="w-full h-36 md:h-48 object-cover">
                ${typeTagHtml}
                <div class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                    <h3 class="font-bold text-xs text-white">${item.title}</h3>
                </div>
            </a>
        `;
    };

    // ... (Semua fungsi 'populate' Anda yang lain di sini, tidak perlu diubah)
    const populateLatestEpisodes = (items) => { /* ... kode Anda ... */ };
    const populatePopularDonghua = (items) => { /* ... kode Anda ... */ };
    // ... dan seterusnya ...

    const createEpisodeSelector = (item, currentEpisodeSlug = null) => {
        if (!item.episodes || item.episodes.length === 0) return '';
        const sortedEpisodes = [...item.episodes].sort((a, b) => a.number - b.number);
        // ... (sisa logika Anda untuk membuat tab dan grid)
        const gridItems = episodesInRange.map(ep => {
            const isCurrent = ep.slug === currentEpisodeSlug;
            return `
                <a href="/player/${item.slug}/${ep.slug}" 
                   class="nav-link flex items-center justify-center p-2 h-10 rounded-md transition duration-200 text-center text-sm
                          ${isCurrent ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-700 hover:bg-yellow-500 hover:text-gray-900'}">
                    ${ep.number}
                </a>
            `;
        }).join('');
        // ... (return string HTML lengkap Anda)
    };

    const renderDetailPage = (item) => {
        if (!item) return;
        const container = document.getElementById('detail-page-content');
        const episodeSelectorHtml = createEpisodeSelector(item);
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <div class="md:w-1/3 flex-shrink-0">
                    <img src="${item.poster}" alt="${item.title}" class="w-2/3 mx-auto md:w-full md:mx-0 aspect-[2/3] object-cover rounded-lg shadow-lg">
                </div>
                <div class="md:w-2/3">
                    <h2 class="text-4xl font-bold text-yellow-400 mb-2">${item.title}</h2>
                    <p class="text-lg text-yellow-400 mb-4"><i class="fa fa-star"></i> ${item.rating || 'N/A'}</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${item.genres.map(g => `<span class="bg-gray-700 text-xs py-1 px-3 rounded-full">${g}</span>`).join('')}
                    </div>
                    <p class="text-gray-300 mb-6">${item.synopsis}</p>
                    ${episodeSelectorHtml}
                </div>
            </div>`;
        showPage('detail-page');
    };

    const renderPlayerPage = (item, episode) => {
        if (!item || !episode) return;
        const container = document.getElementById('player-page-content');
        const episodeSelectorHtml = createEpisodeSelector(item, episode.slug);
        const highestEpisode = item.episodes.reduce((max, ep) => ep.number > max ? ep.number : max, 0);
        container.innerHTML = `
             <div class="flex flex-col lg:flex-row gap-8">
                <div class="w-full lg:w-2/3">
                    <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                        <div class="aspect-video bg-black">
                            <iframe src="${episode.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full"></iframe>
                        </div>
                        <div class="p-4">
                            <h2 class="text-2xl font-bold">${item.title}</h2>
                            <h3 class="text-lg text-yellow-400 mt-1">EP ${episode.number}/${highestEpisode} - ${episode.title}</h3>
                        </div>
                    </div>
                </div>
                <div class="w-full lg:w-1/3 bg-gray-800 p-4 rounded-lg">
                    ${episodeSelectorHtml}
                </div>
            </div>`;
        showPage('player-page');
    };
    
    // ... (Sertakan semua fungsi `render` dan `populate` Anda yang lain di sini)
    // Anda mungkin perlu menyesuaikan renderAllGenresPage, dll. agar bekerja dengan router
    
    // =======================================================
    // EVENT LISTENER UTAMA
    // =======================================================
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a.nav-link');
        if (link) {
            e.preventDefault();
            const url = link.getAttribute('href');
            history.pushState({}, null, url);
            router();
            return;
        }

        const episodeTab = e.target.closest('.episode-range-tab');
        if (episodeTab) {
            e.preventDefault();
            // ... (logika tab episode Anda di sini)
        }
    });

    window.addEventListener('popstate', router);
    
    // =======================================================
    // INISIALISASI
    // =======================================================
    loadContent().then(() => {
        router(); // Panggil router setelah semua data siap
    });
});