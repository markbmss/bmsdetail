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

  /* ── Bottom sheet booking ── */
  function initBookingSheet() {
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
      { id: "headlights", name: "שחזור פנסים קדמיים",         price: 200 },
      { id: "ceramic",    name: "ציפוי קרמי",                  price: 600 }
    ];

    var overlay     = document.getElementById("bs-overlay");
    if (!overlay) return;

    var state = { pkgName: "", pkgPrice: 0, addonIds: [], date: "", timeHour: null, timeName: "" };

    // ── Date strip ──
    var dateStripEl = document.getElementById("bs-date-strip");
    var DAY_NAMES   = ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","שב׳"];
    var MONTH_NAMES = ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];

    // ── Availability ──
    var bookedSlots = {};

    function refreshTimeButtons() {
      var booked = bookedSlots[state.date] || [];
      overlay.querySelectorAll(".bs-time-btn").forEach(function (btn) {
        var hour = parseInt(btn.dataset.hour, 10);
        btn.classList.remove("bs-sel", "bs-disabled");
        if (booked.indexOf(hour) > -1) btn.classList.add("bs-disabled");
      });
      if (state.timeHour !== null && booked.indexOf(state.timeHour) > -1) {
        state.timeHour = null; state.timeName = "";
      }
    }

    function fetchAvailability() {
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var fmt = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
      var from = new Date(); from.setDate(from.getDate() + 1);
      var to   = new Date(); to.setDate(to.getDate() + 21);
      fetch("/api/availability?from=" + fmt(from) + "&to=" + fmt(to))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          bookedSlots = data;
          if (dateStripEl) {
            dateStripEl.querySelectorAll(".bs-day-card").forEach(function (card) {
              var b = bookedSlots[card.dataset.date] || [];
              if (b.length >= 3) card.classList.add("bs-disabled");
            });
          }
          if (state.date) refreshTimeButtons();
        })
        .catch(function (err) { console.warn("Availability fetch failed:", err); });
    }

    if (dateStripEl) {
      for (var _di = 1; _di <= 21; _di++) {
        (function (offset) {
          var d = new Date(); d.setDate(d.getDate() + offset);
          var isSat = d.getDay() === 6;
          var y = d.getFullYear(), mo = d.getMonth(), dd = d.getDate();
          var dateStr = y + "-" + String(mo + 1).padStart(2,"0") + "-" + String(dd).padStart(2,"0");
          var card = document.createElement("button");
          card.type = "button";
          card.className = "bs-day-card" + (isSat ? " bs-disabled" : "");
          card.dataset.date = dateStr;
          card.innerHTML =
            '<span class="bs-day-name">' + DAY_NAMES[d.getDay()] + '</span>' +
            '<span class="bs-day-num">' + dd + '</span>' +
            '<span class="bs-day-month">' + MONTH_NAMES[mo] + '</span>';
          if (!isSat) {
            card.addEventListener("click", function () {
              dateStripEl.querySelectorAll(".bs-day-card").forEach(function (c) { c.classList.remove("bs-sel"); });
              card.classList.add("bs-sel");
              state.date = card.dataset.date;
              clearErr();
              refreshTimeButtons();
            });
          }
          dateStripEl.appendChild(card);
        })(_di);
      }
    }

    // ── Time block buttons ──
    overlay.querySelectorAll(".bs-time-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("bs-disabled")) return;
        overlay.querySelectorAll(".bs-time-btn").forEach(function (b) { b.classList.remove("bs-sel"); });
        btn.classList.add("bs-sel");
        state.timeHour = parseInt(btn.dataset.hour, 10);
        state.timeName = btn.querySelector(".bs-time-name").textContent +
          " (" + btn.querySelector(".bs-time-range").textContent + ")";
        clearErr();
      });
    });

    // ── Rate limiting ──
    function canBook(phone) {
      try {
        var key = "bms_last_" + phone.replace(/\D/g, "");
        var last = parseInt(localStorage.getItem(key) || "0", 10);
        return Date.now() - last > 24 * 60 * 60 * 1000;
      } catch (e) { return true; }
    }
    function recordBook(phone) {
      try {
        localStorage.setItem("bms_last_" + phone.replace(/\D/g, ""), String(Date.now()));
      } catch (e) {}
    }

    function clearErr() {
      var el = document.getElementById("bs-err");
      if (el) el.textContent = "";
    }
    function showErr(msg) {
      var el = document.getElementById("bs-err");
      if (el) el.textContent = msg;
    }

    // ── Submit ──
    document.getElementById("bs-submit").addEventListener("click", function () {
      var name  = document.getElementById("bs-name").value.trim();
      var phone = document.getElementById("bs-phone").value.trim();
      if (!state.date)            { showErr("אנא בחר תאריך"); return; }
      if (state.timeHour === null) { showErr("אנא בחר שעת טיפול"); return; }
      if (!name)                  { showErr("אנא הזן שם מלא"); return; }
      if (!phone)                 { showErr("אנא הזן מספר טלפון"); return; }
      if (!canBook(phone)) {
        showErr("כבר קיבלנו הזמנה ממספר זה היום. לשינוי צרו קשר ישירות.");
        return;
      }
      clearErr();
      recordBook(phone);
      submitBooking({ name: name, phone: phone });
    });

    function submitBooking(contact) {
      var btn = document.getElementById("bs-submit");
      btn.disabled = true; btn.textContent = "שולח...";

      var parts = state.date.split("-");
      var startD = new Date(+parts[0], +parts[1] - 1, +parts[2], state.timeHour, 0, 0);
      var dateFmt = startD.toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      var addonsSelected = ADDONS.filter(function (a) { return state.addonIds.indexOf(a.id) > -1; });
      var addonLines = addonsSelected.length
        ? addonsSelected.map(function (a) { return "• " + a.name + " — ₪" + a.price; }).join("\n")
        : "ללא תוספות";

      // Show success immediately
      document.getElementById("bs-form-body").style.display = "none";
      document.getElementById("bs-success").style.display = "block";
      if (window.fbq) fbq('track', 'Schedule');

      // EmailJS
      if (window.emailjs) {
        emailjs.send(EJS_SERVICE, EJS_TEMPLATE, {
          customer_name:    contact.name,
          customer_phone:   contact.phone,
          customer_car:     "לא צוין",
          customer_address: "לא צוין",
          booking_date:     dateFmt,
          booking_time:     state.timeName,
          addons:           "חבילה: " + state.pkgName + "\n" + addonLines,
          total_price:      state.pkgPrice
        }).catch(function (err) { console.warn("EmailJS error:", err); });
      }

      // Google Calendar
      fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:    contact.name,
          customerPhone:   contact.phone,
          customerCar:     "לא צוין",
          customerAddress: "לא צוין",
          date:            state.date,
          timeHour:        state.timeHour,
          timeName:        state.timeName,
          addons:          "חבילה: " + state.pkgName + "\n" + addonLines,
          finalPrice:      state.pkgPrice
        })
      }).catch(function (err) { console.warn("Calendar API error:", err); });
    }

    // ── Open / Close ──
    function openSheet(pkgName, pkgPrice, addonIds) {
      state.pkgName = pkgName; state.pkgPrice = pkgPrice; state.addonIds = addonIds || [];
      state.date = ""; state.timeHour = null; state.timeName = "";

      overlay.querySelectorAll(".bs-time-btn").forEach(function (b) { b.classList.remove("bs-sel", "bs-disabled"); });
      if (dateStripEl) dateStripEl.querySelectorAll(".bs-day-card").forEach(function (c) { c.classList.remove("bs-sel"); });

      document.getElementById("bs-name").value = "";
      document.getElementById("bs-phone").value = "";
      clearErr();

      var submitBtn = document.getElementById("bs-submit");
      submitBtn.disabled = false;
      submitBtn.textContent = "הזמן עכשיו · החל מ-₪" + pkgPrice;
      submitBtn.style.display = "";
      document.getElementById("bs-form-body").style.display = "";
      document.getElementById("bs-success").style.display = "none";

      document.getElementById("bs-pkg-name").textContent = pkgName;
      document.getElementById("bs-pkg-price").textContent = "החל מ-₪" + pkgPrice;
      var arrEl = document.getElementById("bs-pkg-arrival");
      if (arrEl) arrEl.style.display = "none";

      overlay.classList.add("bs-open");
      document.body.style.overflow = "hidden";
      if (window.fbq) fbq('track', 'InitiateCheckout');
      fetchAvailability();
    }

    function closeSheet() {
      overlay.classList.remove("bs-open");
      document.body.style.overflow = "";
    }

    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeSheet(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("bs-open")) closeSheet();
    });
    document.getElementById("bs-done").addEventListener("click", closeSheet);

    // Package buttons
    document.querySelectorAll("[data-pkg-ids]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var ids   = el.dataset.pkgIds ? el.dataset.pkgIds.split(",").filter(Boolean) : [];
        var name  = el.dataset.pkgName  || "BMS";
        var price = parseInt(el.dataset.pkgPrice, 10) || 199;
        openSheet(name, price, ids);
      });
    });

    // Generic "Book Now" buttons (hero CTA etc.)
    document.querySelectorAll(".btn-book").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); openSheet("דיטייל", 500, []); });
    });

    _openBookingModal = function () { openSheet("דיטייל", 500, []); };
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
    initBookingSheet();
    applyLang("he");

    // Auto-open booking popup when coming from a Meta ad (?book=1)
    if (new URLSearchParams(window.location.search).get("book") === "1") {
      setTimeout(function () { if (_openBookingModal) _openBookingModal(false, false); }, 600);
    }
  });

  /* ── Initial language: Hebrew ── */
  applyLang("he");
})();
