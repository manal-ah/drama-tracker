

'use strict';



let showsData     = [];
let currentFilter = 'all';
let currentSort   = 'default';
let currentSearch = '';
let currentRating = 0;


let selectedTVShow = null;

const initialShows = [
    { title: "Welcome to Waikiki", category: "Comedy", rating: 5, image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/vRtz2C6XqF0w8wA0vLWeTkmY2D.jpg" },
    { title: "Business Proposal", category: "Romance", rating: 5, image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/AIfbMzpUDhsrsPkugDpXhaB2Rtu.jpg" },
    { title: "Modern Family", category: "Family", rating: 5, image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/klzm1Hxuz3J1Wk1ig8H1gSAYv5F.jpg" },
    { title: "My Roommate is a Gumiho", category: "Fantasy", rating: 4, image: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/2gN1fKq9E9Wab9qE8XgKtcA57k6.jpg" }
];

let allShows = [];

function initializeApp() {
    const savedData = localStorage.getItem('cozyTrackerData');

    if (savedData !== null) {
        allShows = JSON.parse(savedData);
    } else {
        allShows = initialShows;
        localStorage.setItem('cozyTrackerData', JSON.stringify(allShows));
    }

    renderCards(allShows);
}

function filterShows(selectedCategory) {
    if (selectedCategory === 'All') {
        renderCards(allShows);
    } else {
        const filteredShows = allShows.filter(function(show) {
            return show.category === selectedCategory;
        });
        renderCards(filteredShows);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

const LS_SHOWS = 'dramaTracker_shows';
const LS_THEME = 'dramaTracker_theme';

const RATING_HINTS = ['', 'Poor 😬', 'Okay 😐', 'Good 👍', 'Great 😍', 'OBSESSED ✨'];

/** Maps TVMaze genre --> app category. Unmatched genres default to "Romance". */
const GENRE_MAP = {
    'Romance'        : 'Romance',
    'Comedy'         : 'Comedy',
    'Action'         : 'Action',
    'Thriller'       : 'Thriller & Mystery',
    'Crime'          : 'Thriller & Mystery',
    'Mystery'        : 'Thriller & Mystery',
    'Horror'         : 'Thriller & Mystery',
    'History'        : 'Historical',
    'War'            : 'Historical',
    'Family'         : 'Family',
    'Medical'        : 'Medical',
    'Fantasy'        : 'Fantasy',
    'Science-Fiction': 'Fantasy',
    'Supernatural'   : 'Fantasy',
    'Adventure'      : 'Fantasy',
    'Anime'          : 'Slice of Life',
    'Slice of Life'  : 'Slice of Life',
};


/* 2. DOM REFERENCES  */

const showsGrid          = document.getElementById('showsGrid');
const emptyState         = document.getElementById('emptyState');
const searchInput        = document.getElementById('searchInput');
const sortSelect         = document.getElementById('sortSelect');
const themeToggle        = document.getElementById('themeToggle');
const themeIcon          = document.getElementById('themeIcon');
const filterPills        = document.querySelectorAll('.filter-pill');
const showModal          = document.getElementById('showModal');
const showModalLabel     = document.getElementById('showModalLabel');
const showForm           = document.getElementById('showForm');
const editingIdInput     = document.getElementById('editingId');
const inputCategory      = document.getElementById('inputCategory');
const inputStatus        = document.getElementById('inputStatus');
const ratingSection      = document.getElementById('ratingSection');
const inputRating        = document.getElementById('inputRating');
const ratingHint         = document.getElementById('ratingHint');
const starPickBtns       = document.querySelectorAll('.star-pick-btn');
const modalSubmitBtn     = document.getElementById('modalSubmitBtn');
const bsModal            = new bootstrap.Modal(document.getElementById('showModal'));

// Modal search flow
const tvSearchInput      = document.getElementById('tvSearchInput');
const tvSearchBtn        = document.getElementById('tvSearchBtn');
const tvSearchSpinner    = document.getElementById('tvSearchSpinner');
const tvSearchBtnLabel   = document.getElementById('tvSearchBtnLabel');
const searchResultsDiv   = document.getElementById('searchResults');
const selectedShowChip   = document.getElementById('selectedShowChip');
const chipPoster         = document.getElementById('chipPoster');
const chipTitle          = document.getElementById('chipTitle');
const chipMeta           = document.getElementById('chipMeta');

// Edit mode identity block
const searchSection      = document.getElementById('searchSection');
const editIdentityBlock  = document.getElementById('editIdentityBlock');
const editPosterThumb    = document.getElementById('editPosterThumb');
const editShowTitleLabel = document.getElementById('editShowTitleLabel');
const editShowMetaLabel  = document.getElementById('editShowMetaLabel');


/*  3. INIT */

function initApp() {
    loadShows();
    loadTheme();
    setupEventListeners();
    setupStarPicker();
    renderShows();
}

document.addEventListener('DOMContentLoaded', initApp);


/*  4. LOCALSTORAGE HELPERS  */

function loadShows() {
    try {
        const raw = localStorage.getItem(LS_SHOWS);
        showsData = raw ? JSON.parse(raw) : initialShows;
        if (!raw) saveShows();
    } catch (e) {
        showsData = [];
    }
}

function saveShows() {
    try { localStorage.setItem(LS_SHOWS, JSON.stringify(showsData)); } catch (e) {}
}

function loadTheme() { applyTheme(localStorage.getItem(LS_THEME) || 'light'); }
function saveTheme(t) { localStorage.setItem(LS_THEME, t); }


/*  5. THEME */

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    saveTheme(next);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}


/* 6. EVENT LISTENERS */

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);

    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.trim().toLowerCase();
        renderShows();
    });

    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderShows();
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            renderShows();
        });
    });

    showModal.addEventListener('hidden.bs.modal', resetModal);

    tvSearchBtn.addEventListener('click', handleTVSearch);
    tvSearchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); handleTVSearch(); }
    });

    
    inputStatus.addEventListener('change', handleStatusChange);

    showForm.addEventListener('submit', handleFormSubmit);
}


