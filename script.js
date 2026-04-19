/* ============================================
   AYDAKAR SITE - API + Admin Panel
   ============================================ */
(function () {
    'use strict';

    const API_BASE = '/api';
    const DEFAULT_STATE = {
        logos: { team: './assets/team-logo.svg', teknofest: './assets/teknofest-logo.svg' },
        socialLinks: {
            instagram: '#',
            twitter: '#',
            linkedin: '#',
            github: '#'
        },
        orgChart: {
            advisorName: 'Ahmet Ali Süzen',
            captainName: 'Ferhan Çıbık',
            teams: ['Yazılım Ekibi', 'Mekanik Ekibi', 'Elektronik Ekibi', 'Yönetim Ekibi', 'PR ve Sosyal Medya']
        },
        projectGifs: ['', '', ''],
        orgChartPhotoUrl: '',
        sponsors: [],
        roadmap: [],
        gallery: [],
        members: [
            { name: 'Ferhan Çıbık', team: 'Yönetim Ekibi', role: 'Takım Kaptanı', photoUrl: '' },
            { name: 'Ahmet Ali Süzen', team: 'Yönetim Ekibi', role: 'Danışman', photoUrl: '' },
            { name: 'Esra Eskin', team: 'PR ve Sosyal Medya', role: 'PR Sorumlusu', photoUrl: '' },
            { name: 'Hasan Yahya Kahraman', team: 'Mekanik Ekibi', role: '', photoUrl: '' },
            { name: 'İbrahim Duman', team: 'Mekanik Ekibi', role: '', photoUrl: '' },
            { name: 'Furkan Kodaz', team: 'Mekanik Ekibi', role: '', photoUrl: '' },
            { name: 'Şevval Çoban', team: 'Yazılım Ekibi', role: '', photoUrl: '' },
            { name: 'Reyyan Çeliköz', team: 'Yazılım Ekibi', role: '', photoUrl: '' },
            { name: 'Yunus Emre Erdem', team: 'Yazılım Ekibi', role: '', photoUrl: '' },
            { name: 'Ceren Yalçınkaya', team: 'Yazılım Ekibi', role: '', photoUrl: '' },
            { name: 'Ömer Taşkın', team: 'Yazılım Ekibi', role: '', photoUrl: '' },
            { name: 'Utku Berkay Hatipoğlu', team: 'Elektronik Ekibi', role: '', photoUrl: '' },
            { name: 'Hasan Tozlu', team: 'Elektronik Ekibi', role: '', photoUrl: '' },
            { name: 'Begüm Küçüköztürk', team: 'Elektronik Ekibi', role: '', photoUrl: '' }
        ]
    };

    let state = structuredClone(DEFAULT_STATE);
    let backendOnline = true;
    let isAdminAuthenticated = false;

    const qs = (id) => document.getElementById(id);
    const teamLogoEls = document.querySelectorAll('.team-logo');
    const teknofestLogoEl = document.querySelector('.teknofest-logo');
    const socialLinkEls = {
        instagram: qs('socialInstagram'),
        twitter: qs('socialTwitter'),
        linkedin: qs('socialLinkedin'),
        github: qs('socialGithub')
    };
    const galleryGrid = qs('galleryGrid');
    const teamGrid = qs('teamGrid');
    const adminMembersList = qs('adminMembersList');
    const orgBranches = qs('orgBranches');
    const projectMediaEls = [qs('projectMedia0'), qs('projectMedia1'), qs('projectMedia2')];
    const orgChartPhotoEl = qs('orgChartPhoto');
    const sponsorsGrid = qs('sponsorsGrid');
    const roadmapList = qs('roadmapList');
    const adminSponsorsList = qs('adminSponsorsList');
    const adminRoadmapList = qs('adminRoadmapList');

    const navbar = qs('navbar');
    const scrollProgress = qs('scrollProgress');
    const backToTop = qs('backToTop');
    const handleGlobalScroll = () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 20);
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 360);
        if (scrollProgress) {
            const doc = document.documentElement;
            const total = doc.scrollHeight - doc.clientHeight;
            const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
            scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    };
    window.addEventListener('scroll', handleGlobalScroll, { passive: true });
    handleGlobalScroll();
    backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const navToggle = qs('navToggle');
    const navMenu = qs('navMenu');
    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu?.classList.toggle('active');
    });
    navMenu?.querySelectorAll('.nav-link').forEach((link) => link.addEventListener('click', () => {
        navToggle?.classList.remove('active');
        navMenu.classList.remove('active');
    }));

    // ==== Tema (karanlik mod) ====
    const themeToggleBtn = qs('themeToggle');
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('aydakar-theme', theme); } catch { /* noop */ }
    };
    const savedTheme = (() => {
        try { return localStorage.getItem('aydakar-theme'); } catch { return null; }
    })();
    if (savedTheme === 'dark' || savedTheme === 'light') {
        applyTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    }
    themeToggleBtn?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });

    // ==== Animasyonlu sayac (hero stats) ====
    const animateStat = (el) => {
        const target = Number.parseInt(el.dataset.target || el.textContent || '0', 10);
        if (!Number.isFinite(target) || target <= 0) return;
        const duration = 1200;
        const startTime = performance.now();
        const tick = (now) => {
            const progress = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toString();
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };
    document.querySelectorAll('.stat-number[data-target]').forEach((el) => { el.textContent = '0'; });
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stat-number[data-target]').forEach((el) => statObserver.observe(el));

    // ==== Galeri lightbox ====
    const lightbox = qs('lightbox');
    const lightboxImg = qs('lightboxImage');
    const lightboxCaption = qs('lightboxCaption');
    let lightboxIndex = -1;
    const galleryItemsList = () => state.gallery || [];
    const openLightbox = (idx) => {
        const items = galleryItemsList();
        if (!items[idx]) return;
        lightboxIndex = idx;
        lightboxImg.src = items[idx].imageUrl;
        lightboxImg.alt = items[idx].caption || `Galeri görseli ${idx + 1}`;
        lightboxCaption.textContent = items[idx].caption || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lightboxIndex = -1;
    };
    const stepLightbox = (delta) => {
        const items = galleryItemsList();
        if (!items.length || lightboxIndex < 0) return;
        const next = (lightboxIndex + delta + items.length) % items.length;
        openLightbox(next);
    };
    qs('lightboxClose')?.addEventListener('click', closeLightbox);
    qs('lightboxPrev')?.addEventListener('click', () => stepLightbox(-1));
    qs('lightboxNext')?.addEventListener('click', () => stepLightbox(1));
    lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    window.addEventListener('keydown', (e) => {
        if (!lightbox?.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') stepLightbox(-1);
        if (e.key === 'ArrowRight') stepLightbox(1);
    });

    const revealTargets = () => document.querySelectorAll('.feature-card, .project-card, .team-card, .section-header, .model-wrapper, .contact-box, .gallery-item, .org-node');
    const bindReveal = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal', 'visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealTargets().forEach((el) => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    };

    const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

    const renderTeam = () => {
        if (teamGrid) {
            teamGrid.innerHTML = '';
        }
        if (!adminMembersList) return;
        if (!isAdminAuthenticated) {
            adminMembersList.innerHTML = '';
            return;
        }
        adminMembersList.innerHTML = state.members.map((member, idx) => `
            <article class="agenda-item">
                <h3>${member.name}</h3>
                <p>${member.team || 'Ekip belirtilmedi'}${member.role ? ` - ${member.role}` : ''}</p>
                <div class="agenda-actions">
                    <button type="button" class="mini-btn" data-action="move-up-member" data-index="${idx}">Yukarı</button>
                    <button type="button" class="mini-btn" data-action="move-down-member" data-index="${idx}">Aşağı</button>
                    <button type="button" class="mini-btn" data-action="delete-member" data-index="${idx}">Sil</button>
                </div>
            </article>
        `).join('');
    };

    const isUploadedFile = (url) => typeof url === 'string' && url.startsWith('/uploads/');

    const deleteUploadedAsset = async (item) => {
        if (!item) return;
        if (!isUploadedFile(item.imageUrl) && !isUploadedFile(item.thumbnailUrl)) return;
        try {
            await api('/upload', {
                method: 'DELETE',
                body: JSON.stringify({
                    url: item.imageUrl,
                    thumbnailUrl: item.thumbnailUrl
                })
            });
        } catch {
            // Dosya silinemese de UI akışını kesmiyoruz.
        }
    };

    const renderGallery = () => {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = state.gallery.map((item, idx) => {
            const caption = (item.caption || '').trim();
            const showCaption = caption && caption.toLowerCase() !== 'yeni galeri görseli';
            return `
                <article class="gallery-item" draggable="${isAdminAuthenticated ? 'true' : 'false'}" data-drag-type="gallery" data-index="${idx}">
                    <img src="${item.thumbnailUrl || item.imageUrl}" alt="${caption || `Galeri görseli ${idx + 1}`}" data-full-src="${item.imageUrl}" loading="lazy" />
                    ${showCaption ? `<div class="gallery-caption">${caption}</div>` : ''}
                    ${isAdminAuthenticated ? `
                        <div class="gallery-actions">
                            <button type="button" class="mini-btn" data-action="edit-gallery" data-index="${idx}">Düzenle</button>
                            <button type="button" class="mini-btn" data-action="delete-gallery" data-index="${idx}">Sil</button>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');
    };

    const renderLogos = () => {
        teamLogoEls.forEach((el) => { el.src = state.logos.team; });
        if (teknofestLogoEl) teknofestLogoEl.src = state.logos.teknofest;
        const teamLogoUrl = state.logos.team;
        if (teamLogoUrl) {
            document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]').forEach((link) => {
                link.setAttribute('href', teamLogoUrl);
                if (link.hasAttribute('type')) link.removeAttribute('type');
            });
        }
    };

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const renderSponsors = () => {
        if (sponsorsGrid) {
            const items = state.sponsors || [];
            sponsorsGrid.innerHTML = items.length
                ? items.map((s) => {
                    const inner = s.logoUrl
                        ? `<img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.name)}" loading="lazy" decoding="async" />`
                        : `<span class="sponsor-card-text">${escapeHtml(s.name)}</span>`;
                    const frame = s.websiteUrl
                        ? `<a href="${escapeHtml(s.websiteUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(s.name)}"><span class="sponsor-frame">${inner}</span></a>`
                        : `<span class="sponsor-frame">${inner}</span>`;
                    return `<article class="sponsor-card">${frame}<p class="sponsor-card-name">${escapeHtml(s.name)}</p></article>`;
                }).join('')
                : '<div class="sponsors-empty">Henüz sponsor eklenmedi.</div>';
        }
        if (adminSponsorsList && isAdminAuthenticated) {
            adminSponsorsList.innerHTML = (state.sponsors || []).map((s, idx) => `
                <article class="agenda-item">
                    <h3>${escapeHtml(s.name)}</h3>
                    <p>${s.websiteUrl ? escapeHtml(s.websiteUrl) : 'Web sitesi yok'} ${s.logoUrl ? '· logo var' : ''}</p>
                    <div class="agenda-actions">
                        <button type="button" class="mini-btn" data-action="delete-sponsor" data-index="${idx}">Sil</button>
                    </div>
                </article>
            `).join('');
        } else if (adminSponsorsList) {
            adminSponsorsList.innerHTML = '';
        }
    };

    const roadmapStatusLabel = (status) => {
        if (status === 'completed') return 'Tamamlandı';
        if (status === 'active') return 'Şu an buradayız';
        return 'Yaklaşan';
    };

    const renderRoadmap = () => {
        if (roadmapList) {
            const items = state.roadmap || [];
            roadmapList.innerHTML = items.length
                ? items.map((r) => `
                    <article class="roadmap-step status-${escapeHtml(r.status || 'upcoming')}">
                        <div class="roadmap-meta">
                            <span class="roadmap-date">${escapeHtml(r.date || '')}</span>
                            <span class="roadmap-status">${roadmapStatusLabel(r.status)}</span>
                        </div>
                        <h3>${escapeHtml(r.title)}</h3>
                        ${r.description ? `<p>${escapeHtml(r.description)}</p>` : ''}
                    </article>
                `).join('')
                : '<div class="sponsors-empty">Henüz yol haritası adımı eklenmedi.</div>';
        }
        if (adminRoadmapList && isAdminAuthenticated) {
            adminRoadmapList.innerHTML = (state.roadmap || []).map((r, idx) => `
                <article class="agenda-item">
                    <h3>${escapeHtml(r.title)}</h3>
                    <p>${escapeHtml(r.date || '')} · ${roadmapStatusLabel(r.status)}</p>
                    <div class="agenda-actions">
                        <button type="button" class="mini-btn" data-action="move-up-roadmap" data-index="${idx}">Yukarı</button>
                        <button type="button" class="mini-btn" data-action="move-down-roadmap" data-index="${idx}">Aşağı</button>
                        <button type="button" class="mini-btn" data-action="delete-roadmap" data-index="${idx}">Sil</button>
                    </div>
                </article>
            `).join('');
        } else if (adminRoadmapList) {
            adminRoadmapList.innerHTML = '';
        }
    };

    const renderOrgChart = () => {
        const org = state.orgChart || structuredClone(DEFAULT_STATE.orgChart);
        const teams = Array.isArray(org.teams) && org.teams.length ? org.teams : DEFAULT_STATE.orgChart.teams;
        const countByTeam = (teamName) => state.members.filter((m) => (m.team || '').toLowerCase() === teamName.toLowerCase()).length;
        const setText = (id, value) => { if (qs(id)) qs(id).textContent = value; };
        setText('orgAdvisorName', org.advisorName || 'Danışman');
        setText('orgCaptainName', org.captainName || 'Takım Kaptanı');
        if (orgBranches) {
            orgBranches.innerHTML = teams.map((teamName) => {
                const list = state.members.filter((m) => (m.team || '').toLowerCase() === teamName.toLowerCase());
                const items = list.map((m) => `
                    <li class="org-member">
                        <span class="org-member-name">${escapeHtml(m.name)}</span>
                        ${m.role ? `<span class="org-member-role">${escapeHtml(m.role)}</span>` : ''}
                    </li>
                `).join('');
                return `
                    <div class="org-node org-team-node">
                        <div class="org-team-header">
                            <span class="org-team-title">${escapeHtml(teamName)}</span>
                            <span class="org-team-count">${list.length} Kişi</span>
                        </div>
                        <ul class="org-member-list">
                            ${items || '<li class="org-member-empty">Henüz üye yok</li>'}
                        </ul>
                    </div>
                `;
            }).join('');
        }
        if (orgChartPhotoEl) {
            const photoUrl = (state.orgChartPhotoUrl || '').trim();
            orgChartPhotoEl.src = photoUrl || '';
            orgChartPhotoEl.style.display = photoUrl ? 'block' : 'none';
        }
        if (qs('orgAdvisorInput')) qs('orgAdvisorInput').value = org.advisorName || '';
        if (qs('orgCaptainInput')) qs('orgCaptainInput').value = org.captainName || '';
        if (qs('orgTeamsInput')) qs('orgTeamsInput').value = teams.join(', ');
        const teamSelect = qs('memberTeamSelect');
        if (teamSelect) {
            const current = teamSelect.value;
            teamSelect.innerHTML = teams.map((team) => `<option value="${team}">${team}</option>`).join('');
            teamSelect.value = teams.includes(current) ? current : teams[0];
        }
    };

    const renderSocialLinks = () => {
        const links = state.socialLinks || {};
        Object.entries(socialLinkEls).forEach(([key, el]) => {
            if (!el) return;
            const url = String(links[key] || '').trim();
            el.href = url || '#';
        });
        if (qs('socialInstagramUrl')) qs('socialInstagramUrl').value = links.instagram || '';
        if (qs('socialTwitterUrl')) qs('socialTwitterUrl').value = links.twitter || '';
        if (qs('socialLinkedinUrl')) qs('socialLinkedinUrl').value = links.linkedin || '';
        if (qs('socialGithubUrl')) qs('socialGithubUrl').value = links.github || '';
    };

    const renderProjectGifs = () => {
        const gifs = Array.isArray(state.projectGifs) ? state.projectGifs : ['', '', ''];
        projectMediaEls.forEach((el, idx) => {
            if (!el) return;
            const url = String(gifs[idx] || '').trim();
            if (!url) return;
            el.innerHTML = `<img src="${url}" alt="Proje görseli ${idx + 1}" class="project-gif-media" loading="lazy" decoding="async" />`;
        });
        if (qs('projectGif0Url')) qs('projectGif0Url').value = gifs[0] || '';
        if (qs('projectGif1Url')) qs('projectGif1Url').value = gifs[1] || '';
        if (qs('projectGif2Url')) qs('projectGif2Url').value = gifs[2] || '';
        if (qs('orgChartPhotoUrl')) qs('orgChartPhotoUrl').value = state.orgChartPhotoUrl || '';
    };

    const renderAll = () => {
        renderLogos();
        renderGallery();
        renderTeam();
        renderOrgChart();
        renderProjectGifs();
        renderSocialLinks();
        renderSponsors();
        renderRoadmap();
        bindReveal();
    };

    const api = async (path, options = {}) => {
        const res = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', ...options });
        if (!res.ok) {
            const err = new Error(`API ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return res.status === 204 ? null : res.json();
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });
        if (!res.ok) {
            let message = `Upload ${res.status}`;
            try {
                const body = await res.json();
                if (body?.message) message = body.message;
            } catch {
                // no-op
            }
            throw new Error(message);
        }
        return res.json();
    };

    const saveState = async () => {
        if (!backendOnline) return;
        try {
            await api('/state', { method: 'PUT', body: JSON.stringify(state) });
        } catch (error) {
            if (error && error.status === 401) {
                alert('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın, değişiklikler şu an kaydedilmedi.');
                setAdminMode(false);
                openAdminPanel();
            } else {
                alert(`Kayıt başarısız: ${error?.message || 'bilinmeyen hata'}`);
            }
            throw error;
        }
    };

    const loadState = async () => {
        try {
            const data = await api('/state');
            state = { ...structuredClone(DEFAULT_STATE), ...data };
            state.members = (state.members || []).map((member) => ({
                name: member.name || '',
                team: member.team || member.role || 'Yönetim Ekibi',
                role: member.role && !member.team ? '' : (member.role || ''),
                photoUrl: member.photoUrl || ''
            }));
            backendOnline = true;
        } catch {
            backendOnline = false;
            state = structuredClone(DEFAULT_STATE);
        }
    };

    const moveItem = (arr, from, to) => {
        if (to < 0 || to >= arr.length || from === to) return;
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
    };

    const setupDragAndDrop = (container, key) => {
        if (!container) return;
        let fromIndex = -1;
        container.addEventListener('dragstart', (e) => {
            const target = e.target.closest('[data-index]');
            if (!target) return;
            fromIndex = Number.parseInt(target.dataset.index || '-1', 10);
        });
        container.addEventListener('dragover', (e) => e.preventDefault());
        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            const target = e.target.closest('[data-index]');
            if (!target || fromIndex < 0) return;
            const toIndex = Number.parseInt(target.dataset.index || '-1', 10);
            moveItem(state[key], fromIndex, toIndex);
            renderAll();
            await saveState();
        });
    };

    const adminPanel = qs('adminPanel');
    const adminContent = qs('adminContent');
    const adminLoginForm = qs('adminLoginForm');
    const admin2faForm = qs('admin2faForm');
    const openAdminPanel = () => {
        adminPanel?.classList.add('open');
        adminPanel?.setAttribute('aria-hidden', 'false');
    };
    qs('openAdmin')?.addEventListener('click', openAdminPanel);
    const closeAdmin = () => {
        adminPanel?.classList.remove('open');
        adminPanel?.setAttribute('aria-hidden', 'true');
        setAdminMode(false);
    };
    qs('closeAdmin')?.addEventListener('click', closeAdmin);
    qs('adminBackdrop')?.addEventListener('click', closeAdmin);

    // Gizli admin erisimi:
    // 1) Ctrl+Shift+A
    // 2) "aydakar" harf dizisi
    // 3) Sag ustteki gorunmez hotspot'a 5 tik
    let typedSecret = '';
    const secretWord = 'aydakar';
    let hotspotClicks = 0;
    const secretTrigger = qs('secretAdminTrigger');
    secretTrigger?.addEventListener('click', () => {
        hotspotClicks += 1;
        if (hotspotClicks >= 5) {
            hotspotClicks = 0;
            openAdminPanel();
        }
        setTimeout(() => { hotspotClicks = 0; }, 2200);
    });
    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            openAdminPanel();
            return;
        }
        if (event.key.length === 1) {
            typedSecret = (typedSecret + event.key.toLowerCase()).slice(-secretWord.length);
            if (typedSecret === secretWord) {
                typedSecret = '';
                openAdminPanel();
            }
        }
    });

    const setAdminMode = (loggedIn) => {
        isAdminAuthenticated = loggedIn;
        adminContent?.classList.toggle('hidden', !loggedIn);
        adminLoginForm?.classList.toggle('hidden', loggedIn);
        admin2faForm?.classList.add('hidden');
        renderAll();
    };
    const setAdmin2faMode = (enabled) => {
        adminLoginForm?.classList.toggle('hidden', enabled);
        admin2faForm?.classList.toggle('hidden', !enabled);
        adminContent?.classList.add('hidden');
    };

    adminLoginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = qs('adminPassword')?.value?.trim();
        if (!password) return;
        if (!backendOnline) {
            alert('Backend kapalı. `npm run dev` ile çalıştırın.');
            return;
        }
        try {
            const loginRes = await api('/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
            if (loginRes?.requiresSecondFactor) {
                setAdmin2faMode(true);
            } else {
                setAdminMode(true);
            }
            qs('adminPassword').value = '';
        } catch {
            alert('Şifre hatalı.');
        }
    });
    admin2faForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = qs('admin2faCode')?.value?.trim();
        if (!code) return;
        try {
            await api('/admin/verify-2fa', { method: 'POST', body: JSON.stringify({ code }) });
            qs('admin2faCode').value = '';
            setAdminMode(true);
        } catch {
            alert('2FA kodu hatalı veya süresi doldu.');
        }
    });

    qs('saveLogos')?.addEventListener('click', async () => {
        state.logos.team = qs('teamLogoUrl')?.value.trim() || state.logos.team;
        state.logos.teknofest = qs('teknofestLogoUrl')?.value.trim() || state.logos.teknofest;
        renderLogos();
        await saveState();
    });

    qs('uploadLogos')?.addEventListener('click', async () => {
        try {
            const teamFile = qs('teamLogoFile')?.files?.[0];
            const teknofestFile = qs('teknofestLogoFile')?.files?.[0];
            if (teamFile) {
                const uploaded = await uploadFile(teamFile);
                qs('teamLogoUrl').value = uploaded.url;
                state.logos.team = uploaded.url;
            }
            if (teknofestFile) {
                const uploaded = await uploadFile(teknofestFile);
                qs('teknofestLogoUrl').value = uploaded.url;
                state.logos.teknofest = uploaded.url;
            }
            renderLogos();
            await saveState();
            alert('Seçili logolar yüklendi.');
        } catch {
            alert('Logo yüklenemedi. Önce admin girişi yapın.');
        }
    });

    qs('uploadGalleryImage')?.addEventListener('click', async () => {
        try {
            const file = qs('galleryImageFile')?.files?.[0];
            if (!file) return alert('Önce bir fotoğraf seçin.');
            const uploaded = await uploadFile(file);
            qs('galleryImageUrl').value = uploaded.url;
            qs('galleryImageUrl').dataset.thumbnailUrl = uploaded.thumbnailUrl || '';
            alert('Fotoğraf yüklendi, URL alanına eklendi.');
        } catch (error) {
            alert(`Fotoğraf yüklenemedi: ${error.message || 'hata'}`);
        }
    });

    qs('addGalleryItem')?.addEventListener('click', async () => {
        const imageUrl = qs('galleryImageUrl')?.value.trim();
        const caption = qs('galleryCaption')?.value.trim() || '';
        if (!imageUrl) return alert('Foto URL girin.');
        const thumbnailUrl = qs('galleryImageUrl')?.dataset?.thumbnailUrl || '';
        state.gallery.unshift({ imageUrl, caption, thumbnailUrl });
        renderGallery();
        if (qs('galleryImageUrl')) {
            qs('galleryImageUrl').value = '';
            delete qs('galleryImageUrl').dataset.thumbnailUrl;
        }
        await saveState();
    });
    qs('clearGallery')?.addEventListener('click', async () => {
        state.gallery = structuredClone(DEFAULT_STATE.gallery);
        renderGallery();
        await saveState();
    });

    qs('addMemberItem')?.addEventListener('click', async () => {
        const name = qs('memberName')?.value.trim();
        const team = qs('memberTeamSelect')?.value?.trim();
        const role = qs('memberRole')?.value.trim() || '';
        if (!name || !team) return alert('İsim ve ekip seçin.');
        state.members.unshift({ name, team, role, photoUrl: qs('memberPhotoUrl')?.value.trim() || '' });
        if (qs('memberName')) qs('memberName').value = '';
        if (qs('memberRole')) qs('memberRole').value = '';
        renderTeam();
        renderOrgChart();
        await saveState();
    });

    qs('uploadMemberPhoto')?.addEventListener('click', async () => {
        try {
            const file = qs('memberPhotoFile')?.files?.[0];
            if (!file) return alert('Önce üye fotoğrafı seçin.');
            const uploaded = await uploadFile(file);
            qs('memberPhotoUrl').value = uploaded.url;
            alert('Üye fotoğrafı yüklendi, URL alanına eklendi.');
        } catch (error) {
            alert(`Üye fotoğrafı yüklenemedi: ${error.message || 'hata'}`);
        }
    });

    qs('changeAdminPassword')?.addEventListener('click', async () => {
        const password = qs('newAdminPassword')?.value.trim();
        if (!password || password.length < 6) return alert('Şifre en az 6 karakter olmalı.');
        if (!backendOnline) return alert('Backend kapalı.');
        await api('/admin/password', { method: 'PUT', body: JSON.stringify({ password }) });
        qs('newAdminPassword').value = '';
        alert('Şifre güncellendi.');
    });
    qs('changeAdmin2fa')?.addEventListener('click', async () => {
        const code = qs('newAdmin2faCode')?.value.trim();
        if (!/^\d{4,8}$/.test(code || '')) return alert('2FA kodu 4-8 hane sayi olmali.');
        if (!backendOnline) return alert('Backend kapalı.');
        await api('/admin/second-factor', { method: 'PUT', body: JSON.stringify({ code }) });
        qs('newAdmin2faCode').value = '';
        alert('2FA kodu güncellendi.');
    });

    qs('saveSocialLinks')?.addEventListener('click', async () => {
        state.socialLinks = {
            instagram: qs('socialInstagramUrl')?.value.trim() || '#',
            twitter: qs('socialTwitterUrl')?.value.trim() || '#',
            linkedin: qs('socialLinkedinUrl')?.value.trim() || '#',
            github: qs('socialGithubUrl')?.value.trim() || '#'
        };
        renderSocialLinks();
        await saveState();
        alert('Sosyal medya linkleri güncellendi.');
    });

    qs('uploadProjectGifs')?.addEventListener('click', async () => {
        try {
            const files = [
                qs('projectGif0File')?.files?.[0],
                qs('projectGif1File')?.files?.[0],
                qs('projectGif2File')?.files?.[0]
            ];
            for (let i = 0; i < files.length; i += 1) {
                if (!files[i]) continue;
                const uploaded = await uploadFile(files[i]);
                if (qs(`projectGif${i}Url`)) qs(`projectGif${i}Url`).value = uploaded.url;
            }
            alert('Seçili GIF dosyaları yüklendi.');
        } catch (error) {
            alert(`GIF yüklenemedi: ${error.message || 'hata'}`);
        }
    });

    qs('saveProjectGifs')?.addEventListener('click', async () => {
        state.projectGifs = [
            qs('projectGif0Url')?.value.trim() || '',
            qs('projectGif1Url')?.value.trim() || '',
            qs('projectGif2Url')?.value.trim() || ''
        ];
        renderProjectGifs();
        await saveState();
        alert('Teknik çalışma alanları görselleri güncellendi.');
    });

    qs('uploadOrgChartPhoto')?.addEventListener('click', async () => {
        try {
            const file = qs('orgChartPhotoFile')?.files?.[0];
            if (!file) return alert('Önce bir fotoğraf seçin.');
            const uploaded = await uploadFile(file);
            qs('orgChartPhotoUrl').value = uploaded.url;
            alert('Fotoğraf yüklendi.');
        } catch (error) {
            alert(`Fotoğraf yüklenemedi: ${error.message || 'hata'}`);
        }
    });

    qs('saveOrgChartPhoto')?.addEventListener('click', async () => {
        state.orgChartPhotoUrl = qs('orgChartPhotoUrl')?.value.trim() || '';
        renderOrgChart();
        await saveState();
        alert('Takım yapısı fotoğrafı güncellendi.');
    });

    qs('saveOrgSettings')?.addEventListener('click', async () => {
        const advisorName = qs('orgAdvisorInput')?.value.trim() || 'Danışman';
        const captainName = qs('orgCaptainInput')?.value.trim() || 'Takım Kaptanı';
        const teamsRaw = qs('orgTeamsInput')?.value || '';
        const teams = teamsRaw.split(',').map((x) => x.trim()).filter(Boolean);
        if (!teams.length) return alert('En az 1 ekip adı girin.');
        state.orgChart = { advisorName, captainName, teams };
        renderOrgChart();
        await saveState();
        alert('Organizasyon şeması güncellendi.');
    });

    galleryGrid?.addEventListener('click', async (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (t.tagName === 'IMG' && !isAdminAuthenticated) {
            const article = t.closest('[data-index]');
            const idx = article ? Number.parseInt(article.dataset.index || '-1', 10) : -1;
            if (idx >= 0) openLightbox(idx);
            return;
        }
        const i = Number.parseInt(t.dataset.index || '-1', 10);
        if (i < 0) return;
        if (t.dataset.action === 'delete-gallery') {
            if (!confirm('Bu fotoğrafı silmek istediğine emin misin?')) return;
            const removed = state.gallery[i];
            state.gallery.splice(i, 1);
            await deleteUploadedAsset(removed);
        }
        if (t.dataset.action === 'edit-gallery') {
            const item = state.gallery[i];
            const imageUrl = prompt('Yeni foto URL:', item.imageUrl);
            if (!imageUrl) return;
            item.imageUrl = imageUrl;
            if (!isUploadedFile(imageUrl)) item.thumbnailUrl = '';
            item.caption = prompt('Yeni açıklama:', item.caption || '') || '';
        }
        renderGallery();
        await saveState();
    });

    adminMembersList?.addEventListener('click', async (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        const i = Number.parseInt(t.dataset.index || '-1', 10);
        if (i < 0) return;
        if (t.dataset.action === 'delete-member') {
            const removed = state.members[i];
            state.members.splice(i, 1);
            await deleteUploadedAsset({ imageUrl: removed.photoUrl, thumbnailUrl: '' });
        }
        if (t.dataset.action === 'move-up-member') moveItem(state.members, i, i - 1);
        if (t.dataset.action === 'move-down-member') moveItem(state.members, i, i + 1);
        renderTeam();
        renderOrgChart();
        await saveState();
    });

    setupDragAndDrop(galleryGrid, 'gallery');

    // ==== Sponsor admin ====
    const sponsorPreviewEl = qs('sponsorPreview');
    const renderSponsorPreview = (url) => {
        if (!sponsorPreviewEl) return;
        if (url) {
            sponsorPreviewEl.innerHTML = `<img src="${escapeHtml(url)}" alt="Logo önizleme" />`;
            sponsorPreviewEl.classList.add('has-image');
        } else {
            sponsorPreviewEl.innerHTML = '<span class="sponsor-preview-empty">Önizleme</span>';
            sponsorPreviewEl.classList.remove('has-image');
        }
    };

    qs('sponsorLogoUrl')?.addEventListener('input', (e) => {
        renderSponsorPreview(e.target.value.trim());
    });

    qs('sponsorLogoFile')?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            renderSponsorPreview(objectUrl);
        }
    });

    const ensureSponsorLogoUploaded = async () => {
        const urlInput = qs('sponsorLogoUrl');
        const fileInput = qs('sponsorLogoFile');
        const existing = urlInput?.value.trim() || '';
        if (existing) return existing;
        const file = fileInput?.files?.[0];
        if (!file) return '';
        const uploaded = await uploadFile(file);
        if (urlInput) urlInput.value = uploaded.url;
        renderSponsorPreview(uploaded.url);
        return uploaded.url;
    };

    qs('uploadSponsorLogo')?.addEventListener('click', async () => {
        try {
            const file = qs('sponsorLogoFile')?.files?.[0];
            if (!file) return alert('Önce bir logo dosyası seçin.');
            const uploaded = await uploadFile(file);
            if (qs('sponsorLogoUrl')) qs('sponsorLogoUrl').value = uploaded.url;
            renderSponsorPreview(uploaded.url);
            alert('Logo yüklendi. Şimdi "Sponsoru Ekle" butonuna basabilirsin.');
        } catch (error) {
            alert(`Logo yüklenemedi: ${error.message || 'hata'}`);
        }
    });

    qs('addSponsorItem')?.addEventListener('click', async () => {
        const name = qs('sponsorName')?.value.trim();
        if (!name) return alert('Sponsor adı girin.');
        let logoUrl = '';
        try {
            logoUrl = await ensureSponsorLogoUploaded();
        } catch (error) {
            return alert(`Logo yüklenemedi: ${error.message || 'hata'}`);
        }
        state.sponsors = state.sponsors || [];
        state.sponsors.push({
            name,
            websiteUrl: qs('sponsorWebsite')?.value.trim() || '',
            logoUrl
        });
        if (qs('sponsorName')) qs('sponsorName').value = '';
        if (qs('sponsorWebsite')) qs('sponsorWebsite').value = '';
        if (qs('sponsorLogoUrl')) qs('sponsorLogoUrl').value = '';
        if (qs('sponsorLogoFile')) qs('sponsorLogoFile').value = '';
        renderSponsorPreview('');
        renderSponsors();
        await saveState();
    });

    adminSponsorsList?.addEventListener('click', async (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        const i = Number.parseInt(t.dataset.index || '-1', 10);
        if (i < 0) return;
        if (t.dataset.action === 'delete-sponsor') {
            if (!confirm('Sponsoru silmek istediğine emin misin?')) return;
            const removed = state.sponsors[i];
            state.sponsors.splice(i, 1);
            await deleteUploadedAsset({ imageUrl: removed?.logoUrl, thumbnailUrl: '' });
        }
        renderSponsors();
        await saveState();
    });

    // ==== Roadmap admin ====
    qs('addRoadmapItem')?.addEventListener('click', async () => {
        const title = qs('roadmapTitle')?.value.trim();
        if (!title) return alert('Başlık girin.');
        state.roadmap = state.roadmap || [];
        state.roadmap.push({
            title,
            date: qs('roadmapDate')?.value.trim() || '',
            description: qs('roadmapDescription')?.value.trim() || '',
            status: qs('roadmapStatus')?.value || 'upcoming'
        });
        ['roadmapTitle', 'roadmapDate', 'roadmapDescription'].forEach((id) => { if (qs(id)) qs(id).value = ''; });
        renderRoadmap();
        await saveState();
    });

    adminRoadmapList?.addEventListener('click', async (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        const i = Number.parseInt(t.dataset.index || '-1', 10);
        if (i < 0) return;
        if (t.dataset.action === 'delete-roadmap') {
            if (!confirm('Bu adımı silmek istediğine emin misin?')) return;
            state.roadmap.splice(i, 1);
        }
        if (t.dataset.action === 'move-up-roadmap') moveItem(state.roadmap, i, i - 1);
        if (t.dataset.action === 'move-down-roadmap') moveItem(state.roadmap, i, i + 1);
        renderRoadmap();
        await saveState();
    });

    // ==== KVKK / Gizlilik modal ====
    const policyModal = qs('policyModal');
    const openPolicy = (type) => {
        if (!policyModal) return;
        const titleEl = qs('policyTitle');
        const bodyEl = qs('policyBody');
        if (type === 'privacy') {
            titleEl.textContent = 'Gizlilik Politikası';
            bodyEl.innerHTML = `
                <p>AYDAKAR TEAM olarak ziyaretçilerimizin gizliliğine önem veriyoruz. Bu politika, web sitemiz üzerinden toplanan bilgilerin nasıl kullanıldığını açıklar.</p>
                <h4>Toplanan Veriler</h4>
                <p>İletişim formu üzerinden gönderdiğiniz ad, e-posta ve mesaj bilgileri yalnızca size dönüş yapmak amacıyla kullanılır. Üçüncü kişilerle paylaşılmaz.</p>
                <h4>Çerezler</h4>
                <p>Site temasını ve dil tercihinizi hatırlamak için tarayıcınızda küçük veriler (localStorage) saklanabilir. Bu veriler reklam veya takip amacıyla kullanılmaz.</p>
                <h4>İletişim</h4>
                <p>Gizliliğinizle ilgili her türlü talep için <strong>aydakarteam@gmail.com</strong> adresinden bize ulaşabilirsiniz.</p>
            `;
        } else {
            titleEl.textContent = 'KVKK Aydınlatma Metni';
            bodyEl.innerHTML = `
                <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla AYDAKAR TEAM olarak sizleri bilgilendirmek isteriz.</p>
                <h4>İşlenen Veriler</h4>
                <p>Web sitemiz iletişim formu üzerinden gönderdiğiniz ad, e-posta ve mesaj bilgileri kanun kapsamında işlenmektedir.</p>
                <h4>İşleme Amacı</h4>
                <p>Bu veriler yalnızca tarafınızla iletişim kurmak ve sponsorluk/işbirliği taleplerinizi değerlendirmek için kullanılır.</p>
                <h4>Saklama Süresi</h4>
                <p>Veriler, ilgili amaç için gerekli süreden daha uzun süre saklanmaz ve talebiniz hâlinde derhal silinir.</p>
                <h4>Haklarınız</h4>
                <p>KVKK 11. madde kapsamında sahip olduğunuz hakları kullanmak için <strong>aydakarteam@gmail.com</strong> adresine başvurabilirsiniz.</p>
            `;
        }
        policyModal.classList.add('open');
        policyModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };
    const closePolicy = () => {
        policyModal?.classList.remove('open');
        policyModal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };
    qs('openPrivacy')?.addEventListener('click', (e) => { e.preventDefault(); openPolicy('privacy'); });
    qs('openKvkk')?.addEventListener('click', (e) => { e.preventDefault(); openPolicy('kvkk'); });
    policyModal?.addEventListener('click', (e) => {
        if ((e.target instanceof HTMLElement) && e.target.dataset.action === 'close-policy') closePolicy();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && policyModal?.classList.contains('open')) closePolicy();
    });

    // ==== İletişim formu (mail) ====
    const contactForm = document.querySelector('.contact-form');
    const contactStatus = qs('contactStatus');
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!contactStatus) return;
        contactStatus.textContent = 'Gönderiliyor...';
        contactStatus.className = 'contact-status';
        try {
            const payload = {
                name: qs('name')?.value.trim() || '',
                email: qs('email')?.value.trim() || '',
                subject: qs('subject')?.value.trim() || '',
                message: qs('message')?.value.trim() || ''
            };
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                contactStatus.textContent = body?.message || 'Mesaj gönderilemedi.';
                contactStatus.className = 'contact-status error';
                return;
            }
            contactStatus.textContent = body?.queued
                ? 'Mesajınız alındı (mail sunucusu yapılandırılmamış, kayıt edildi).'
                : 'Mesajınız başarıyla gönderildi. En kısa sürede dönüş yapacağız.';
            contactStatus.className = 'contact-status success';
            contactForm.reset();
        } catch (err) {
            contactStatus.textContent = 'Sunucuya ulaşılamadı.';
            contactStatus.className = 'contact-status error';
        }
    });

    // ==== Analytics ziyaret pingi (oturum başına 1 kez) ====
    try {
        const visited = sessionStorage.getItem('aydakar-visit-tracked');
        if (!visited) {
            fetch(`${API_BASE}/analytics/visit`, { method: 'POST', credentials: 'same-origin' }).catch(() => {});
            sessionStorage.setItem('aydakar-visit-tracked', '1');
        }
    } catch { /* noop */ }

    // ==== TR/EN dil çevirisi (textNode bazlı, dinamik içerik dahil) ====
    const translations = {
        en: {
            'Ana Sayfa': 'Home',
            'Hakkımızda': 'About',
            '3D Model': '3D Model',
            'Projeler': 'Projects',
            'Galeri': 'Gallery',
            'Organizasyon': 'Organization',
            'Teknoloji': 'Technology',
            'Yol Haritası': 'Roadmap',
            'Sponsorlar': 'Sponsors',
            'İletişim': 'Contact',
            'TEKNOFEST SAVAŞAN İHA 2026': 'TEKNOFEST COMBAT UAV 2026',
            'AYDAKAR TEAM': 'AYDAKAR TEAM',
            'AYDAKAR Savaşan İHA': 'AYDAKAR Combat UAV',
            'Yerli Mühendislikle Göklere': 'To the Skies with National Engineering',
            'Savunma sanayii alanında yerli ve milli çözümler geliştiren, disiplinler arası bir teknoloji takımıyız. Otonom savaşan İHA sistemlerinde tam bağımsızlık vizyonuna katkı sunuyoruz.': 'We are an interdisciplinary technology team developing national and domestic defense industry solutions. We contribute to full independence in autonomous combat UAV systems.',
            'Projemizi Keşfet': 'Explore Our Project',
            'Daha Fazla Bilgi': 'Learn More',
            'Toplam Üye': 'Total Members',
            'Yazılım Ekibi': 'Software Team',
            'Mekanik Ekibi': 'Mechanical Team',
            'Elektronik Ekibi': 'Electronics Team',
            'Yönetim Ekibi': 'Management Team',
            'Kaydır': 'Scroll',
            'HAKKIMIZDA': 'ABOUT US',
            'AYDAKAR Kimdir?': 'Who is AYDAKAR?',
            'Isparta Uygulamalı Bilimler Üniversitesi bünyesinde, Savaşan İHA teknolojileri için çalışan bir ekibiz.': 'A team operating within Isparta University of Applied Sciences, working on Combat UAV technologies.',
            'Misyonumuz': 'Our Mission',
            'Vizyonumuz': 'Our Vision',
            'Çalışma Prensibimiz': 'Our Working Principle',
            'Hedefimiz': 'Our Goal',
            'Teorik bilgiyi sahada görev yapabilen yenilikçi hava sistemlerine dönüştürmek ve ülkemizin havacılık teknolojilerine katkı sunmak.': 'Transforming theoretical knowledge into innovative airborne systems that perform in the field, contributing to our country\'s aviation technologies.',
            'Savaşan İHA teknolojileri alanında güçlü, üretken, rekabetçi ve uzun vadede sürdürülebilir üretim kültürüne sahip bir yapı olmak.': 'To be a strong, productive, competitive structure with a sustainable production culture in Combat UAV technologies.',
            'Mekanik, elektronik, yazılım ve tasarım ekiplerini ortak hedefte birleştirerek yüksek performanslı, güvenilir sistemler geliştiriyoruz.': 'We unite mechanical, electronics, software and design teams around a common goal to build high-performance, reliable systems.',
            'Yalnızca yarışmaya katılmak değil; saha odaklı, özgün ve sınırları zorlayan çözümlerle Milli Teknoloji Hamlesi\'ne değer katmak.': 'Not just to compete; to add value to the National Technology Move with field-focused, original, boundary-pushing solutions.',
            'TEKNOLOJİ STACK': 'TECHNOLOGY STACK',
            'Kullandığımız Teknolojiler': 'Technologies We Use',
            'Saha odaklı geliştirme için modern yazılım, donanım ve simülasyon araçlarını birlikte kullanıyoruz.': 'We combine modern software, hardware and simulation tools for field-driven development.',
            'Yapay Zeka ve Algoritma': 'AI and Algorithms',
            'Python tabanlı görüntü işleme, nesne tespiti ve gerçek zamanlı karar mekanizmaları.': 'Python-based image processing, object detection and real-time decision systems.',
            'Gömülü Uçuş Yazılımı': 'Embedded Flight Software',
            'Düşük gecikmeli uçuş kontrol ve görev davranış algoritmaları için performans odaklı altyapı.': 'Performance-focused infrastructure for low-latency flight control and mission behavior algorithms.',
            'Haberleşme ve Arayüz': 'Communication and Interface',
            'Yüksek trafik veri iletimi ve operatör ekranları için güvenilir, okunabilir sistem yaklaşımı.': 'A reliable, readable system approach for high-traffic data transmission and operator screens.',
            'Saha Odaklı Yaklaşım': 'Field-First Approach',
            'Her tasarım kararını gerçek test verileri ve görev senaryoları ile doğruluyoruz.': 'Every design decision is validated with real test data and mission scenarios.',
            'Disiplinler Arası Ekip': 'Interdisciplinary Team',
            'Mekanik, elektronik, yazılım ve yönetim ekipleri tek hedefte entegre çalışır.': 'Mechanical, electronics, software and management teams operate integrated toward a single goal.',
            'Sürdürülebilir Gelişim': 'Sustainable Growth',
            'Her prototip döngüsünde öğrenilenleri sisteme ekleyip bir sonraki sürüme taşıyoruz.': 'We carry learnings from each prototype iteration into the next version.',
            '3D GÖRSELLEŞTİRME': '3D VISUALIZATION',
            'Projemizi 360° Keşfedin': 'Explore Our Project in 360°',
            'Mouse ile sürükleyerek geçici uçak modelimizi tüm açılardan inceleyebilirsiniz.': 'Drag with the mouse to inspect our temporary aircraft model from any angle.',
            'Model KTR\'den sonra paylaşılacaktır.': 'The model will be shared after KTR review.',
            'İNTERAKTİF': 'INTERACTIVE',
            'Projemizin 3D Modeli': '3D Model of Our Project',
            'Takımımızın geliştirdiği projenin detaylı 3D modeli burada sergilenmektedir. Modelin üzerinde mouse ile sürükleyerek 360 derece döndürebilir, scroll ile yakınlaştırıp uzaklaştırabilirsiniz.': 'The detailed 3D model of our project is showcased here. Drag with the mouse to rotate 360°, scroll to zoom.',
            'Gerçek zamanlı render': 'Real-time render',
            'Yüksek çözünürlük': 'High resolution',
            'Tam kontrol sağlayan kamera': 'Full camera control',
            'Görünümü Sıfırla': 'Reset View',
            'PROJELERİMİZ': 'OUR PROJECTS',
            'Teknik Çalışma Alanlarımız': 'Our Technical Work Areas',
            'Takımımızın odaklandığı başlıca mühendislik alanları.': 'The main engineering areas our team focuses on.',
            'Mekanik': 'Mechanical',
            'Tasarım ve Üretim Stratejisi': 'Design and Manufacturing Strategy',
            'Karbon fiber, balsa ve kompozit yapılarla hafiflik-dayanıklılık dengesini optimize eden gövde ve kanat tasarımları.': 'Fuselage and wing designs that optimize the lightness-durability balance with carbon fiber, balsa and composite structures.',
            'Yazılım ve Haberleşme': 'Software and Communication',
            'Otonomi ve Hedef Takip': 'Autonomy and Target Tracking',
            'Python tabanlı görüntü işleme, C++ uçuş algoritmaları ve Go ile yüksek hızlı telemetri altyapısı geliştiriyoruz.': 'We develop Python-based image processing, C++ flight algorithms and high-speed telemetry infrastructure with Go.',
            'Elektronik Güç Yönetimi': 'Electronics Power Management',
            'Güvenli Elektronik Mimarisi': 'Secure Electronics Architecture',
            'Uçuş kontrol kartı, sensör, GPS, ESC ve enerji dağıtım hatlarını EMI korumalı, kararlı ve göreve hazır mimaride kuruyoruz.': 'We build flight controllers, sensors, GPS, ESC and power distribution lines in an EMI-shielded, stable, mission-ready architecture.',
            'GALERİ': 'GALLERY',
            'Takım Galerisi': 'Team Gallery',
            'Atölye, saha testleri ve üretim süreçlerinden kareler.': 'Frames from the workshop, field tests and manufacturing processes.',
            'ORGANİZASYON ŞEMASI': 'ORGANIZATION CHART',
            'Takım Yapımız': 'Our Team Structure',
            'Yönetimden teknik ekiplere kadar görev dağılımı.': 'Task distribution from management down to technical teams.',
            'Danışman': 'Advisor',
            'Takım Kaptanı': 'Team Captain',
            'YOL HARİTASI': 'ROADMAP',
            'TEKNOFEST Süreç Takvimi': 'TEKNOFEST Schedule',
            'KTR, DTR ve yarışma günleri dahil tüm kritik süreçlerimizin zaman çizelgesi.': 'Timeline of all critical processes including KTR, DTR and competition days.',
            'Yaklaşan': 'Upcoming',
            'Devam Ediyor': 'Ongoing',
            'Tamamlandı': 'Completed',
            'SPONSORLARIMIZ': 'OUR SPONSORS',
            'Bize Güvenenler': 'Those Who Trust Us',
            "AYDAKAR TEAM'in yanında olan ve geleceğe destek veren değerli kuruluşlar.": 'Valued institutions standing beside AYDAKAR TEAM and supporting the future.',
            'Henüz sponsor eklenmedi.': 'No sponsors yet.',
            'Henüz yol haritası adımı eklenmedi.': 'No roadmap step yet.',
            'AYDAKAR ile Geleceği Destekleyin': 'Support the Future with AYDAKAR',
            'Sponsorluk ve iş birliği teklifleri için ekibimizle iletişime geçebilir, projemize doğrudan katkı sağlayabilirsiniz.': 'You can contact our team for sponsorship and partnership offers and contribute directly to our project.',
            'Sponsorluk İçin Ulaş': 'Reach Out for Sponsorship',
            'İLETİŞİM': 'CONTACT',
            'İletişim ve Sponsorluk': 'Contact and Sponsorship',
            'Sosyal Medya ve PR Sorumlusu Esra Eskin ile iletişime geçebilirsiniz.': 'You can reach our PR & Social Media lead Esra Eskin.',
            'Telefon:': 'Phone:',
            'E-posta:': 'E-mail:',
            'Ad Soyad': 'Full Name',
            'Adınız Soyadınız': 'Your Full Name',
            'E-posta': 'E-mail',
            'Konu': 'Subject',
            'Mesaj konusu': 'Message subject',
            'Mesajınız': 'Your Message',
            'Mesajınızı buraya yazın...': 'Write your message here...',
            'Mesaj Gönder': 'Send Message',
            'Hızlı Bağlantılar': 'Quick Links',
            'Sosyal Medya': 'Social Media',
            'Kendi imkanlarıyla prototip üreten, yerli ve özgün çözümler geliştiren genç mühendislerin takımı.': 'A team of young engineers building prototypes with their own means, developing national and original solutions.',
            'Gizlilik Politikası': 'Privacy Policy',
            'KVKK Aydınlatma Metni': 'GDPR Statement',
            '© 2026 AYDAKAR TEAM. Tüm hakları saklıdır.': '© 2026 AYDAKAR TEAM. All rights reserved.'
        }
    };

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'INPUT', 'TEXTAREA']);
    const SKIP_CONTAINERS = new Set(['adminPanel']);
    const collectTextNodes = (root, list) => {
        if (!root) return;
        if (root.id && SKIP_CONTAINERS.has(root.id)) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
                if (parent.closest('#adminPanel, #policyModal, #lightbox')) return NodeFilter.FILTER_REJECT;
                if (parent.hasAttribute('data-no-i18n')) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        let n = walker.nextNode();
        while (n) {
            list.push(n);
            n = walker.nextNode();
        }
    };

    const captureOriginalText = () => {
        const list = [];
        collectTextNodes(document.body, list);
        list.forEach((node) => {
            if (!node._i18nOriginal) {
                node._i18nOriginal = node.nodeValue;
            }
        });
    };
    let applyingLang = false;
    const applyLang = (lang) => {
        if (applyingLang) return;
        applyingLang = true;
        try {
        captureOriginalText();
        const placeholderTargets = [
            ['name', 'Adınız Soyadınız'],
            ['email', 'ornek@email.com'],
            ['subject', 'Mesaj konusu'],
            ['message', 'Mesajınızı buraya yazın...']
        ];
        const map = translations[lang] || {};
        const list = [];
        collectTextNodes(document.body, list);
        list.forEach((node) => {
            const original = node._i18nOriginal || node.nodeValue;
            const trimmed = original.trim();
            if (!trimmed) return;
            const leading = original.slice(0, original.length - original.trimStart().length);
            const trailing = original.slice(original.trimEnd().length);
            if (lang === 'tr') {
                node.nodeValue = original;
            } else if (map[trimmed]) {
                node.nodeValue = `${leading}${map[trimmed]}${trailing}`;
            }
        });
        placeholderTargets.forEach(([id, original]) => {
            const el = qs(id);
            if (!el) return;
            if (!el.dataset.i18nPlaceholder) el.dataset.i18nPlaceholder = el.placeholder || original;
            const orig = el.dataset.i18nPlaceholder;
            el.placeholder = lang === 'en' ? (map[orig] || orig) : orig;
        });
        document.documentElement.lang = lang;
        const btn = document.querySelector('[data-lang-current]');
        if (btn) btn.textContent = lang.toUpperCase();
        try { localStorage.setItem('aydakar-lang', lang); } catch { /* noop */ }
        } finally {
            applyingLang = false;
        }
    };
    const initialLang = (() => {
        try { return localStorage.getItem('aydakar-lang') || 'tr'; } catch { return 'tr'; }
    })();
    qs('langToggle')?.addEventListener('click', () => {
        const cur = document.documentElement.lang === 'en' ? 'en' : 'tr';
        applyLang(cur === 'tr' ? 'en' : 'tr');
    });

    const init = async () => {
        await loadState();
        renderAll();
        if (initialLang === 'en') applyLang('en');
    };
    init();
})();
