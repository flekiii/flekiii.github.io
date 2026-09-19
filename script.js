const translations = {
  en: {
    navProjects: "Projects",
    navAbout: "About",
    navSupport: "Support",
    heroEyebrow: "INDEPENDENT DEVELOPER · 15 YEARS OLD",
    heroTitle: "Building my own<br><span>digital world.</span>",
    heroText: "I build software, platforms and tools with a focus on freedom, customization and privacy.",
    heroProjects: "VIEW PROJECTS",
    heroSupport: "❤️ SUPPORT",
    projectsTitle: "Projects",
    statusProgress: "IN PROGRESS",
    statusPlanned: "PLANNED",
    projectJsDesc: "Learning JavaScript and building practical things while improving my programming skills.",
    projectVpnDesc: "A private VPN project focused on secure and flexible network access.",
    projectBrowserDesc: "A privacy-focused browser designed around customization and user control.",
    projectSearchDesc: "An independent search engine for discovering information online.",
    projectEmailDesc: "My own email service for private communication and a personal digital identity.",
    projectCloudDesc: "A private cloud storage platform inspired by the idea of an independent Google Drive alternative.",
    projectMusicDesc: "A music platform inspired by SoundCloud for artists, uploads and discovery.",
    projectGamesDesc: "A dedicated platform for video games, developers and players.",
    projectAsDesc: "My own AI project and one of the core parts of the flekiii ecosystem.",
    projectFlekibardDesc: "My own messenger focused on customization, privacy and freedom.",
    projectTrustDesc: "A future financial platform built around my own TRUST Network.",
    projectNetworkDesc: "A private network designed as part of the wider flekiii ecosystem.",
    projectPcDesc: "My own operating system direction for personal computers.",
    projectRedmiDesc: "A mobile operating system direction for Redmi 12C.",
    projectIphoneDesc: "A mobile operating system direction for iPhone 16.",
    aboutTitle: "About",
    about1: "I'm <strong>flekiii</strong>, a 15-year-old independent developer building my own projects from the ground up.",
    about2: "I'm learning by actually making things: designing interfaces, writing code, solving problems and turning ideas into working software instead of keeping them as concepts.",
    about3: "I'm working toward a much larger ecosystem of software, platforms, services and operating systems.",
    about4: "I like technology that gives people freedom and room to customize things for themselves. My goal is to keep building, keep learning and eventually turn these ideas into real products used by people.",
    supportEyebrow: "KEEP BUILDING",
    supportTitle: "Support my work.",
    supportText: "If you like what I'm building and want to help me keep developing, you can support the projects directly.",
    supportButton: "❤️ SUPPORT FLEKIII",
    supportNote: "Support link opens Monobank Jar.",
    backTop: "Back to top ↑",
    footer: "© flekiii. Built independently."
  },
  uk: {
    navProjects: "Проєкти",
    navAbout: "Про мене",
    navSupport: "Підтримати",
    heroEyebrow: "НЕЗАЛЕЖНИЙ РОЗРОБНИК · 15 РОКІВ",
    heroTitle: "Створюю власний<br><span>цифровий світ.</span>",
    heroText: "Я створюю програми, платформи та інструменти з акцентом на свободу, кастомізацію та приватність.",
    heroProjects: "ПЕРЕГЛЯНУТИ ПРОЄКТИ",
    heroSupport: "❤️ ПІДТРИМАТИ",
    projectsTitle: "Проєкти",
    statusProgress: "В ПРОЦЕСІ",
    statusPlanned: "У ПЛАНАХ",
    projectJsDesc: "Вивчаю JavaScript і паралельно створюю практичні речі, покращуючи свої навички програмування.",
    projectVpnDesc: "Власний VPN-проєкт, орієнтований на безпечний та гнучкий доступ до мережі.",
    projectBrowserDesc: "Приватний браузер з акцентом на кастомізацію та контроль користувача.",
    projectSearchDesc: "Власний пошуковик для пошуку та відкриття інформації в інтернеті.",
    projectEmailDesc: "Власний email-сервіс для приватного спілкування та цифрової ідентичності.",
    projectCloudDesc: "Власне хмарне сховище за ідеєю незалежного аналога Google Drive.",
    projectMusicDesc: "Власна музична платформа на кшталт SoundCloud для артистів, завантажень і відкриття нової музики.",
    projectGamesDesc: "Окрема платформа для відеоігор, розробників та гравців.",
    projectAsDesc: "Мій власний AI та один з основних елементів екосистеми flekiii.",
    projectFlekibardDesc: "Мій власний месенджер з акцентом на кастомізацію, приватність і свободу.",
    projectTrustDesc: "Майбутня фінансова платформа, побудована навколо власної TRUST Network.",
    projectNetworkDesc: "Власна приватна мережа як частина більшої екосистеми flekiii.",
    projectPcDesc: "Власний напрям операційної системи для персональних комп'ютерів.",
    projectRedmiDesc: "Мобільний напрям операційної системи для Redmi 12C.",
    projectIphoneDesc: "Мобільний напрям операційної системи для iPhone 16.",
    aboutTitle: "Про мене",
    about1: "Я <strong>flekiii</strong>, 15-річний незалежний розробник, який створює власні проєкти з нуля.",
    about2: "Я навчаюся через практику: створюю інтерфейси, пишу код, вирішую проблеми та перетворюю ідеї на робочі програми, а не залишаю їх просто концептами.",
    about3: "Я поступово будую велику екосистему власних програм, платформ, сервісів та операційних систем.",
    about4: "Мені подобається технологія, яка дає людям свободу та можливість налаштовувати її під себе. Моя мета — продовжувати створювати, навчатися та з часом перетворювати ці ідеї на реальні продукти.",
    supportEyebrow: "ПРОДОВЖУЮ СТВОРЮВАТИ",
    supportTitle: "Підтримай мою роботу.",
    supportText: "Якщо тобі подобається те, що я створюю, і ти хочеш допомогти мені продовжувати розробку, ти можеш підтримати мої проєкти.",
    supportButton: "❤️ ПІДТРИМАТИ FLEKIII",
    supportNote: "Кнопка відкриває Monobank Jar.",
    backTop: "На початок ↑",
    footer: "© flekiii. Створено незалежно."
  }
};

document.getElementById("year").textContent = new Date().getFullYear();

const cards = document.querySelectorAll(".project-card");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

cards.forEach((card) => {
  card.style.opacity = "0";
  card.style.transform = "translateY(18px)";
  card.style.transition = "opacity 0.6s ease, transform 0.6s ease, border-color 0.25s ease";
  observer.observe(card);
});

const languageSelect = document.getElementById("languageSelect");

function setLanguage(language) {
  const selected = translations[language] ? language : "en";
  document.documentElement.lang = selected;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[selected][key]) {
      element.innerHTML = translations[selected][key];
    }
  });

  languageSelect.value = selected;
  localStorage.setItem("flekiii-language", selected);
}

const savedLanguage = localStorage.getItem("flekiii-language");
setLanguage(savedLanguage || "en");

languageSelect.addEventListener("change", (event) => {
  setLanguage(event.target.value);
});
