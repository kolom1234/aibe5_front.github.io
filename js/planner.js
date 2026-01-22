// 틈새 - Planner Page Logic

class PlannerPage {
    constructor() {
        this.savedPlaces = this.loadSavedPlaces();
        this.timeline = this.loadTimeline();
        this.places = placesData;

        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.setDefaultDate();
        this.renderSavedPlaces();
        this.renderTimeline();
        this.bindEvents();
        this.initRevealAnimations();
    }

    cacheDOMElements() {
        this.savedList = document.getElementById('saved-list');
        this.emptySaved = document.getElementById('empty-saved');
        this.timelineItems = document.getElementById('timeline-items');
        this.timelineEmpty = document.getElementById('timeline-empty');
        this.timelineActions = document.getElementById('timeline-actions');
        this.dateInput = document.getElementById('travel-date');
        this.savePlanBtn = document.getElementById('save-plan');
        this.sharePlanBtn = document.getElementById('share-plan');
        this.clearPlanBtn = document.getElementById('clear-plan');
    }

    setDefaultDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        this.dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    bindEvents() {
        // Add place to timeline on click
        this.savedList.addEventListener('click', (e) => {
            const item = e.target.closest('.planner__saved-item');
            if (item) {
                const id = parseInt(item.dataset.id);
                this.addToTimeline(id);
            }
        });

        // Drag and drop
        this.initDragAndDrop();

        // Save plan
        this.savePlanBtn.addEventListener('click', () => this.savePlan());

        // Share plan
        this.sharePlanBtn.addEventListener('click', () => this.sharePlan());

        // Clear plan
        this.clearPlanBtn.addEventListener('click', () => this.clearPlan());
    }

