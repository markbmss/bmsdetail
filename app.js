(function () {
  var WHATSAPP = "972538998195";
  var lang = "en";

  /* ── WhatsApp ── */
  function waUrl(msg) {
    return "https://wa.me/" + WHATSAPP + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }

  function bindWaLinks() {
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var msg = el.getAttribute("data-wa-msg") || "Hi, I'd like to book a detailing treatment.";
        window.open(waUrl(msg), "_blank");
      });
    });
  }

  /* ── Language toggle ── */
  var translations = {
    en: {
      "nav-cars": "Cars", "nav-yacht": "Yacht", "nav-jets": "Jets",
      "nav-shop": "Shop", "nav-about": "About", "nav-gallery": "Gallery",
      "nav-contact": "Contact", "btn-book": "Book Now",
    },
    he: {
      "nav-cars": "רכבים", "nav-yacht": "יאכטות", "nav-jets": "מטוסים",
      "nav-shop": "חנות", "nav-about": "אודות", "nav-gallery": "גלריה",
      "nav-contact": "צור קשר", "btn-book": "הזמן עכשיו",
    }
  };

  function applyLang(l) {
    lang = l;
    document.getElementById("lang-label").textContent = l === "en" ? "HE" : "EN";
    document.body.lang = l;
    document.documentElement.lang = l;

    document.querySelectorAll("[data-" + l + "]").forEach(function (el) {
      var val = el.getAttribute("data-" + l);
      if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-" + l + "-ph]").forEach(function (el) {
      var ph = el.getAttribute("data-" + l + "-ph");
      if (ph) el.placeholder = ph;
    });

    document.querySelectorAll("select[data-" + l + "] option, .form-select option").forEach(function (opt) {
      var val = opt.getAttribute("data-" + l);
      if (val) opt.textContent = val;
    });
  }

  document.getElementById("lang-toggle").addEventListener("click", function () {
    applyLang(lang === "en" ? "he" : "en");
  });

  /* ── Header scroll ── */
  var header = document.getElementById("site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });

  /* ── Mobile nav ── */
  var burger = document.getElementById("nav-burger");
  var nav = document.getElementById("header-nav");
  burger.addEventListener("click", function () {
    nav.classList.toggle("open");
  });
  document.addEventListener("click", function (e) {
    if (!header.contains(e.target)) nav.classList.remove("open");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); });
  });

  /* ── Three.js sparkle hero ── */
  function initHero() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;

    var count = 180;
    var positions = new Float32Array(count * 3);
    var speeds = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i] = 0.0003 + Math.random() * 0.0005;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var mat = new THREE.PointsMaterial({
      size: 0.055,
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    var particles = new THREE.Points(geo, mat);
    scene.add(particles);

    var mouseX = 0, mouseY = 0;
    var targetX = 0, targetY = 0;

    document.addEventListener("mousemove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 0.4;
    }, { passive: true });

    var clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.015;

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      particles.rotation.y += targetX * 0.3;
      particles.rotation.x += targetY * 0.2;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
  }

  /* ── GSAP animations ── */
  function initGSAP() {
    if (typeof gsap === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance */
    var tl = gsap.timeline({ delay: 0.2 });
    tl.to(".hero-eyebrow", { opacity: 1, duration: 0.6, ease: "power2.out" })
      .to(".hero-word", {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power3.out"
      }, "-=0.2")
      .to(".hero-sub", { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .to(".hero-actions", { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.2");

    /* Reveal elements on scroll */
    gsap.utils.toArray(".reveal").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        onEnter: function () { el.classList.add("visible"); }
      });
    });

    /* Package cards stagger */
    document.querySelectorAll(".section").forEach(function (section) {
      var cards = section.querySelectorAll(".package-card");
      if (!cards.length) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        onEnter: function () {
          cards.forEach(function (card, i) {
            setTimeout(function () { card.classList.add("visible"); }, i * 80);
          });
        }
      });
    });

    /* Section title slides */
    gsap.utils.toArray(".section-head").forEach(function (head) {
      gsap.from(head.querySelector(".section-title"), {
        scrollTrigger: { trigger: head, start: "top 85%" },
        opacity: 0, y: 24, duration: 0.7, ease: "power2.out"
      });
    });
  }

  /* ── Card tilt on mouse ── */
  function initTilt() {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "perspective(600px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 6) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ── Contact form → WhatsApp ── */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("form-name").value.trim();
      var phone = document.getElementById("form-phone").value.trim();
      var service = document.getElementById("form-service").value;
      var msg = document.getElementById("form-msg").value.trim();

      if (!name || !phone) return;

      var text = "Hi, I'd like to book a detailing treatment.\n";
      text += "Name: " + name + "\n";
      text += "Phone: " + phone + "\n";
      if (service) text += "Service: " + service + "\n";
      if (msg) text += "Notes: " + msg;

      window.open(waUrl(text), "_blank");
    });
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", function () {
    initHero();
    initGSAP();
    initTilt();
    initForm();
    bindWaLinks();
    applyLang("en");
  });
})();
