// 틈새 - Main Application Logic

class TeumsaeApp {
    constructor() {
        this.places = placesData;
        this.filteredPlaces = [...placesData];
        this.savedPlaces = this.loadSavedPlaces();
        this.currentCategory = "전체";
        this.searchQuery = "";

        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.renderPlaces();
        this.initScrollEffects();
        this.initIntroAnimation();
    }

    cacheDOMElements() {
        // Intro
        this.intro = document.querySelector('.intro');
        this.introBtn = document.querySelector('.intro__cta .btn');

        // Main
        this.main = document.querySelector('.main');
        this.searchInput = document.querySelector('.search-box__input');
        this.categoryBtns = document.querySelectorAll('.filter-btn[data-category]');
        this.moodTags = document.querySelectorAll('.tag[data-mood]');
        this.placesGrid = document.querySelector('.places-grid');

        // Header
        this.header = document.querySelector('.header');
    }

    bindEvents() {
        // Intro CTA
        if (this.introBtn) {
            this.introBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToMain();
            });
        }

        // Search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterPlaces();
            });
        }

        // Category Filters
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.filterPlaces();
            });
        });

        // Mood Tags
        this.moodTags.forEach(tag => {
            tag.addEventListener('click', () => {
                tag.classList.toggle('tag-active');
                this.filterPlaces();
            });
        });

        // Scroll
        window.addEventListener('scroll', () => this.handleScroll());
    }

    scrollToMain() {
        if (this.main) {
            this.main.scrollIntoView({ behavior: 'smooth' });
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;

        // Header background
        if (this.header) {
            if (scrollY > 100) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        }

        // Reveal animations
        this.revealOnScroll();
    }

    revealOnScroll() {
        const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        const windowHeight = window.innerHeight;

        reveals.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const revealPoint = 150;

            if (elementTop < windowHeight - revealPoint) {
                el.classList.add('revealed');
            }
        });
    }

    filterPlaces() {
        const activeMoods = [...document.querySelectorAll('.tag[data-mood].tag-active')]
            .map(tag => tag.dataset.mood);

        this.filteredPlaces = this.places.filter(place => {
            // Category filter
            const categoryMatch = this.currentCategory === "전체" ||
                place.category === this.currentCategory;

            // Search filter
            const searchMatch = !this.searchQuery ||
                place.name.toLowerCase().includes(this.searchQuery) ||
                place.description.toLowerCase().includes(this.searchQuery) ||
                place.tags.some(tag => tag.includes(this.searchQuery));

            // Mood filter
            const moodMatch = activeMoods.length === 0 ||
                activeMoods.some(mood =>
                    place.tags.some(tag => tag.includes(mood)) ||
                    place.description.includes(mood)
                );

            return categoryMatch && searchMatch && moodMatch;
        });

        this.renderPlaces();
    }

    renderPlaces() {
        if (!this.placesGrid) return;

        if (this.filteredPlaces.length === 0) {
            this.placesGrid.innerHTML = `
        <div class="places-empty" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
          <p style="font-size: 1.25rem; color: var(--color-gray);">검색 결과가 없습니다.</p>
          <p style="color: var(--color-gray-light); margin-top: 0.5rem;">다른 키워드로 검색해보세요.</p>
        </div>
      `;
            return;
        }

        this.placesGrid.innerHTML = this.filteredPlaces.map((place, index) => `
      <article class="card place-card reveal" style="animation-delay: ${index * 0.1}s" data-id="${place.id}">
        <div class="place-card__image">
          <img src="${place.images[0]}" alt="${place.name}" loading="lazy">
          <span class="place-card__badge ${this.getCongestionClass(place.congestion)}">
            ${this.getCongestionText(place.congestion)}
          </span>
          <button class="place-card__save ${this.isSaved(place.id) ? 'saved' : ''}" 
                  onclick="app.toggleSave(${place.id}, event)"
                  aria-label="저장하기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${this.isSaved(place.id) ? 'currentColor' : 'none'}" 
                 stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="place-card__content">
          <span class="place-card__category">${place.category}</span>
          <h3 class="place-card__title">${place.name}</h3>
          <p class="place-card__desc">${place.shortDesc}</p>
          <div class="place-card__tags">
            ${place.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        </div>
      </article>
    `).join('');

        // Add click events for navigation
        this.placesGrid.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.place-card__save')) {
                    const id = card.dataset.id;
                    window.location.href = `detail.html?id=${id}`;
                }
            });
        });

        // Re-run reveal animations
        setTimeout(() => this.revealOnScroll(), 100);
    }

    getCongestionClass(congestion) {
        const classes = {
            quiet: '',
            normal: 'place-card__badge--normal',
            crowded: 'place-card__badge--crowded'
        };
        return classes[congestion] || '';
    }

    getCongestionText(congestion) {
        const texts = {
            quiet: '한산',
            normal: '보통',
            crowded: '혼잡'
        };
        return texts[congestion] || '보통';
    }

    toggleSave(id, event) {
        event.stopPropagation();

        const index = this.savedPlaces.indexOf(id);
        if (index > -1) {
            this.savedPlaces.splice(index, 1);
        } else {
            this.savedPlaces.push(id);
        }

        this.savePlaces();
        this.renderPlaces();

        // Show toast notification
        this.showToast(index > -1 ? '저장 목록에서 제거했습니다.' : '저장 목록에 추가했습니다.');
    }

    isSaved(id) {
        return this.savedPlaces.includes(id);
    }

    loadSavedPlaces() {
        try {
            return JSON.parse(localStorage.getItem('teumsae_saved')) || [];
        } catch {
            return [];
        }
    }

    savePlaces() {
        localStorage.setItem('teumsae_saved', JSON.stringify(this.savedPlaces));
    }

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = message;
        toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--color-dark);
      color: var(--color-white);
      padding: 1rem 2rem;
      border-radius: 50px;
      font-size: 0.875rem;
      z-index: 1000;
      transition: transform 0.3s ease;
    `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    initScrollEffects() {
        // Initial check for elements already in view
        setTimeout(() => this.revealOnScroll(), 100);
    }

    initIntroAnimation() {
        // Intro is handled by CSS animations
    }
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TeumsaeApp();
});
