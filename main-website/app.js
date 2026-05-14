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
  function applyLang(l) {
    lang = l;
    document.getElementById("lang-label").textContent = l === "en" ? "HE" : "EN";
    document.body.lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "he" ? "rtl" : "ltr";

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

  /* ── Three.js hero — constellation ── */
  function initHero() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 7;

    var group = new THREE.Group();
    scene.add(group);

    /* ── Particles with vertex colours ── */
    var COUNT = window.innerWidth < 768 ? 160 : 300;
    var positions = new Float32Array(COUNT * 3);
    var colours   = new Float32Array(COUNT * 3);

    /* colour palette for cream bg: dark navy · warm brown · dark gold · warm charcoal */
    var pal = [
      [0.10, 0.15, 0.28],
      [0.20, 0.15, 0.09],
      [0.55, 0.40, 0.18],
      [0.14, 0.12, 0.08],
    ];

    for (var i = 0; i < COUNT; i++) {
      positions[i*3]   = (Math.random() - 0.5) * 28;
      positions[i*3+1] = (Math.random() - 0.5) * 17;
      positions[i*3+2] = (Math.random() - 0.5) * 11;
      var r = Math.random();
      var c = r < 0.12 ? pal[2] : (r < 0.46 ? pal[1] : (r < 0.72 ? pal[0] : pal[3]));
      colours[i*3] = c[0]; colours[i*3+1] = c[1]; colours[i*3+2] = c[2];
    }

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(colours, 3));
    group.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
      vertexColors: true, size: 0.065,
      transparent: true, opacity: 0.65, sizeAttenuation: true,
    })));

    /* ── Constellation lines ── */
    var lineVerts = [];
    var maxD2 = 4.0 * 4.0;
    for (var a = 0; a < COUNT; a++) {
      for (var b = a + 1; b < COUNT; b++) {
        var dx = positions[a*3]   - positions[b*3];
        var dy = positions[a*3+1] - positions[b*3+1];
        var dz = positions[a*3+2] - positions[b*3+2];
        if (dx*dx + dy*dy + dz*dz < maxD2) {
          lineVerts.push(
            positions[a*3], positions[a*3+1], positions[a*3+2],
            positions[b*3], positions[b*3+1], positions[b*3+2]
          );
        }
      }
    }
    var lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
    group.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
      color: 0x1a2845, transparent: true, opacity: 0.10,
    })));

    /* ── Central glow bloom (canvas sprite) ── */
    var gs = 256;
    var gc = document.createElement("canvas");
    gc.width = gc.height = gs;
    var gx = gc.getContext("2d");
    var grd = gx.createRadialGradient(gs/2, gs/2, 0, gs/2, gs/2, gs/2);
    grd.addColorStop(0,    "rgba(160,100,30,0.18)");
    grd.addColorStop(0.30, "rgba(120,75,20,0.08)");
    grd.addColorStop(0.65, "rgba(80,50,10,0.03)");
    grd.addColorStop(1,    "rgba(0,0,0,0)");
    gx.fillStyle = grd;
    gx.fillRect(0, 0, gs, gs);

    var gSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(gc),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    gSprite.scale.set(18, 11, 1);
    scene.add(gSprite);

    /* ── Mouse parallax ── */
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    document.addEventListener("mousemove", function(e) {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 1.5;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 1.0;
    }, { passive: true });

    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      var t = clock.getElapsedTime();

      group.rotation.y = t * 0.05;
      group.rotation.x = t * 0.018;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      group.rotation.y += targetX * 0.40;
      group.rotation.x += targetY * 0.28;

      camera.position.x += (targetX * 0.35 - camera.position.x) * 0.04;
      camera.position.y += (targetY * 0.22 - camera.position.y) * 0.04;

      gSprite.material.opacity = 0.88 + Math.sin(t * 0.55) * 0.12;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", function() {
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

  /* ── Count-up animation ── */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(target)) return;
      el.textContent = "0";
      var done = false;
      var observer = new IntersectionObserver(function (entries) {
        if (done || !entries[0].isIntersecting) return;
        done = true;
        observer.disconnect();
        var start = performance.now();
        var duration = 1800;
        function tick(now) {
          var p = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      observer.observe(el);
    });
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", function () {
    initHero();
    initGSAP();
    initTilt();
    initForm();
    bindWaLinks();
    initCounters();
    applyLang("he");
  });
})();