/* 6b. CONDITIONAL RATING VISIBILITY */


function handleStatusChange() {
    const status = inputStatus.value;
    const show   = status === 'Currently Watching' || status === 'Completed';

    if (show) {
        ratingSection.style.display = '';
        ratingSection.classList.add('rating-reveal');
       
        ratingSection.addEventListener('animationend', () => {
            ratingSection.classList.remove('rating-reveal');
        }, { once: true });
    } else {
        ratingSection.style.display = 'none';
        
        if (status === 'Plan to Watch') {
            resetStarPicker();
        }
    }
}


/* 7. STAR PICKER */

function setupStarPicker() {
    starPickBtns.forEach(btn => {
        const val = parseInt(btn.dataset.value, 10);
        btn.addEventListener('mouseenter', () => highlightStars(val, 'hover'));
        btn.addEventListener('mouseleave', () => highlightStars(currentRating, 'active'));
        btn.addEventListener('click', () => {
            currentRating = val;
            inputRating.value = val;
            highlightStars(val, 'active');
            ratingHint.textContent = RATING_HINTS[val];
        });
    });
}

function highlightStars(upTo, mode) {
    starPickBtns.forEach(btn => {
        btn.classList.remove('active', 'hovered');
        if (parseInt(btn.dataset.value, 10) <= upTo)
            btn.classList.add(mode === 'hover' ? 'hovered' : 'active');
    });
}

function resetStarPicker() {
    currentRating = 0;
    inputRating.value = '';
    highlightStars(0, 'active');
    ratingHint.textContent = 'Click a star to rate!';
}

function setStarPicker(val) {
    currentRating = val;
    inputRating.value = val;
    highlightStars(val, 'active');
    ratingHint.textContent = RATING_HINTS[val];
}


/* 8. FILTER / SORT / SEARCH PIPELINE */

function getDisplayedShows() {
    let result = showsData.filter(show => {
        if (currentFilter === 'all')       return true;
        if (currentFilter === 'Favorites') return show.isFavorite === true;
        return show.category === currentFilter;
    });

    if (currentSearch)
        result = result.filter(s => s.title.toLowerCase().includes(currentSearch));

    if (currentSort === 'alpha')
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    else if (currentSort === 'rating')
        result = [...result].sort((a, b) => b.rating - a.rating);

    return result;
}


