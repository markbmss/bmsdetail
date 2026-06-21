(function () {
  var WHATSAPP         = "972538998195";
  var EJS_SERVICE  = "service_qj64qxe";
  var EJS_TEMPLATE = "template_68f8gds";
  var EJS_KEY      = "yKBd1ObdVCs1wiHYY";
  var lang = "he";

  /* ── WhatsApp ── */
  function waUrl(msg) {
    return "https://wa.me/" + WHATSAPP + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }
  function partnerWaUrl(msg) {
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
  nav.querySelectorAll("a:not(.nav-dropdown-toggle)").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); });
  });

  /* ── Cities dropdown ── */
  var cityDropdown = document.querySelector(".nav-dropdown");
  var cityToggle = document.querySelector(".nav-dropdown-toggle");
  if (cityDropdown && cityToggle) {
    cityToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = cityDropdown.classList.toggle("open");
      cityToggle.setAttribute("aria-expanded", isOpen);
    });
    document.addEventListener("click", function (e) {
      if (!cityDropdown.contains(e.target)) {
        cityDropdown.classList.remove("open");
        cityToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

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

    /* colour palette for blue bg: bright silver · steel blue · cool white · mid silver */
    var pal = [
      [0.76, 0.82, 0.92],
      [0.88, 0.91, 0.96],
      [0.58, 0.68, 0.82],
      [0.45, 0.55, 0.70],
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
      color: 0xb0c4de, transparent: true, opacity: 0.22,
    })));

    /* ── Central glow bloom (canvas sprite) ── */
    var gs = 256;
    var gc = document.createElement("canvas");
    gc.width = gc.height = gs;
    var gx = gc.getContext("2d");
    var grd = gx.createRadialGradient(gs/2, gs/2, 0, gs/2, gs/2, gs/2);
    grd.addColorStop(0,    "rgba(120,170,240,0.20)");
    grd.addColorStop(0.30, "rgba(80,130,210,0.09)");
    grd.addColorStop(0.65, "rgba(40,80,160,0.03)");
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
      var msg = document.getElementById("form-msg").value.trim();

      if (!name || !phone) return;

      var text = "📋 *פנייה חדשה מהאתר*\n" +
        "שם: " + name + "\n" +
        "טלפון: " + phone + "\n" +
        (msg ? "הודעה: " + msg : "");

      window.open(partnerWaUrl(text), "_blank");
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

  /* ── Cars add-on builder ── */
  var _addonTotal = 199;
  var _addonItems = [{ name: "BMS קלאסיק", price: 199 }];

  // Single source of truth for which add-ons are selected — shared by page and modal
  var pageAddonIds = [];
  var _openBookingModal = null; // set by initBookingModal, used for ?book=1 auto-open

  function setPageCard(id, isSelected) {
    var card = document.querySelector(".addon-card[data-addon-id='" + id + "']");
    if (card) card.classList.toggle("selected", isSelected);
  }

  function initAddons() {
    var BASE = 199;
    var bar = document.getElementById("booking-bar");
    var totalEl = document.getElementById("booking-total");
    var TOTAL_ADDON_COUNT = document.querySelectorAll(".addon-card[data-addon-id]").length;

    function updateBar() {
      if (!bar || !totalEl) return; // booking bar is optional
      var raw = BASE;
      _addonItems = [{ name: "BMS קלאסיק", price: BASE }];
      pageAddonIds.forEach(function (id) {
        var card = document.querySelector(".addon-card[data-addon-id='" + id + "']");
        if (!card) return;
        var price = parseInt(card.getAttribute("data-price"), 10) || 0;
        raw += price;
        var nameEl = card.querySelector(".addon-name");
        if (nameEl) _addonItems.push({ name: nameEl.textContent.trim(), price: price });
      });
      var isBundle = TOTAL_ADDON_COUNT > 0 && pageAddonIds.length === TOTAL_ADDON_COUNT;
      _addonTotal = isBundle ? 999 : raw;
      totalEl.textContent = _addonTotal;
    }

    // Always attach card click handlers — independent of booking bar existing
    document.querySelectorAll(".addon-card[data-addon-id]").forEach(function (card) {
      card.addEventListener("click", function () {
        var id = card.dataset.addonId;
        var idx = pageAddonIds.indexOf(id);
        if (idx > -1) {
          pageAddonIds.splice(idx, 1);
          card.classList.remove("selected");
        } else {
          pageAddonIds.push(id);
          card.classList.add("selected");
        }
        updateBar();
      });
    });

    if (bar) {
      window.addEventListener("scroll", function () {
        var carsEl = document.getElementById("cars");
        if (!carsEl) return;
        var top = carsEl.getBoundingClientRect().top;
        bar.classList.toggle("visible", top < 0);
      }, { passive: true });
    }

    /* PAYMENT COMMENTED OUT — booking bar + bundle buttons wired to payment modal
    var barBtn = document.getElementById("booking-bar-btn");
    if (barBtn) barBtn.addEventListener("click", openBookingModal);

    var bundleBtn = document.getElementById("bundle-book-btn");
    if (bundleBtn) {
      bundleBtn.addEventListener("click", function () {
        _addonTotal = 199 + 499;
        _addonItems = [
          { name: "The BMS Clean (Base)", price: 199 },
          { name: "Before Selling Bundle", price: 499 }
        ];
        openBookingModal();
      });
    }
    */

    updateBar();
  }

  /* ── PAYMENT COMMENTED OUT ──
  function openBookingModal() {
    var overlay = document.getElementById("booking-modal-overlay");
    if (!overlay) return;

    var orderEl = document.getElementById("modal-order-items");
    if (orderEl) {
      orderEl.textContent = _addonItems
        .map(function (i) { return i.name + " ₪" + i.price; })
        .join(" · ");
    }
    var totalEl = document.getElementById("modal-order-total");
    if (totalEl) totalEl.textContent = "₪" + _addonTotal;

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    var first = overlay.querySelector("input, select");
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeBookingModal() {
    var overlay = document.getElementById("booking-modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function initBookingModal() {
    var closeBtn = document.getElementById("booking-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeBookingModal);

    var overlay = document.getElementById("booking-modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeBookingModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeBookingModal();
    });

    var form = document.getElementById("booking-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = document.getElementById("booking-name").value.trim();
      var phone = document.getElementById("booking-phone").value.trim();
      var carType = document.getElementById("booking-car-type").value;
      var address = document.getElementById("booking-address").value.trim();
      var date = document.getElementById("booking-date").value;

      if (!name || !phone || !address || !date) return;

      var submitBtn = form.querySelector(".booking-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = lang === "he" ? "מעבד..." : "Processing…";

      var orderSummary = _addonItems.map(function (i) { return i.name; }).join(", ");

      fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          carType: carType,
          address: address,
          preferredDate: date,
          orderSummary: orderSummary,
          totalPrice: _addonTotal
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
          } else {
            alert(lang === "he"
              ? "שגיאה ביצירת התשלום. נסה דרך וואטסאפ."
              : "Payment setup failed. Please try WhatsApp.");
            submitBtn.disabled = false;
            submitBtn.textContent = lang === "he" ? "שלם מקדמה ₪50" : "Pay ₪50 Deposit";
          }
        })
        .catch(function () {
          alert(lang === "he"
            ? "שגיאת חיבור. נסה דרך וואטסאפ."
            : "Connection error. Please try WhatsApp.");
          submitBtn.disabled = false;
          submitBtn.textContent = lang === "he" ? "שלם מקדמה ₪50" : "Pay ₪50 Deposit";
        });
    });
  }
  */

  /* ── Booking modal ── */
  function initBookingModal() {
    var SB_URL  = "https://dgyvidlvqgghcftrvelu.supabase.co";
    // anon key is intentionally public — RLS restricts reads, only inserts allowed
    var SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRneXZpZGx2cWdnaGNmdHJ2ZWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzAxNzEsImV4cCI6MjA5MzQwNjE3MX0.Nysxc2X3rlz3TAy_Hm3t24464Qe3h2lrtHuZQcNMKLk";

    var overlay  = document.getElementById("bk-overlay");
    if (!overlay) return;

    var sb = null;
    function getSB() {
      if (!sb && window.supabase) sb = window.supabase.createClient(SB_URL, SB_ANON);
      return sb;
    }

    var BASE_SVC = { id: "base", name: "BMS קלאסיק", price: 199, dur: 90 };

    var ADDONS = [
      { id: "wheels",     name: "גלגלים וצמיגים",             price: 40  },
      { id: "plastics",   name: "שחזור פלסטיקים חיצוניים",   price: 40  },
      { id: "vacuum",     name: "שאיבת אבק מלאה + שיער חיות",price: 50  },
      { id: "engine",     name: "ניקוי תא מנוע",              price: 60  },
      { id: "spray",      name: "ספריי הגנה (2 שבועות)",      price: 80  },
      { id: "headliner",  name: "גג פנימי",                   price: 80  },
      { id: "spare",      name: "גלגל רזרבי",                 price: 80  },
      { id: "odor",       name: "סילוק ריחות (אוזון)",        price: 100 },
      { id: "leather",    name: "פלסטיק ועור — שחזור",        price: 120 },
      { id: "shampoo",    name: "שמפו לריפוד ושטיחים",        price: 130 },
      { id: "headlights", name: "שחזור פנסים קדמיים",         price: 200 }
    ];

    var state = { addons: [], date: "", timeHour: null, timeName: "" };

    // ── Build add-on rows ──
    var addonsListEl = document.getElementById("bk-addons-list");
    var addonCountEl = document.getElementById("bk-addon-count");
    var MIN_ADDONS = 3;

    var ALL_INCLUDED_PRICE = 999;

    function computeTotal() {
      return state.addons.reduce(function (sum, id) {
        var a = ADDONS.find(function (x) { return x.id === id; });
        return sum + (a ? a.price : 0);
      }, 0) + BASE_SVC.price;
    }

    function updateAddonCount() {
      var n = state.addons.length;
      var allSelected = n === ADDONS.length;
      var met = n >= MIN_ADDONS;

      if (addonCountEl) {
        addonCountEl.textContent = allSelected
          ? "הכל כלול ✓"
          : met
            ? n + " תוספות נבחרו ✓"
            : n + " מתוך " + MIN_ADDONS + " תוספות נבחרו";
        addonCountEl.classList.toggle("bk-met", met);
      }

      var totalEl = document.getElementById("bk-total-price");
      var discountEl = document.getElementById("bk-discount-row");
      if (totalEl) {
        var rawTotal = computeTotal();
        if (allSelected) {
          totalEl.textContent = "₪" + ALL_INCLUDED_PRICE;
          totalEl.classList.add("bk-bundle");
          if (discountEl) {
            discountEl.innerHTML =
              '<span class="bk-strike">₪' + rawTotal + '</span>' +
              '<span class="bk-save-tag">חסוך ₪' + (rawTotal - ALL_INCLUDED_PRICE) + '</span>';
            discountEl.classList.add("bk-show");
          }
        } else {
          totalEl.textContent = "₪" + rawTotal;
          totalEl.classList.remove("bk-bundle");
          if (discountEl) discountEl.classList.remove("bk-show");
        }
      }
    }

    ADDONS.forEach(function (a) {
      var row = document.createElement("div");
      row.className = "bk-addon-row";
      row.dataset.addonId = a.id;
      row.innerHTML =
        '<span class="bk-addon-box"></span>' +
        '<span class="bk-addon-row-name">' + a.name + '</span>' +
        '<span class="bk-addon-row-price">+₪' + a.price + '</span>';
      row.addEventListener("click", function () {
        row.classList.toggle("bk-sel");
        var nowSel = row.classList.contains("bk-sel");
        var idx = state.addons.indexOf(a.id);
        var pageIdx = pageAddonIds.indexOf(a.id);
        if (nowSel) {
          if (idx === -1) state.addons.push(a.id);
          if (pageIdx === -1) pageAddonIds.push(a.id);
        } else {
          if (idx > -1) state.addons.splice(idx, 1);
          if (pageIdx > -1) pageAddonIds.splice(pageIdx, 1);
        }
        setPageCard(a.id, nowSel); // keep main page card in sync
        updateAddonCount();
        clearErr(1);
      });
      addonsListEl.appendChild(row);
    });


    // ── Date strip ──
    var dateStripEl = document.getElementById("bk-date-strip");
    var DAY_NAMES = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","שב׳"];
    var MONTH_NAMES = ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];
    if (dateStripEl) {
      for (var _di = 1; _di <= 21; _di++) {
        (function (offset) {
          var d = new Date(); d.setDate(d.getDate() + offset);
          var isSat = d.getDay() === 6;
          var y = d.getFullYear(), mo = d.getMonth(), dd = d.getDate();
          var dateStr = y + "-" + String(mo + 1).padStart(2,"0") + "-" + String(dd).padStart(2,"0");
          var card = document.createElement("button");
          card.type = "button";
          card.className = "bk-day-card" + (isSat ? " bk-disabled" : "");
          card.dataset.date = dateStr;
          card.innerHTML =
            '<span class="bk-day-name">' + DAY_NAMES[d.getDay()] + '</span>' +
            '<span class="bk-day-num">' + dd + '</span>' +
            '<span class="bk-day-month">' + MONTH_NAMES[mo] + '</span>';
          if (!isSat) {
            card.addEventListener("click", function () {
              dateStripEl.querySelectorAll(".bk-day-card").forEach(function (c) { c.classList.remove("bk-sel"); });
              card.classList.add("bk-sel");
              state.date = card.dataset.date;
              clearErr(2);
            });
          }
          dateStripEl.appendChild(card);
        })(_di);
      }
    }

    // ── Time block buttons ──
    overlay.querySelectorAll(".bk-time-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        overlay.querySelectorAll(".bk-time-btn").forEach(function (b) { b.classList.remove("bk-sel"); });
        btn.classList.add("bk-sel");
        state.timeHour = parseInt(btn.dataset.hour, 10);
        state.timeName = btn.querySelector(".bk-tname").textContent + " (" + btn.querySelector(".bk-trange").textContent + ")";
      });
    });

    // ── Step navigation ──
    var panels = {
      1: document.getElementById("bk-p1"),
      2: document.getElementById("bk-p2"),
      3: document.getElementById("bk-p3"),
      4: document.getElementById("bk-success")
    };
    var stepEls = overlay.querySelectorAll(".bk-step");

    function goTo(n) {
      Object.values(panels).forEach(function (p) { if (p) p.classList.remove("bk-active"); });
      if (panels[n]) panels[n].classList.add("bk-active");
      stepEls.forEach(function (s) {
        var sn = parseInt(s.dataset.step, 10);
        s.classList.toggle("active", sn === n);
        s.classList.toggle("done", sn < n);
      });
      var stepsWrap = document.getElementById("bk-steps");
      if (stepsWrap) stepsWrap.style.visibility = n === 4 ? "hidden" : "visible";
      overlay.querySelector(".bk-modal").scrollTop = 0;
    }

    function showErr(panelN, msg) {
      var el = document.getElementById("bk-err" + panelN);
      if (el) { el.textContent = msg; el.classList.add("bk-show"); }
    }
    function clearErr(panelN) {
      var el = document.getElementById("bk-err" + panelN);
      if (el) { el.textContent = ""; el.classList.remove("bk-show"); }
    }

    document.getElementById("bk-next1").addEventListener("click", function () {
      if (state.addons.length < MIN_ADDONS) {
        showErr(1, "יש לבחור לפחות " + MIN_ADDONS + " תוספות להמשך");
        return;
      }
      clearErr(1); goTo(2);
      if (window.fbq) fbq('track', 'InitiateCheckout');
    });

    document.getElementById("bk-next2").addEventListener("click", function () {
      if (!state.date) { showErr(2, "אנא בחר תאריך"); return; }
      if (state.timeHour === null) { showErr(2, "אנא בחר שעת טיפול"); return; }
      clearErr(2); goTo(3); document.getElementById("bk-name").focus();
    });

    overlay.querySelectorAll("[data-bk-back]").forEach(function (btn) {
      btn.addEventListener("click", function () { goTo(parseInt(btn.dataset.bkBack, 10)); });
    });

    // ── Rate limiting: one booking per phone per 24 h (localStorage) ──
    function canBook(phone) {
      try {
        var key = "bms_last_" + phone.replace(/\D/g, "");
        var last = parseInt(localStorage.getItem(key) || "0", 10);
        return Date.now() - last > 24 * 60 * 60 * 1000;
      } catch (e) { return true; }
    }
    function recordBook(phone) {
      try {
        var key = "bms_last_" + phone.replace(/\D/g, "");
        localStorage.setItem(key, String(Date.now()));
      } catch (e) {}
    }

    // ── Submit ──
    document.getElementById("bk-submit").addEventListener("click", function () {
      var name    = document.getElementById("bk-name").value.trim();
      var phone   = document.getElementById("bk-phone").value.trim();
      var car     = document.getElementById("bk-car").value.trim();
      var address = document.getElementById("bk-addr").value.trim();
      if (!name)    { showErr(3, "אנא הזן שם מלא"); return; }
      if (!phone)   { showErr(3, "אנא הזן מספר טלפון"); return; }
      if (!address) { showErr(3, "אנא הזן כתובת לטיפול"); return; }
      if (!canBook(phone)) {
        showErr(3, "כבר קיבלנו הזמנה ממספר זה היום. לשינוי או ביטול צרו קשר ישירות.");
        return;
      }
      clearErr(3);
      recordBook(phone);
      submitBooking({ name: name, phone: phone, car: car, address: address });
    });

    function submitBooking(contact) {
      var btn = document.getElementById("bk-submit");
      btn.disabled = true; btn.textContent = "שולח...";

      // Build date display
      var parts = state.date.split("-");
      var startD = new Date(+parts[0], +parts[1] - 1, +parts[2], state.timeHour, 0, 0);
      var dateFmt = startD.toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      // Build add-ons summary
      var addonsSelected = ADDONS.filter(function (a) { return state.addons.indexOf(a.id) > -1; });
      var addonLines = addonsSelected.length
        ? addonsSelected.map(function (a) { return "• " + a.name + " — ₪" + a.price; }).join("\n")
        : "ללא תוספות";
      var allSelected = state.addons.length === ADDONS.length;
      var finalPrice = allSelected ? ALL_INCLUDED_PRICE : computeTotal();

      // Show success screen immediately — don't make the user wait for the email
      document.getElementById("bk-summary").textContent =
        BASE_SVC.name + " · " + dateFmt + " · " + state.timeName;
      goTo(4);
      btn.disabled = false; btn.textContent = "הזמן עכשיו";
      if (window.fbq) fbq('track', 'Schedule');

      // Send email to owner in the background
      if (window.emailjs) {
        emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
          customer_name:    contact.name,
          customer_phone:   contact.phone,
          customer_car:     contact.car || "לא צוין",
          customer_address: contact.address,
          booking_date:     dateFmt,
          booking_time:     state.timeName,
          addons:           addonLines,
          total_price:      finalPrice
        }).catch(function (err) {
          console.warn("EmailJS error:", err);
        });
      }

      // Create Google Calendar event in the background
      fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:    contact.name,
          customerPhone:   contact.phone,
          customerCar:     contact.car || "לא צוין",
          customerAddress: contact.address,
          date:            state.date,
          timeHour:        state.timeHour,
          timeName:        state.timeName,
          addons:          addonLines,
          finalPrice:      finalPrice
        })
      }).catch(function (err) {
        console.warn("Calendar API error:", err);
      });
    }

    // ── Open / Close ──
    function openModal(preSelectAll, fromPage) {
      // Reset state
      state.addons = []; state.date = ""; state.timeHour = null; state.timeName = "";
      overlay.querySelectorAll(".bk-time-btn").forEach(function (b) { b.classList.remove("bk-sel"); });
      if (dateStripEl) dateStripEl.querySelectorAll(".bk-day-card").forEach(function (c) { c.classList.remove("bk-sel"); });
      ["bk-name","bk-phone","bk-car","bk-addr"].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.value = "";
      });
      [1,2,3].forEach(clearErr);

      // Determine which add-ons to pre-select
      addonsListEl.querySelectorAll(".bk-addon-row").forEach(function (r) { r.classList.remove("bk-sel"); });
      if (preSelectAll) {
        // "All Included" — select everything and update page cards too
        state.addons = ADDONS.map(function (a) { return a.id; });
        pageAddonIds = ADDONS.map(function (a) { return a.id; });
        addonsListEl.querySelectorAll(".bk-addon-row").forEach(function (r) { r.classList.add("bk-sel"); });
        ADDONS.forEach(function (a) { setPageCard(a.id, true); });
      } else if (fromPage) {
        // Mirror whatever is currently in pageAddonIds (the shared truth)
        pageAddonIds.forEach(function (id) {
          if (state.addons.indexOf(id) === -1) state.addons.push(id);
          var row = addonsListEl.querySelector("[data-addon-id='" + id + "']");
          if (row) row.classList.add("bk-sel");
        });
      }
      updateAddonCount();

      goTo(1);
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
      if (window.fbq) fbq('track', 'ViewContent');
    }

    function closeModal() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    document.getElementById("bk-close").addEventListener("click", closeModal);
    document.getElementById("bk-done").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    // Generic "Book Now" buttons — open fresh with no pre-selections
    document.querySelectorAll(".btn-book").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); openModal(false, false); });
    });
    // Sticky booking bar — carry over any add-ons checked on the main page
    var barBookBtn = document.getElementById("booking-bar-btn");
    if (barBookBtn) {
      barBookBtn.addEventListener("click", function (e) { e.preventDefault(); openModal(false, true); });
    }
    // "Book with selected add-ons" button in the add-ons section
    var bookFromAddonsBtn = document.getElementById("book-from-addons-btn");
    if (bookFromAddonsBtn) {
      bookFromAddonsBtn.addEventListener("click", function (e) { e.preventDefault(); openModal(false, true); });
    }
    // "All Included" bundle button — pre-selects everything
    document.querySelectorAll("[data-open-booking='all']").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); openModal(true, false); });
    });
    _openBookingModal = openModal;
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", function () {
    if (window.emailjs) emailjs.init({ publicKey: EJS_KEY });
    initHero();
    initGSAP();
    initTilt();
    initForm();
    bindWaLinks();
    initCounters();
    initAddons();
    initBookingModal();
    applyLang("he");

    // Auto-open booking popup when coming from a Meta ad (?book=1)
    if (new URLSearchParams(window.location.search).get("book") === "1") {
      setTimeout(function () { if (_openBookingModal) _openBookingModal(false, false); }, 600);
    }
  });

  /* ── Initial language: Hebrew ── */
  applyLang("he");
})();
