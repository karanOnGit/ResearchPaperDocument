// Minimal Academic Notebook Portfolio & Google Docs Reader Scripts (Hono & Supabase API Powered)

// Drizzling Background Rain Canvas Animation (Landing Page Only)
class DrizzleAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.drops = [];
    this.numDrops = 45;
    this.isRunning = true;
    this.animationFrameId = null;

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize, { passive: true });

    for (let i = 0; i < this.numDrops; i++) {
      this.drops.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: Math.random() * 18 + 10,
        speed: Math.random() * 2.2 + 1.8,
        opacity: Math.random() * 0.05 + 0.035,
        slant: Math.random() * 0.4 + 0.3
      });
    }

    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.drops.length; i++) {
      const d = this.drops[i];

      this.ctx.beginPath();
      this.ctx.moveTo(d.x, d.y);
      this.ctx.lineTo(d.x - d.slant * d.length, d.y + d.length);
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${d.opacity})`;
      this.ctx.lineWidth = 0.85;
      this.ctx.stroke();

      d.y += d.speed;
      d.x -= d.slant * d.speed;

      if (d.y > this.height) {
        d.y = -d.length;
        d.x = Math.random() * (this.width + 100);
      }
      if (d.x < -50) {
        d.x = this.width + Math.random() * 50;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}

let drizzleInstance = null;
let siteData = null;
let currentActiveEssayId = null;

function renderMath() {
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}
window.renderMath = renderMath;

function getEssayById(essayId) {
  if (!siteData || !siteData.notes) return null;
  return siteData.notes.find(n => n.id === essayId || n.slug === essayId);
}

// Dynamically Render Landing Page from Supabase / API Data
function renderLandingPage(data) {
  if (!data) return;

  // 1. Meta & Header
  if (data.meta) {
    if (data.meta.pageTitle) {
      document.title = data.meta.pageTitle;
      const titleEl = document.getElementById('doc-title');
      if (titleEl) titleEl.textContent = data.meta.pageTitle;
    }
    if (data.meta.metaDescription) {
      const descEl = document.getElementById('doc-meta-desc');
      if (descEl) descEl.setAttribute('content', data.meta.metaDescription);
    }
    const logoEl = document.getElementById('author-logo');
    if (logoEl && data.meta.logoText) logoEl.textContent = data.meta.logoText;

    const avatarEl = document.getElementById('author-avatar');
    if (avatarEl && data.meta.avatarUrl) avatarEl.src = data.meta.avatarUrl;

    const footerAuthor = document.getElementById('footer-author-name');
    if (footerAuthor && data.meta.authorName) footerAuthor.textContent = data.meta.authorName;

    const readerAuthor = document.getElementById('reader-author-name');
    if (readerAuthor && data.meta.authorName) readerAuthor.textContent = data.meta.authorName;

    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) currentYearEl.textContent = data.meta.copyrightYear || new Date().getFullYear();
  }

  // 2. Hero Section
  if (data.hero) {
    const headingEl = document.getElementById('hero-heading');
    if (headingEl && data.hero.heading) headingEl.textContent = data.hero.heading;

    const bioHighlight = document.getElementById('hero-bio-highlight');
    if (bioHighlight && data.hero.bioHighlight) bioHighlight.textContent = data.hero.bioHighlight;

    const bioIntro = document.getElementById('hero-bio-intro');
    if (bioIntro && data.hero.bioIntro) bioIntro.textContent = data.hero.bioIntro;

    const moreLink = document.getElementById('hero-more-link');
    if (moreLink && data.hero.moreAboutText) {
      moreLink.textContent = data.hero.moreAboutText;
      moreLink.href = data.hero.moreAboutAnchor || '#about';
    }
  }

  // 3. About Section
  if (data.about && Array.isArray(data.about.paragraphs)) {
    const aboutContainer = document.getElementById('about-paragraphs');
    if (aboutContainer) {
      aboutContainer.innerHTML = data.about.paragraphs.map(p => `<p>${p}</p>`).join('');
    }
  }

  // 4. Notes List Section (2-Column Minimal Academic Layout)
  if (Array.isArray(data.notes)) {
    const notesContainer = document.getElementById('notes-list-container');
    if (notesContainer) {
      notesContainer.innerHTML = data.notes.map(note => `
        <article class="entry-item border-b border-[#eaeaea] py-10 sm:py-12 transition-colors">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-baseline">
            <div class="md:col-span-3 flex md:flex-col items-baseline md:items-start justify-between md:justify-start gap-1">
              <span class="text-[11px] font-mono font-medium tracking-widest uppercase text-[#888888]">${note.type || 'NOTE'}</span>
              <time class="text-xs font-mono text-[#888888]" datetime="${note.date || ''}">${note.formattedDate || note.date}</time>
            </div>

            <div class="md:col-span-9">
              <h2 class="text-xl sm:text-[1.45rem] font-bold text-black leading-snug tracking-[-0.015em] hover:text-[#555555] transition-colors cursor-pointer group" onclick="navigateToEssay('${note.id}')">
                <span class="group-hover:underline underline-offset-4 decoration-neutral-300">${note.title}</span>
              </h2>
              <p class="mt-2 text-sm sm:text-[15px] text-[#555555] leading-relaxed">
                ${note.summary || ''}
              </p>
              <div class="mt-3 text-xs font-mono text-[#888888] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>${note.readTime || '15 min'}</span>
                <span class="text-neutral-300">·</span>
                ${(note.tags || []).map(tag => `<span>${tag}</span>`).join(' ')}
              </div>
            </div>
          </div>
        </article>
      `).join('');
    }
  }
}

function navigateToHome() {
  currentActiveEssayId = null;
  history.pushState(null, '', window.location.pathname);
  
  const landingView = document.getElementById('landing-view');
  const readerView = document.getElementById('reader-view');

  if (landingView && readerView) {
    readerView.classList.add('hidden');
    landingView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (drizzleInstance) {
    drizzleInstance.start();
  }
}

async function navigateToEssay(essayId) {
  let essay = getEssayById(essayId);

  // Try fetching single note from Hono / Supabase API
  if (!essay || !essay.sections || essay.sections.length === 0) {
    try {
      const res = await fetch(`/api/notes/${essayId}`);
      if (res.ok) {
        const json = await res.json();
        essay = json.data;
      }
    } catch (e) {
      console.warn('API fetch single note fallback', e);
    }
  }

  if (!essay) return;

  currentActiveEssayId = essay.id;
  history.pushState(null, '', `#${essay.id}`);

  if (drizzleInstance) {
    drizzleInstance.stop();
  }

  const landingView = document.getElementById('landing-view');
  const readerView = document.getElementById('reader-view');
  const outlineContainer = document.getElementById('essay-outline');
  const bodyContainer = document.getElementById('essay-body');
  const docTag = document.getElementById('reader-doc-tag');

  if (docTag) {
    docTag.textContent = `${essay.type || 'NOTE'} · ${essay.formattedDate || essay.date}`;
  }

  // 1. Build Left Outline (Google Docs style)
  if (outlineContainer && essay.sections) {
    outlineContainer.innerHTML = essay.sections.map((sec, idx) => `
      <a href="#${sec.id}" class="outline-link block py-2 pl-3 -ml-[1px] text-neutral-500 hover:text-black transition-all border-l-2 border-transparent text-[13px] leading-snug ${idx === 0 ? 'active' : ''}" data-target="${sec.id}">
        ${sec.title}
      </a>
    `).join('');
  }

  // 2. Build Long-form Body
  if (bodyContainer && essay.sections) {
    let bodyHtml = `
      <div class="mb-10 sm:mb-12 border-b border-notebook-line pb-8">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-[11px] font-mono font-medium tracking-widest uppercase text-[#888888] bg-neutral-100 px-2 py-0.5 rounded">${essay.type || 'NOTE'}</span>
          <time class="text-xs font-mono text-[#888888]">${essay.formattedDate || essay.date}</time>
          <span class="text-neutral-300">·</span>
          <span class="text-xs font-mono text-[#888888]">${essay.readTime || '15 min'} read</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold text-black leading-tight tracking-[-0.025em]">
          ${essay.title}
        </h1>
        <p class="mt-3 text-base sm:text-[1.1rem] text-[#555555] italic leading-relaxed">
          ${essay.subtitle || essay.summary}
        </p>
        <div class="mt-4 text-xs font-mono text-[#888888] flex flex-wrap gap-2">
          ${(essay.tags || []).map(t => `<span>${t}</span>`).join(' ')}
        </div>
      </div>

      <div class="space-y-12 sm:space-y-16">
    `;

    essay.sections.forEach(sec => {
      bodyHtml += `
        <section id="${sec.id}" class="essay-section scroll-mt-20">
          <h2 class="text-xl sm:text-2xl font-bold text-black leading-snug tracking-[-0.015em] mb-4 pb-1 border-b border-neutral-100">
            ${sec.title}
          </h2>
          <div class="text-[15px] leading-relaxed text-neutral-800 space-y-4 font-normal">
            ${sec.content}
          </div>
        </section>
      `;
    });

    bodyHtml += `</div>`;
    bodyContainer.innerHTML = bodyHtml;
  }

  // 3. Switch Views
  if (landingView && readerView) {
    landingView.classList.add('hidden');
    readerView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // 4. Trigger Math Rendering
  renderMath();

  // 5. Setup Scroll Spy for this Essay
  setupReaderScrollSpy();
}