/* 9. RENDERING */

function renderShows() {
    const toDisplay = getDisplayedShows();
    showsGrid.innerHTML = '';

    if (toDisplay.length === 0) { emptyState.style.display = 'flex'; return; }
    emptyState.style.display = 'none';

    toDisplay.forEach((show, i) => {
        const card = buildShowCard(show);
        card.style.animationDelay = `${i * 0.055}s`;
        showsGrid.appendChild(card);
    });
}


/* 10. CARD BUILDER  */

function buildShowCard(show) {
    const FALLBACK = 'https://placehold.co/400x560/E0D0F5/8B6BA8?text=No+Poster';

    const card = document.createElement('div');
    card.className = 'show-card';
    card.dataset.id = show.id;

    
    const posterWrap = document.createElement('div');
    posterWrap.className = 'card-poster-wrap';

    const img = document.createElement('img');
    img.className = 'card-poster';
    img.src = show.imageUrl;
    img.alt = `${show.title} poster`;
    img.loading = 'lazy';
    img.onerror = () => { img.src = FALLBACK; };

    const badge = document.createElement('span');
    badge.className = 'status-badge';
    badge.setAttribute('data-status', show.status);
    badge.textContent = show.status;

    const heartBtn = document.createElement('button');
    heartBtn.className = 'heart-btn' + (show.isFavorite ? ' is-fav' : '');
    heartBtn.innerHTML = show.isFavorite ? '❤️' : '🤍';
    heartBtn.setAttribute('aria-label', show.isFavorite ? 'Remove from favorites' : 'Add to favorites');
    heartBtn.addEventListener('click', () => toggleFavorite(show.id));

    posterWrap.append(img, badge, heartBtn);

    
    const body = document.createElement('div');
    body.className = 'card-body-custom';

    const titleEl = document.createElement('h3');
    titleEl.className = 'card-title';
    titleEl.textContent = show.title;

    const catEl = document.createElement('p');
    catEl.className = 'card-category';
    catEl.textContent = show.category;

    body.append(titleEl, catEl);

    if (show.country) {
        const cEl = document.createElement('p');
        cEl.className = 'platform-line';
        cEl.textContent = `🌍 ${show.country}`;
        body.appendChild(cEl);
    }
    if (show.platform) {
        const pEl = document.createElement('p');
        pEl.className = 'platform-line';
        pEl.textContent = `📺 Watch on: ${show.platform}`;
        body.appendChild(pEl);
    }

    const starsRow = document.createElement('div');
    starsRow.className = 'card-stars-row';
    if (show.rating && show.rating > 0) {
        const starsEl = document.createElement('span');
        starsEl.className = 'card-stars';
        starsEl.innerHTML = buildStarHTML(show.rating);
        const starText = document.createElement('span');
        starText.className = 'star-text';
        starText.textContent = `${show.rating}/5`;
        starsRow.append(starsEl, starText);
    } else {
        const noRating = document.createElement('span');
        noRating.className = 'no-rating-pill';
        noRating.textContent = 'Not yet rated';
        starsRow.appendChild(noRating);
    }
    body.appendChild(starsRow);


    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-card btn-card-edit';
    editBtn.textContent = '✏️ Edit';
    editBtn.addEventListener('click', () => openEditModal(show.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-card btn-card-delete';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.addEventListener('click', () => deleteShow(show.id));

    actions.append(editBtn, deleteBtn);
    card.append(posterWrap, body, actions);
    return card;
}

function buildStarHTML(rating) {
    let h = '';
    for (let i = 1; i <= 5; i++)
        h += `<span class="${i <= rating ? 'star-fill' : 'star-empty'}">★</span>`;
    return h;
}


/* 11. TVMAZE SEARCH & SELECT */


function mapGenreToCategory(genres) {
    if (!Array.isArray(genres) || genres.length === 0) return 'Romance';
    for (const g of genres) {
        if (GENRE_MAP[g]) return GENRE_MAP[g];
    }
    return 'Romance';
}


async function handleTVSearch() {
    const query = tvSearchInput.value.trim();
    if (!query) { tvSearchInput.focus(); return; }

    setSearchLoading(true);
    searchResultsDiv.innerHTML = '';
    selectedShowChip.classList.add('d-none');
    selectedTVShow = null;
    document.getElementById('selectError')?.remove();

    try {
        const res = await fetch(
            `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error(`TVMaze ${res.status}`);

        const results = await res.json();

        if (!results || results.length === 0) {
            searchResultsDiv.innerHTML =
                `<p class="search-no-results">😔 No results for "<strong>${escapeHtml(query)}</strong>". Try a different title!</p>`;
            return;
        }

        renderSearchResults(results.slice(0, 5));

    } catch (err) {
        console.error('[DramaTracker] TVMaze search error:', err);
        searchResultsDiv.innerHTML =
            `<p class="search-no-results">⚠️ Couldn't reach TVMaze. Check your connection and try again.</p>`;
    } finally {
        setSearchLoading(false);
    }
}

function setSearchLoading(loading) {
    tvSearchBtn.disabled = loading;
    tvSearchSpinner.classList.toggle('d-none', !loading);
    tvSearchBtnLabel.textContent = loading ? 'Searching…' : '🔍 Search';
}


function renderSearchResults(results) {
    const FALLBACK_THUMB = 'https://placehold.co/56x80/E0D0F5/8B6BA8?text=?';

    searchResultsDiv.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'search-result-list';

    results.forEach(item => {
        const show = item.show;

        const thumb   = show?.image?.medium   ?? FALLBACK_THUMB;
        const title   = show?.name            ?? 'Untitled';
        const year    = show?.premiered       ? show.premiered.slice(0, 4) : '—';
        const genre   = show?.genres?.[0]     ?? 'Drama';
        const network = show?.webChannel?.name ?? show?.network?.name ?? '';
        const country = show?.network?.country?.name
                     ?? show?.webChannel?.country?.name
                     ?? '';

        const payload = {
            title,
            imageUrl : show?.image?.medium ?? 'https://placehold.co/400x560/E0D0F5/8B6BA8?text=No+Poster',
            country  : country  || '',
            platform : network  || '',
            category : mapGenreToCategory(show?.genres ?? []),
        };

        const row = document.createElement('div');
        row.className = 'search-result-item';
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.setAttribute('aria-label', `Select ${title}`);

        row.innerHTML = `
            <img class="result-thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}"
                 onerror="this.src='${FALLBACK_THUMB}'">
            <div class="result-info">
                <span class="result-title">${escapeHtml(title)}</span>
                <span class="result-meta">${escapeHtml(genre)} · ${year}${network ? ' · ' + escapeHtml(network) : ''}</span>
            </div>
            <span class="result-select-icon">＋</span>
        `;

        const onSelect = () => selectTVShow(payload, row);
        row.addEventListener('click', onSelect);
        row.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
        });

        list.appendChild(row);
    });

    searchResultsDiv.appendChild(list);
}

/**
 * Highlights the clicked result and stores it in selectedTVShow.
 */
function selectTVShow(payload, itemEl) {
    searchResultsDiv.querySelectorAll('.search-result-item').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.result-select-icon').textContent = '＋';
    });
    itemEl.classList.add('selected');
    itemEl.querySelector('.result-select-icon').textContent = '✓';

    selectedTVShow = payload;

    // Pre select the category dropdown to the auto detected category
    if (inputCategory) {
        const matchingOption = [...inputCategory.options].find(o => o.value === payload.category);
        inputCategory.value = matchingOption ? payload.category : 'Romance';
    }

    chipPoster.src        = payload.imageUrl;
    chipPoster.onerror    = () => { chipPoster.src = 'https://placehold.co/48x68/E0D0F5/8B6BA8?text=?'; };
    chipTitle.textContent = payload.title;
    chipMeta.textContent  = `${payload.category} · ${payload.country}`;
    selectedShowChip.classList.remove('d-none');

    selectedShowChip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/* 12. CRUD – CREATE / UPDATE  */

