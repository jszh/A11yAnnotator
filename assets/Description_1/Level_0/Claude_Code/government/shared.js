// Shared header and footer HTML + navigation logic

const HEADER_HTML = `
<header class="bg-blue-900 text-white shadow-lg">
  <!-- Emergency Alert Banner -->
  <div class="bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium flex items-center justify-between">
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span><strong>Road Closure:</strong> Main St between 3rd and 5th Ave — closed until Nov 30 for utility repairs.</span>
    </div>
    <a href="#" class="text-amber-900 underline text-xs whitespace-nowrap ml-4">Details</a>
  </div>
  <!-- Top utility bar -->
  <div class="border-b border-blue-800 px-4 py-1.5 flex items-center justify-between text-xs text-blue-200">
    <div class="flex items-center gap-4">
      <span>City of Lakewood, Colorado</span>
      <span>|</span>
      <a href="#" class="hover:text-white transition">Accessibility</a>
      <a href="#" class="hover:text-white transition">Language / Idioma</a>
    </div>
    <div class="flex items-center gap-4">
      <a href="#" class="hover:text-white transition">Employee Portal</a>
      <a href="contact.html" class="hover:text-white transition">Contact Us</a>
    </div>
  </div>
  <!-- Main header -->
  <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
    <a href="index.html" class="flex items-center gap-3">
      <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-8 h-8 text-blue-900" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v2h20V7L12 2zm0 2.18L18.6 7H5.4L12 4.18zM3 10v10h4v-6h10v6h4V10H3zm6 6v4H9v-4h2zm4 0v4h-2v-4h2z"/>
        </svg>
      </div>
      <div>
        <div class="text-xl font-bold tracking-tight leading-tight">City of Lakewood</div>
        <div class="text-xs text-blue-300 tracking-wide uppercase">Official Government Portal</div>
      </div>
    </a>
    <!-- Nav -->
    <nav class="hidden md:flex items-center gap-1 text-sm">
      <a href="index.html" class="nav-link px-3 py-2 rounded hover:bg-blue-800 transition font-medium">Home</a>
      <a href="services.html" class="nav-link px-3 py-2 rounded hover:bg-blue-800 transition font-medium">Services</a>
      <a href="about.html" class="nav-link px-3 py-2 rounded hover:bg-blue-800 transition font-medium">About</a>
      <a href="contact.html" class="nav-link px-3 py-2 rounded hover:bg-blue-800 transition font-medium">Contact</a>
      <a href="pay-bill.html" class="ml-3 bg-amber-400 text-amber-950 px-4 py-2 rounded font-semibold hover:bg-amber-300 transition text-sm">Pay a Bill</a>
    </nav>
    <!-- Mobile menu button -->
    <button id="mobile-menu-btn" class="md:hidden p-2 rounded hover:bg-blue-800" onclick="toggleMobileMenu()">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
  </div>
  <!-- Mobile nav -->
  <div id="mobile-menu" class="hidden md:hidden border-t border-blue-800 bg-blue-900">
    <nav class="px-4 py-3 flex flex-col gap-1 text-sm">
      <a href="index.html" class="px-3 py-2 rounded hover:bg-blue-800">Home</a>
      <a href="services.html" class="px-3 py-2 rounded hover:bg-blue-800">Services</a>
      <a href="about.html" class="px-3 py-2 rounded hover:bg-blue-800">About</a>
      <a href="contact.html" class="px-3 py-2 rounded hover:bg-blue-800">Contact</a>
      <a href="pay-bill.html" class="px-3 py-2 rounded bg-amber-400 text-amber-950 font-semibold mt-1">Pay a Bill</a>
    </nav>
  </div>
</header>
`;

const FOOTER_HTML = `
<footer class="bg-blue-950 text-blue-200 mt-16">
  <div class="max-w-7xl mx-auto px-4 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
      <div>
        <div class="text-white font-bold text-lg mb-3">City of Lakewood</div>
        <p class="text-sm leading-relaxed text-blue-300">480 S. Allison Pkwy<br>Lakewood, CO 80226</p>
        <p class="text-sm mt-2 text-blue-300">Main: (303) 987-7000<br>TTY: (303) 987-7057</p>
        <div class="flex gap-3 mt-4">
          <a href="#" class="text-blue-400 hover:text-white transition" aria-label="Facebook">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="#" class="text-blue-400 hover:text-white transition" aria-label="Twitter/X">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
          </a>
          <a href="#" class="text-blue-400 hover:text-white transition" aria-label="YouTube">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
          </a>
          <a href="#" class="text-blue-400 hover:text-white transition" aria-label="Instagram">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/></svg>
          </a>
        </div>
      </div>
      <div>
        <div class="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Services</div>
        <ul class="space-y-2 text-sm">
          <li><a href="pay-bill.html" class="hover:text-white transition">Pay a Bill</a></li>
          <li><a href="permits.html" class="hover:text-white transition">Permits & Licenses</a></li>
          <li><a href="services.html" class="hover:text-white transition">Public Safety</a></li>
          <li><a href="services.html" class="hover:text-white transition">Parks & Recreation</a></li>
          <li><a href="services.html" class="hover:text-white transition">Transportation</a></li>
          <li><a href="services.html" class="hover:text-white transition">Social Services</a></li>
        </ul>
      </div>
      <div>
        <div class="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Government</div>
        <ul class="space-y-2 text-sm">
          <li><a href="about.html" class="hover:text-white transition">About Lakewood</a></li>
          <li><a href="about.html#leadership" class="hover:text-white transition">City Council</a></li>
          <li><a href="#" class="hover:text-white transition">Mayor's Office</a></li>
          <li><a href="#" class="hover:text-white transition">City Departments</a></li>
          <li><a href="#" class="hover:text-white transition">Agendas & Minutes</a></li>
          <li><a href="#" class="hover:text-white transition">Public Records</a></li>
        </ul>
      </div>
      <div>
        <div class="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Resources</div>
        <ul class="space-y-2 text-sm">
          <li><a href="#" class="hover:text-white transition">Emergency Preparedness</a></li>
          <li><a href="#" class="hover:text-white transition">Community Events</a></li>
          <li><a href="#" class="hover:text-white transition">Job Opportunities</a></li>
          <li><a href="#" class="hover:text-white transition">Open Data Portal</a></li>
          <li><a href="contact.html" class="hover:text-white transition">Contact Us</a></li>
          <li><a href="#" class="hover:text-white transition">Report a Problem</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-blue-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-blue-400">
      <div>© 2024 City of Lakewood, Colorado. All rights reserved.</div>
      <div class="flex gap-4">
        <a href="#" class="hover:text-white transition">Privacy Policy</a>
        <a href="#" class="hover:text-white transition">Terms of Use</a>
        <a href="#" class="hover:text-white transition">Sitemap</a>
        <a href="#" class="hover:text-white transition">Accessibility</a>
      </div>
    </div>
  </div>
</footer>
`;

function renderHeader() {
  document.getElementById('header-placeholder').innerHTML = HEADER_HTML;
  // Highlight active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('bg-blue-800');
    }
  });
}

function renderFooter() {
  document.getElementById('footer-placeholder').innerHTML = FOOTER_HTML;
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});
