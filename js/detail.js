// 틈새 - Detail Page Logic

class DetailPage {
    constructor() {
        this.place = null;
        this.savedPlaces = this.loadSavedPlaces();
        this.init();
    }

    init() {
        this.getPlaceFromUrl();
        if (this.place) {
            this.renderPlace();
            this.bindEvents();
            this.initRevealAnimations();
        } else {
            this.showNotFound();
        }
    }

    getPlaceFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = parseInt(params.get('id'));

        if (id) {
            this.place = placesData.find(p => p.id === id);
        }
    }

    renderPlace() {
        const place = this.place;

        // Update page title
        document.title = `${place.name} | 틈새`;

        // Hero
        document.getElementById('hero-image').src = place.images[0];
        document.getElementById('hero-image').alt = place.name;
        document.getElementById('detail-category').textContent = place.category;
        document.getElementById('detail-title').textContent = place.name;
        document.getElementById('detail-address').innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align: middle; margin-right: 4px;">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      ${place.address}
    `;

        // Congestion
        const congestionEl = document.getElementById('detail-congestion');
        const congestionText = document.getElementById('congestion-text');

        const congestionMap = {
            quiet: { text: '한산', class: '' },
            normal: { text: '보통', class: 'detail__congestion--normal' },
            crowded: { text: '혼잡', class: 'detail__congestion--crowded' }
        };

        const congestion = congestionMap[place.congestion] || congestionMap.normal;
        congestionText.textContent = congestion.text;
        if (congestion.class) {
            congestionEl.classList.add(congestion.class);
        }

        // Description
        document.getElementById('detail-description').textContent = place.description;

        // Features
        const featuresContainer = document.getElementById('detail-features');
        featuresContainer.innerHTML = place.features.map(feature => `
      <span class="tag tag-lg">✓ ${feature}</span>
    `).join('');

        // Gallery
        const galleryContainer = document.getElementById('detail-gallery');
        galleryContainer.innerHTML = place.images.map((img, index) => `
      <div class="detail__gallery-item" data-index="${index}">
        <img src="${img}" alt="${place.name} 사진 ${index + 1}" loading="lazy">
      </div>
    `).join('');

        // Info
        document.getElementById('info-hours').textContent = place.hours;
        document.getElementById('info-admission').textContent = place.admission;
        document.getElementById('info-address').textContent = place.address;
        document.getElementById('info-rating').textContent = `${place.rating} / 5.0`;

        // Update add button if already saved
        this.updateAddButton();
    }

    bindEvents() {
        // Add to plan button
        const addBtn = document.getElementById('add-to-plan');
        addBtn.addEventListener('click', () => this.toggleSave());

        // Gallery modal
        const galleryItems = document.querySelectorAll('.detail__gallery-item');
        const modalBackdrop = document.getElementById('image-modal-backdrop');
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');

        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                modalImage.src = this.place.images[index];
                modalImage.alt = `${this.place.name} 사진 ${index + 1}`;
                modalBackdrop.classList.add('active');
                modal.classList.add('active');
            });
        });

        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove('active');
                modal.classList.remove('active');
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modalBackdrop.classList.remove('active');
                modal.classList.remove('active');
            }
        });
    }

    toggleSave() {
        const id = this.place.id;
        const index = this.savedPlaces.indexOf(id);

        if (index > -1) {
            this.savedPlaces.splice(index, 1);
            this.showToast('일정에서 제거했습니다.');
        } else {
            this.savedPlaces.push(id);
            this.showToast('일정에 추가했습니다!');
        }

        this.savePlaces();
        this.updateAddButton();
    }

    updateAddButton() {
        const addBtn = document.getElementById('add-to-plan');
        const isSaved = this.savedPlaces.includes(this.place.id);

        if (isSaved) {
            addBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        일정에 추가됨
      `;
            addBtn.classList.remove('btn-accent');
            addBtn.classList.add('btn-primary');
        } else {
            addBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        일정에 추가
      `;
            addBtn.classList.add('btn-accent');
            addBtn.classList.remove('btn-primary');
        }
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
      bottom: 6rem;
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

    initRevealAnimations() {
        const reveals = document.querySelectorAll('.reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => observer.observe(el));
    }

    showNotFound() {
        document.getElementById('detail').innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem; color: var(--color-dark);">장소를 찾을 수 없습니다</h1>
        <p style="color: var(--color-gray); margin-bottom: 2rem;">요청하신 장소 정보가 존재하지 않습니다.</p>
        <a href="index.html" class="btn btn-primary">메인으로 돌아가기</a>
      </div>
    `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new DetailPage();
});