function handleFormSubmit(e) {
    e.preventDefault();

    const isEditing = editingIdInput.value !== '';
    let valid = true;

    // Validate TVMaze selection (add mode only)
    if (!isEditing && !selectedTVShow) {
        if (!document.getElementById('selectError')) {
            const err = document.createElement('p');
            err.className = 'search-validation-error';
            err.id = 'selectError';
            err.textContent = '⚠️ Please search for and select a show first.';
            searchResultsDiv.before(err);
        }
        setTimeout(() => document.getElementById('selectError')?.remove(), 3500);
        valid = false;
    } else {
        document.getElementById('selectError')?.remove();
    }

    // Validate Status
    if (!inputStatus.value) {
        inputStatus.classList.add('is-invalid');
        valid = false;
    } else {
        inputStatus.classList.remove('is-invalid');
    }

    // Validate Rating (only required when the rating section is visible)
    const ratingRequired = inputStatus.value === 'Currently Watching' || inputStatus.value === 'Completed';
    if (ratingRequired && !inputRating.value) {
        ratingHint.textContent = '⚠️ Please pick a rating!';
        ratingHint.style.color = '#e35d7a';
        valid = false;
    } else {
        ratingHint.style.color = '';
    }

    if (!valid) return;

    const status   = inputStatus.value;
    const rating   = inputRating.value ? parseInt(inputRating.value, 10) : 0;
    const category = inputCategory ? inputCategory.value : 'Romance';

    if (isEditing) {
        const id   = parseInt(editingIdInput.value, 10);
        const show = showsData.find(s => s.id === id);
        if (!show) { console.error('[DramaTracker] Edit target not found:', id); return; }

        // Status, rating, and category can be updated in edit mode
        show.status   = status;
        show.rating   = rating;
        show.category = category;

    } else {
        showsData.push({
            id         : Date.now(),
            title      : selectedTVShow.title,
            imageUrl   : selectedTVShow.imageUrl,
            country    : selectedTVShow.country,
            platform   : selectedTVShow.platform,
            category,
            status,
            rating,
            isFavorite : false,
        });
    }

    saveShows();
    renderShows();
    bsModal.hide();
}


