// RSS Feed Aggregator Frontend
// Loads and displays RSS feeds from feeds.json

// State
let allItems = [];
let filteredItems = [];
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const lastUpdatedEl = document.getElementById('last-updated');
const itemCountEl = document.getElementById('item-count');
const themeToggle = document.getElementById('theme-toggle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadFeeds();
    setupEventListeners();
});

// Load theme from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

// Update theme icon
function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Setup event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', handleSearch);
    categoryFilter.addEventListener('change', handleCategoryChange);
    themeToggle.addEventListener('click', toggleTheme);
}

// Load feeds from JSON file
async function loadFeeds() {
    try {
        const response = await fetch('feeds.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        allItems = data.items || [];
        filteredItems = allItems;

        updateLastUpdated(data.last_updated);
        updateItemCount(allItems.length);
        populateCategoryFilter();
        renderFeeds();

    } catch (error) {
        console.error('Error loading feeds:', error);
        feedContainer.innerHTML = `
            <div class="no-results">
                Failed to load feeds. Please try again later.
                <br><br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Update last updated timestamp
function updateLastUpdated(timestamp) {
    if (!timestamp) {
        lastUpdatedEl.textContent = 'Last updated: Unknown';
        return;
    }

    const date = new Date(timestamp);
    const timeAgo = getTimeAgo(date);
    lastUpdatedEl.textContent = `Last updated: ${timeAgo}`;
}

// Update item count
function updateItemCount(count) {
    itemCountEl.textContent = `${count} items`;
}

// Populate category filter dropdown
function populateCategoryFilter() {
    const categories = new Set();
    const sources = new Set();

    allItems.forEach(item => {
        if (item.category) categories.add(item.category);
        if (item.source) sources.add(item.source);
    });

    // Clear existing options except "All Sources"
    categoryFilter.innerHTML = '<option value="all">All Sources</option>';

    // Add category options
    if (categories.size > 0) {
        const categoryGroup = document.createElement('optgroup');
        categoryGroup.label = 'By Category';
        Array.from(categories).sort().forEach(cat => {
            const option = document.createElement('option');
            option.value = `category:${cat}`;
            option.textContent = capitalize(cat);
            categoryGroup.appendChild(option);
        });
        categoryFilter.appendChild(categoryGroup);
    }

    // Add source options
    if (sources.size > 0) {
        const sourceGroup = document.createElement('optgroup');
        sourceGroup.label = 'By Source';
        Array.from(sources).sort().forEach(source => {
            const option = document.createElement('option');
            option.value = `source:${source}`;
            option.textContent = source;
            sourceGroup.appendChild(option);
        });
        categoryFilter.appendChild(sourceGroup);
    }
}

// Handle search input
function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase();
    applyFilters();
}

// Handle category filter change
function handleCategoryChange(e) {
    currentCategory = e.target.value;
    applyFilters();
}

// Apply all filters
function applyFilters() {
    filteredItems = allItems.filter(item => {
        // Category filter
        if (currentCategory !== 'all') {
            const [filterType, filterValue] = currentCategory.split(':');
            if (filterType === 'category' && item.category !== filterValue) return false;
            if (filterType === 'source' && item.source !== filterValue) return false;
        }

        // Search filter
        if (searchQuery) {
            const titleMatch = item.title.toLowerCase().includes(searchQuery);
            const sourceMatch = item.source.toLowerCase().includes(searchQuery);
            if (!titleMatch && !sourceMatch) return false;
        }

        return true;
    });

    updateItemCount(filteredItems.length);
    renderFeeds();
}

// Render feeds to the DOM
function renderFeeds() {
    if (filteredItems.length === 0) {
        feedContainer.innerHTML = '<div class="no-results">No items found.</div>';
        return;
    }

    feedContainer.innerHTML = filteredItems.map(item => createFeedItemHTML(item)).join('');
}

// Create HTML for a single feed item
function createFeedItemHTML(item) {
    const publishedDate = new Date(item.published);
    const timeAgo = getTimeAgo(publishedDate);

    return `
        <article class="feed-item">
            <div class="feed-item-title">
                <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
                    ${escapeHtml(item.title)}
                </a>
            </div>
            <div class="feed-item-meta">
                <span class="feed-item-source">${escapeHtml(item.source)}</span>
                <span class="feed-item-time">${timeAgo}</span>
            </div>
        </article>
    `;
}

// Get relative time string (e.g., "2 hours ago")
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