function setupReaderScrollSpy() {
  const sections = document.querySelectorAll('.essay-section');

  function updateActiveHeading() {
    let activeId = '';
    const scrollPosition = window.scrollY + 140;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollPosition >= sectionTop - 15) {
        activeId = section.getAttribute('id');
      }
    });

    if (!activeId && sections.length > 0) {
      activeId = sections[0].getAttribute('id');
    }

    const outlineLinks = document.querySelectorAll('#essay-outline .outline-link');
    outlineLinks.forEach((link) => {
      if (link.getAttribute('data-target') === activeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.removeEventListener('scroll', window._readerScrollHandler);
  window._readerScrollHandler = () => {
    window.requestAnimationFrame(updateActiveHeading);
  };
  window.addEventListener('scroll', window._readerScrollHandler, { passive: true });

  // Handle smooth click jumping
  const outlineLinks = document.querySelectorAll('#essay-outline .outline-link');
  outlineLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const allLinks = document.querySelectorAll('#essay-outline .outline-link');
        allLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  updateActiveHeading();
}

// Initialize Application Data from Hono API (or content.json)
async function initApp() {
  // Initialize background drizzle animation
  drizzleInstance = new DrizzleAnimation('drizzle-canvas');

  // Try fetching from Hono /api/portfolio endpoint first, fallback to content.json
  try {
    const apiRes = await fetch('/api/portfolio');
    if (apiRes.ok) {
      const json = await apiRes.json();
      siteData = json.data;
    } else {
      const fileRes = await fetch('content.json');
      if (fileRes.ok) siteData = await fileRes.json();
    }
  } catch (err) {
    try {
      const fileRes = await fetch('content.json');
      if (fileRes.ok) siteData = await fileRes.json();
    } catch (e) {
      console.warn('Using local client state');
    }
  }

  // Dynamically render the entire landing page with API data
  if (siteData) {
    renderLandingPage(siteData);
  }

  // Check URL hash on initial load
  const hash = window.location.hash.replace('#', '');
  if (hash && getEssayById(hash)) {
    navigateToEssay(hash);
  } else {
    navigateToHome();
  }

  // Listen to browser Back / Forward buttons
  window.addEventListener('popstate', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash && getEssayById(currentHash)) {
      navigateToEssay(currentHash);
    } else {
      navigateToHome();
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