/* 13. CRUD – DELETE */

function deleteShow(id) {
    if (!confirm('Remove this show from your list?')) return;
    showsData = showsData.filter(s => s.id !== id);
    saveShows();
    renderShows();
}


/* 14. FAVOURITES TOGGLE */

function toggleFavorite(id) {
    const show = showsData.find(s => s.id === id);
    if (!show) return;
    show.isFavorite = !show.isFavorite;
    saveShows();
    renderShows();
}


/* 15. EDIT MODE */

function openEditModal(id) {
    const show = showsData.find(s => s.id === id);
    if (!show) return;

    showModalLabel.textContent = 'Edit Show';
    modalSubmitBtn.textContent = 'Save Changes';
    editingIdInput.value       = show.id;

    // Swap sections
    searchSection.classList.add('d-none');
    editIdentityBlock.classList.remove('d-none');

    // Populate identity block with existing TVMaze data
    editPosterThumb.src           = show.imageUrl;
    editPosterThumb.onerror       = () => { editPosterThumb.src = 'https://placehold.co/56x80/E0D0F5/8B6BA8?text=?'; };
    editShowTitleLabel.textContent = show.title;
    editShowMetaLabel.textContent  = `${show.category} · ${show.country ?? ''}`;

    // Pre-fill editable fields
    inputStatus.value = show.status;
    if (inputCategory) inputCategory.value = show.category || 'Romance';
    handleStatusChange();           
    if (show.rating) setStarPicker(show.rating);

    showForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    ratingHint.style.color = '';

    bsModal.show();
}


/*  16. MODAL HELPERS  */

function resetModal() {
    showModalLabel.textContent = 'Add New Show';
    modalSubmitBtn.textContent = 'Add Show';
    editingIdInput.value       = '';

    
    searchSection.classList.remove('d-none');
    editIdentityBlock.classList.add('d-none');

   
    tvSearchInput.value        = '';
    searchResultsDiv.innerHTML = '';
    selectedShowChip.classList.add('d-none');
    selectedTVShow             = null;
    setSearchLoading(false);

  
    showForm.reset();
    showForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.getElementById('selectError')?.remove();

    ratingSection.style.display = 'none';
    resetStarPicker();
    ratingHint.style.color = '';
    if (inputCategory) inputCategory.value = 'Romance';
}


/*  17. UTILITIES */

function escapeHtml(str) {
    const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
}