    initDragAndDrop() {
        // Make saved items draggable
        this.savedList.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.planner__saved-item');
            if (item) {
                e.dataTransfer.setData('text/plain', item.dataset.id);
                item.classList.add('dragging');
            }
        });

        this.savedList.addEventListener('dragend', (e) => {
            const item = e.target.closest('.planner__saved-item');
            if (item) {
                item.classList.remove('dragging');
            }
        });

        // Allow drop on timeline
        this.timelineItems.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.timelineItems.style.background = 'var(--color-secondary-light)';
        });

        this.timelineItems.addEventListener('dragleave', () => {
            this.timelineItems.style.background = '';
        });

        this.timelineItems.addEventListener('drop', (e) => {
            e.preventDefault();
            this.timelineItems.style.background = '';
            const id = parseInt(e.dataTransfer.getData('text/plain'));
            if (id) {
                this.addToTimeline(id);
            }
        });
    }

    renderSavedPlaces() {
        if (this.savedPlaces.length === 0) {
            this.savedList.style.display = 'none';
            this.emptySaved.style.display = 'block';
            return;
        }

        this.savedList.style.display = 'flex';
        this.emptySaved.style.display = 'none';

        const savedPlacesData = this.savedPlaces
            .map(id => this.places.find(p => p.id === id))
            .filter(Boolean);

        this.savedList.innerHTML = savedPlacesData.map(place => `
      <div class="planner__saved-item" data-id="${place.id}" draggable="true">
        <img src="${place.images[0]}" alt="${place.name}" class="planner__saved-image">
        <div class="planner__saved-info">
          <p class="planner__saved-name">${place.name}</p>
          <p class="planner__saved-category">${place.category}</p>
        </div>
        <button class="btn-icon" style="width: 32px; height: 32px; flex-shrink: 0;" 
                onclick="planner.removeFromSaved(${place.id}, event)" 
                title="저장 목록에서 제거">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `).join('');
    }

    renderTimeline() {
        if (this.timeline.length === 0) {
            this.timelineItems.innerHTML = '';
            this.timelineEmpty.style.display = 'block';
            this.timelineActions.style.display = 'none';
            return;
        }

        this.timelineEmpty.style.display = 'none';
        this.timelineActions.style.display = 'flex';

        // Sort by time
        this.timeline.sort((a, b) => a.time.localeCompare(b.time));

        this.timelineItems.innerHTML = this.timeline.map((item, index) => {
            const place = this.places.find(p => p.id === item.placeId);
            if (!place) return '';

            return `
        <div class="planner__timeline-item" data-index="${index}">
          <div class="planner__timeline-time">
            <input type="time" value="${item.time}" 
                   onchange="planner.updateTime(${index}, this.value)"
                   style="border: none; background: none; font-weight: 600; color: var(--color-primary); font-size: inherit;">
          </div>
          <div class="planner__timeline-place">
            <img src="${place.images[0]}" alt="${place.name}" class="planner__timeline-image">
            <div class="planner__timeline-info">
              <h4>${place.name}</h4>
              <p>${place.shortDesc}</p>
            </div>
            <button class="btn-icon" style="width: 36px; height: 36px; flex-shrink: 0; margin-left: auto;" 
                    onclick="planner.removeFromTimeline(${index})" 
                    title="일정에서 제거">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
        }).join('');
    }

    addToTimeline(placeId) {
        // Check if already in timeline
        if (this.timeline.some(item => item.placeId === placeId)) {
            this.showToast('이미 일정에 추가된 장소입니다.');
            return;
        }

        // Get next available time
        const lastTime = this.timeline.length > 0
            ? this.timeline[this.timeline.length - 1].time
            : '09:00';

        const [hours, minutes] = lastTime.split(':').map(Number);
        const nextHours = (hours + 2) % 24;
        const nextTime = `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        this.timeline.push({
            placeId,
            time: this.timeline.length === 0 ? '10:00' : nextTime
        });

        this.saveTimeline();
        this.renderTimeline();
        this.showToast('일정에 추가했습니다!');
    }

    removeFromTimeline(index) {
        this.timeline.splice(index, 1);
        this.saveTimeline();
        this.renderTimeline();
        this.showToast('일정에서 제거했습니다.');
    }

    updateTime(index, time) {
        this.timeline[index].time = time;
        this.saveTimeline();
        this.renderTimeline();
    }

    removeFromSaved(id, event) {
        event.stopPropagation();

        const index = this.savedPlaces.indexOf(id);
        if (index > -1) {
            this.savedPlaces.splice(index, 1);
            localStorage.setItem('teumsae_saved', JSON.stringify(this.savedPlaces));
            this.renderSavedPlaces();
            this.showToast('저장 목록에서 제거했습니다.');
        }
    }

    savePlan() {
        const planData = {
            date: this.dateInput.value,
            timeline: this.timeline,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('teumsae_plan', JSON.stringify(planData));
        this.showToast('일정이 저장되었습니다!');
    }

    sharePlan() {
        if (this.timeline.length === 0) {
            this.showToast('공유할 일정이 없습니다.');
            return;
        }

        const date = this.dateInput.value;
        const places = this.timeline.map(item => {
            const place = this.places.find(p => p.id === item.placeId);
            return place ? `${item.time} - ${place.name}` : '';
        }).filter(Boolean).join('\n');

        const shareText = `🌿 틈새 여행 일정\n📅 ${date}\n\n${places}\n\n틈새에서 만든 나만의 서울 여행 코스입니다.`;

        if (navigator.share) {
            navigator.share({
                title: '틈새 여행 일정',
                text: shareText
            }).catch(() => {
                this.copyToClipboard(shareText);
            });
        } else {
            this.copyToClipboard(shareText);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('일정이 클립보드에 복사되었습니다!');
        }).catch(() => {
            this.showToast('복사에 실패했습니다.');
        });
    }

    clearPlan() {
        if (this.timeline.length === 0) return;

        if (confirm('정말 일정을 초기화하시겠습니까?')) {
            this.timeline = [];
            this.saveTimeline();
            this.renderTimeline();
            this.showToast('일정이 초기화되었습니다.');
        }
    }

    loadSavedPlaces() {
        try {
            return JSON.parse(localStorage.getItem('teumsae_saved')) || [];
        } catch {
            return [];
        }
    }

    loadTimeline() {
        try {
            const plan = JSON.parse(localStorage.getItem('teumsae_plan'));
            return plan?.timeline || [];
        } catch {
            return [];
        }
    }

    saveTimeline() {
        const planData = {
            date: this.dateInput.value,
            timeline: this.timeline,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('teumsae_plan', JSON.stringify(planData));
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

    initRevealAnimations() {
        const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => observer.observe(el));

        // Trigger immediately for elements in view
        setTimeout(() => {
            reveals.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('revealed');
                }
            });
        }, 100);
    }
}

// Initialize
let planner;
document.addEventListener('DOMContentLoaded', () => {
    planner = new PlannerPage();
});
