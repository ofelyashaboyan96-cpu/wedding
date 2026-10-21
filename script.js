/* =========================================================
   ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ — այստեղ փոխեք անհրաժեշտ արժեքները
   ========================================================= */

// Հարսանիքի ամսաթիվն ու ժամը (+04:00 = Երևանի ժամ)
const WEDDING_DATE = new Date("2026-11-20T14:00:00+04:00");

// Formspree-ի հղումը (օրինակ՝ "https://formspree.io/f/abcdwxyz")
// Քանի դեռ դատարկ է, ձևը աշխատում է "փորձնական" ռեժիմով՝
// ցույց է տալիս շնորհակալությունը, բայց պատասխանը ոչ մի տեղ չի ուղարկվում։
const FORM_ENDPOINT = "";


/* =========================================================
   Անիմացիաներ միացնելու նշան
   ========================================================= */
document.documentElement.classList.add("js");


/* =========================================================
   1. Հետհաշվարկ
   ========================================================= */
(function countdown() {
  const els = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  };
  const label = document.getElementById("countdown-label");
  const box = document.getElementById("countdown");
  if (!els.days) return;

  const pad = (n) => String(n).padStart(2, "0");

  function update() {
    const diff = WEDDING_DATE.getTime() - Date.now();

    if (diff <= 0) {
      label.textContent = "Այսօր մեր հարսանիքն է 🤍";
      box.hidden = true;
      clearInterval(timer);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    els.days.textContent = pad(Math.floor(totalSeconds / 86400));
    els.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    els.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    els.seconds.textContent = pad(totalSeconds % 60);
  }

  const timer = setInterval(update, 1000);
  update();
})();


/* =========================================================
   2. Բաժինների հայտնվելը scroll-ի ժամանակ
   ========================================================= */
(function reveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
})();


/* =========================================================
   3. Բացման էկրան + Երաժշտություն
   Նախ փորձում ենք երաժշտությունը միացնել ավտոմատ։
   Եթե բրաուզերը թույլ չի տալիս (հեռախոսների մեծ մասը),
   երաժշտությունը սկսվում է «Բացել հրավերը» կոճակը սեղմելիս։
   ========================================================= */
(function music() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn");
  const intro = document.getElementById("intro");
  const introBtn = document.getElementById("intro-btn");

  // Բացման էկրանը փակելու ֆունկցիա
  function closeIntro() {
    if (!intro || intro.classList.contains("is-hidden")) return;
    intro.classList.add("is-hidden");
    document.body.classList.remove("intro-open");
  }

  if (intro) {
    document.body.classList.add("intro-open");
  }

  if (!audio || !btn) {
    if (introBtn) introBtn.addEventListener("click", closeIntro);
    return;
  }

  let started = false; // արդյո՞ք երաժշտությունն արդեն սկսվել է կամ հյուրն ինքն է ընտրել

  // «Բացել հրավերը»՝ միացնում է երաժշտությունը և փակում էկրանը
  if (introBtn) {
    introBtn.addEventListener("click", () => {
      started = true;
      audio.play().catch(() => {});
      closeIntro();
    });
  }

  // Փորձ՝ ավտոմատ միացնել (եթե բրաուզերը թույլ տա)
  audio.play()
    .then(() => {
      started = true;
      closeIntro();
    })
    .catch(() => { /* արգելված է, կսպասենք կոճակին */ });

  // Կոճակը ցույց ենք տալիս միայն եթե music.mp3 ֆայլը կա
  const showButton = () => { btn.hidden = false; };
  audio.addEventListener("loadedmetadata", showButton, { once: true });
  if (audio.readyState >= 1) showButton();

  function setState(playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-label", playing ? "Անջատել երաժշտությունը" : "Միացնել երաժշտությունը");
  }
  audio.addEventListener("play", () => setState(true));
  audio.addEventListener("pause", () => setState(false));

  // Կոճակը՝ միացնել / անջատել
  btn.addEventListener("click", () => {
    started = true;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  // Առաջին հպումը էջի ցանկացած մասում միացնում է երաժշտությունը
  function startOnFirstTap(event) {
    if (started || btn.hidden || btn.contains(event.target)) return;
    started = true;
    audio.play().catch(() => { started = false; });
  }
  document.addEventListener("click", startOnFirstTap);
  document.addEventListener("touchend", startOnFirstTap, { passive: true });
})();


/* =========================================================
   4. RSVP ձև
   ========================================================= */
(function rsvp() {
  const form = document.getElementById("rsvp-form");
  if (!form) return;

  const nameInput = document.getElementById("rsvp-name");
  const guestsInput = document.getElementById("rsvp-guests");
  const errorBox = document.getElementById("rsvp-error");
  const submitBtn = document.getElementById("rsvp-submit");
  const successBox = document.getElementById("rsvp-success");

  // Եթե հյուրը չի գալու, հյուրերի քանակը անջատվում է
  form.querySelectorAll('input[name="attending"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const notComing = form.attending.value === "Ոչ";
      guestsInput.disabled = notComing;
      if (notComing) guestsInput.value = "";
    });
  });

  nameInput.addEventListener("input", () => {
    nameInput.classList.remove("is-invalid");
    errorBox.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.textContent = "";

    // Ստուգում՝ անունը պարտադիր է
    if (nameInput.value.trim().length < 2) {
      nameInput.classList.add("is-invalid");
      errorBox.textContent = "Խնդրում ենք լրացնել Ձեր անունը և ազգանունը";
      nameInput.focus();
      return;
    }

    // Փորձնական ռեժիմ (Formspree դեռ միացված չէ)
    if (!FORM_ENDPOINT) {
      console.log("RSVP (փորձնական):", Object.fromEntries(new FormData(form)));
      showSuccess();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Ուղարկվում է…";

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Server error " + response.status);
      showSuccess();
    } catch (err) {
      console.error(err);
      errorBox.textContent = "Ինչ-որ բան սխալ գնաց։ Խնդրում ենք փորձել կրկին։";
      submitBtn.disabled = false;
      submitBtn.textContent = "Ուղարկել";
    }
  });

  function showSuccess() {
    form.hidden = true;
    successBox.hidden = false;
  }
})();
