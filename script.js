const translations = {
  en: {
    navProjects: "Projects",
    navOverview: "Overview",
    navSupport: "Support",
    navUpdates: "Updates",
    navSocial: "Social",
    nowBuildingEyebrow: "NOW BUILDING",
    nowBuildingActive: "ACTIVE",
    nowBuildingTitle: "Learning JavaScript",
    nowBuildingText: "For the last few days, my main focus has been learning the basics of JavaScript and turning what I learn into real code.",
    nowBuildingProgressLabel: "CURRENT FOCUS",
    nowBuildingProgressValue: "JavaScript fundamentals",
    nowBuildingNextLabel: "NEXT",
    nowBuildingNextTitle: "Node.js + Backend",
    nowBuildingNextText: "After JavaScript, the next step is learning Node.js and the basics of backend development.",
    overviewEyebrow: "DEVELOPER OVERVIEW · FLEKIII",
    overviewTitle: "What is happening <span class=\"accent\">right now.</span>",
    tabProgress: "Project Progress",
    tabAbout: "About",
    heroEyebrow: "INDEPENDENT DEVELOPER · 15 YEARS OLD",
    heroTitle: "Building my own<br><span>digital world.</span>",
    heroText: "I build software, platforms and tools with a focus on freedom, customization and privacy.",
    heroProjects: "VIEW PROJECTS",
    heroSupport: "❤️ SUPPORT",
    projectsTitle: "Projects",
    projectsMeta: "A growing set of services, apps, entertainment and systems.",
    filterLabel: "FILTER",
    filterAll: "ALL",
    filterServices: "SERVICES",
    filterApps: "APPS",
    filterEntertainment: "ENTERTAINMENT",
    filterSystems: "SYSTEMS",
    statusProgress: "IN PROGRESS",
    statusPlanned: "PLANNED",
    viewProject: "VIEW PROJECT",
    modalEyebrow: "PROJECT",
    openProjectPage: "OPEN PROJECT PAGE",
    progressNote: "JavaScript learning is intentionally not included in project progress.",
    ecosystemCore: "independent ecosystem",
    profileEyebrow: "DEVELOPER PROFILE",
    profileRole: "15 years old · Independent Developer",
    about1: "I'm <strong class=\"about-key\">flekiii</strong>, a 15-year-old independent developer who learns through practice by creating <span class=\"about-key\">my own projects</span>.",
    about2: "This site is my <span class=\"about-key\">public space</span> where I document my path: from mastering the basics to building the <span class=\"about-key\">large-scale system</span> I imagine.",
    about3: "I want to give both people and myself <span class=\"about-key\">freedom on the internet</span>, so everyone who wants freedom can have it.",
    about4: "I am doing this not only for freedom and for people. I come from a <span class=\"about-key\">poor family</span>, and I want to bring freedom not only to the internet but also to the life of my family and to my own life. I want to <span class=\"about-key\">reach great heights</span> and understand that I really can create something. I do not have support, and no one believes in me, so I have to prove that I can do this, that I am capable of a lot — so I can be proud of myself and know that I gave people something they enjoy.",
    about5: "Mainly, I am doing all of this for <span class=\"about-key\">money</span> and <span class=\"about-key\">my own freedom</span>.",
    projectVpnDesc: "A private VPN project focused on secure and flexible network access.",
    projectBrowserDesc: "A privacy-focused browser designed around customization and user control.",
    projectSearchDesc: "An independent search engine for discovering information online.",
    projectEmailDesc: "My own email service for private communication and a personal digital identity.",
    projectCloudDesc: "A private cloud storage platform inspired by an independent Google Drive alternative.",
    projectMusicDesc: "A music platform inspired by SoundCloud for artists, uploads and discovery.",
    projectGamesDesc: "A dedicated platform for video games, developers and players.",
    projectAsDesc: "My own AI project and one of the core parts of the flekiii ecosystem.",
    projectFlekibardDesc: "My own messenger focused on customization, privacy and freedom.",
    projectFlassiDesc: "A short-video platform for creating, watching and sharing quick vertical videos.",
    projectTrustDesc: "A future financial platform built around my own TRUST Network.",
    projectNetworkDesc: "A private network designed as part of the wider flekiii ecosystem.",
    projectPcDesc: "My own operating system direction for personal computers.",
    projectRedmiDesc: "A mobile operating system direction for Android.",
    projectIphoneDesc: "A mobile operating system direction for iPhone 11.",
    updatesTitle: "Updates",
    githubTitle: "LATEST ON GITHUB",
    githubLoading: "Loading GitHub activity…",
    githubError: "GitHub activity is temporarily unavailable.",
    githubButton: "VIEW GITHUB",
    changelogTitle: "What changed?",
    changelogText: "A small project journal with updates to the flekiii website and ecosystem.",
    changelogButton: "VIEW CHANGELOG",
    socialTitle: "Social Hub",
    resourcesTitle: "Downloads & Gallery",
    downloadsTitle: "Downloads",
    downloadsText: "Nothing published for download yet. This space will be used for future builds, tools and releases.",
    galleryTitle: "Screens & Gallery",
    galleryText: "Screenshots, interface previews and project visuals will appear here later.",
    emptyBadge: "EMPTY FOR NOW",
    devlogTitle: "Dev Log",
    devlogJsDate: "17–22 SEPTEMBER 2026",
    devlogComplete: "COMPLETED",
    devlogJsTitle: "Learning JavaScript",
    devlogJsText: "I studied JavaScript from September 17 to September 22, focusing on the basics and turning what I learned into real code.",
    devlogProblemsDate: "22 SEPTEMBER 2026 → ?",
    devlogProblemsTitle: "Solving problems",
    devlogProblemsText: "There are many problems in my life right now, so I cannot give as much attention to learning and projects as I would like. For now, I am trying to solve these problems first and move forward step by step.",
    goalsTitle: "Support Goals",
    goalPhoneLabel: "CURRENT PRIORITY",
    goalPhone: "New phone",
    goalPhoneText: "My phone broke and the display barely works. I use it to <span class=\"goal-key\">test mobile versions</span> of code and programs, so I now need to find about <span class=\"goal-key\">≈ 13,000 UAH</span> for a new one. I want to buy an <span class=\"goal-key\">iPhone 11 Pro Max</span> because my current <span class=\"goal-key\">Android phone</span> is too weak and sometimes freezes. With an iPhone I could immediately test <span class=\"goal-key\">iOS versions</span> of programs and code, which will be very useful in the near future. That is why the <span class=\"goal-key\">first money from donations</span> will go toward this.",
    goalServers: "Servers",
    goalServersText: "Build the <span class=\"goal-key\">infrastructure</span> needed to run future <span class=\"goal-key\">services</span>.",
    goalDomain: "Own domain",
    goalDomainText: "Get a <span class=\"goal-key\">dedicated domain</span> for a separate <span class=\"goal-key\">main site</span>.",
    goalNetwork: "TRUST Network certificates",
    goalNetworkText: "Work toward the <span class=\"goal-key\">certificates</span> and infrastructure needed to officially <span class=\"goal-key\">launch my own network</span>.",
    goalComputer: "Better computer",
    goalComputerText: "Upgrade the <span class=\"goal-key\">main development machine</span> for <span class=\"goal-key\">larger builds</span> and future infrastructure.",
    supportEyebrow: "KEEP BUILDING",
    supportTitle: "Support my work.",
    supportText: "If you like what I'm building and want to help me keep developing, you can support the projects directly.",
    supportButton: "SUPPORT FLEKIII",
    supportNote: "Support link opens Monobank Jar.",
    supportExtra: "Every contribution helps me spend more time building.",
    backTop: "Back to top ↑",
    footerText: "Built independently."
  },
  uk: {
    navProjects: "Проєкти",
    navOverview: "Огляд",
    navSupport: "Підтримати",
    navUpdates: "Оновлення",
    navSocial: "Соцмережі",
    nowBuildingEyebrow: "ЗАРАЗ В РОБОТІ",
    nowBuildingActive: "АКТИВНО",
    nowBuildingTitle: "Вивчення JavaScript",
    nowBuildingText: "Останні кілька днів мій головний фокус — вивчення основ JavaScript і перетворення того, що я вивчаю, на реальний код.",
    nowBuildingProgressLabel: "ПОТОЧНИЙ ФОКУС",
    nowBuildingProgressValue: "Основи JavaScript",
    nowBuildingNextLabel: "ДАЛІ",
    nowBuildingNextTitle: "Node.js + Backend",
    nowBuildingNextText: "Після JavaScript наступний етап — Node.js та основи backend-розробки.",
    overviewEyebrow: "ОГЛЯД РОЗРОБКИ · FLEKIII",
    overviewTitle: "Що відбувається <span class=\"accent\">прямо зараз.</span>",
    tabProgress: "Прогрес проєктів",
    tabAbout: "Про мене",
    heroEyebrow: "НЕЗАЛЕЖНИЙ РОЗРОБНИК · 15 РОКІВ",
    heroTitle: "Створюю власний<br><span>цифровий світ.</span>",
    heroText: "Я створюю програми, платформи та інструменти з акцентом на свободу, кастомізацію та приватність.",
    heroProjects: "ПЕРЕГЛЯНУТИ ПРОЄКТИ",
    heroSupport: "❤️ ПІДТРИМАТИ",
    projectsTitle: "Проєкти",
    projectsMeta: "Система сервісів, програм, розваг і власних систем, що постійно розвивається.",
    filterLabel: "ФІЛЬТР",
    filterAll: "УСІ",
    filterServices: "СЕРВІСИ",
    filterApps: "ПРОГРАМИ",
    filterEntertainment: "РОЗВАГИ",
    filterSystems: "СИСТЕМИ",
    statusProgress: "В ПРОЦЕСІ",
    statusPlanned: "У ПЛАНАХ",
    viewProject: "ПЕРЕГЛЯНУТИ",
    modalEyebrow: "ПРОЄКТ",
    openProjectPage: "ВІДКРИТИ СТОРІНКУ ПРОЄКТУ",
    progressNote: "Вивчення JavaScript навмисно не входить у прогрес проєктів.",
    ecosystemCore: "незалежна екосистема",
    profileEyebrow: "ПРОФІЛЬ РОЗРОБНИКА",
    profileRole: "15 років · Незалежний розробник",
    about1: "Я — <strong class=\"about-key\">flekiii</strong>, 15-річний незалежний розробник, який навчається на практиці, створюючи <span class=\"about-key\">власні проєкти</span>.",
    about2: "Цей сайт — мій <span class=\"about-key\">публічний простір</span>, де я документую свій шлях: від опанування основ до створення <span class=\"about-key\">масштабної системи</span>, яку я собі уявляю.",
    about3: "Я хочу дати як людям, так і собі <span class=\"about-key\">свободу в інтернеті</span>, щоб усі, хто хоче свободи, отримали її.",
    about4: "Я роблю це не тільки заради свободи та людей. Я з <span class=\"about-key\">бідної сім'ї</span> й хочу дати свободу не тільки в інтернеті, а й у житті своїй сім'ї та самому собі. Я хочу <span class=\"about-key\">досягнути висот</span> і розуміти, що я справді можу щось зробити. У мене немає підтримки, у мене ніхто не вірить, тому я повинен довести, що я це можу, що я можу багато чого — щоб я пишався собою і розумів, що дав людям те, що їм подобається.",
    about5: "В основному я займаюся цим усім заради <span class=\"about-key\">грошей</span> і <span class=\"about-key\">своєї свободи</span>.",
projectVpnDesc: "Власний VPN-проєкт, орієнтований на безпечний та гнучкий доступ до мережі.",
    projectBrowserDesc: "Приватний браузер з акцентом на кастомізацію та контроль користувача.",
    projectSearchDesc: "Власний пошуковик для пошуку та відкриття інформації в інтернеті.",
    projectEmailDesc: "Власний email-сервіс для приватного спілкування та цифрової ідентичності.",
    projectCloudDesc: "Власне хмарне сховище за ідеєю незалежного аналога Google Drive.",
    projectMusicDesc: "Власна музична платформа на кшталт SoundCloud для артистів, завантажень і відкриття нової музики.",
    projectGamesDesc: "Окрема платформа для відеоігор, розробників та гравців.",
    projectAsDesc: "Мій власний AI та один з основних елементів екосистеми flekiii.",
    projectFlekibardDesc: "Мій власний месенджер з акцентом на кастомізацію, приватність і свободу.",
    projectFlassiDesc: "Власна платформа коротких вертикальних відео для створення, перегляду та поширення контенту.",
    projectTrustDesc: "Майбутня фінансова платформа, побудована навколо власної TRUST Network.",
    projectNetworkDesc: "Власна приватна мережа як частина більшої екосистеми flekiii.",
    projectPcDesc: "Власний напрям операційної системи для персональних комп'ютерів.",
    projectRedmiDesc: "Мобільний напрям операційної системи для Android.",
    projectIphoneDesc: "Мобільний напрям операційної системи для iPhone 11.",
    updatesTitle: "Оновлення",
    githubTitle: "ОСТАННЄ НА GITHUB",
    githubLoading: "Завантаження активності GitHub…",
    githubError: "Активність GitHub тимчасово недоступна.",
    githubButton: "ВІДКРИТИ GITHUB",
    changelogTitle: "Що змінилося?",
    changelogText: "Невеликий журнал змін сайту flekiii та всієї екосистеми.",
    changelogButton: "ВІДКРИТИ CHANGELOG",
    socialTitle: "Social Hub",
    resourcesTitle: "Завантаження та галерея",
    downloadsTitle: "Завантаження",
    downloadsText: "Поки що завантажувати нічого. Тут пізніше будуть майбутні збірки, інструменти та релізи.",
    galleryTitle: "Скріншоти та галерея",
    galleryText: "Тут згодом з'являться скріншоти, прев'ю інтерфейсів та візуали проєктів.",
    emptyBadge: "ПОКИ ПУСТО",
    devlogTitle: "Dev Log",
    devlogJsDate: "17–22 ВЕРЕСНЯ 2026",
    devlogComplete: "ЗАВЕРШЕНО",
    devlogJsTitle: "Вивчення JavaScript",
    devlogJsText: "Я вивчав JavaScript з 17 до 22 вересня, зосередившись на основах і перетворюючи вивчене на реальний код.",
    devlogProblemsDate: "22 ВЕРЕСНЯ 2026 → ?",
    devlogProblemsTitle: "Вирішення проблем",
    devlogProblemsText: "Зараз у моєму житті багато проблем, тому я не можу приділяти навчанню та проєктам стільки уваги, скільки хотів би. Поки що я намагаюся спочатку вирішити ці проблеми й рухатися далі крок за кроком.",
    goalsTitle: "Цілі підтримки",
    goalPhoneLabel: "ПОТОЧНА ЦІЛЬ",
    goalPhone: "Новий телефон",
    goalPhoneText: "У мене розбився телефон, і дисплей ледве працює. Я використовую його, щоб <span class=\"goal-key\">тестувати мобільні версії</span> кодів та програм, тому тепер мені потрібно знайти приблизно <span class=\"goal-key\">≈ 13 000 грн</span> на новий. Я хочу купити <span class=\"goal-key\">iPhone 11 Pro Max</span>, тому що мій <span class=\"goal-key\">Android phone</span> надто слабкий і моментами зависає. З iPhone я зможу одразу перевіряти <span class=\"goal-key\">iOS-версії</span> програм та кодів, а це дуже знадобиться в найближчому майбутньому. Тому <span class=\"goal-key\">перші гроші з донатів</span> підуть саме на це.",
    goalServers: "Сервери",
    goalServersText: "Побудувати <span class=\"goal-key\">інфраструктуру</span>, необхідну для роботи майбутніх <span class=\"goal-key\">сервісів</span>.",
    goalDomain: "Власний домен",
    goalDomainText: "Отримати <span class=\"goal-key\">власний домен</span> для окремого <span class=\"goal-key\">головного сайту</span>.",
    goalNetwork: "Сертифікати TRUST Network",
    goalNetworkText: "Працювати над <span class=\"goal-key\">сертифікатами</span> та інфраструктурою, потрібними для офіційного <span class=\"goal-key\">запуску власної мережі</span>.",
    goalComputer: "Кращий комп'ютер",
    goalComputerText: "Покращити <span class=\"goal-key\">основний комп'ютер для розробки</span> для <span class=\"goal-key\">більших збірок</span> та майбутньої інфраструктури.",
    supportEyebrow: "ПРОДОВЖУЮ СТВОРЮВАТИ",
    supportTitle: "Підтримай мою роботу.",
    supportText: "Якщо тобі подобається те, що я створюю, і ти хочеш допомогти мені продовжувати розробку, ти можеш підтримати мої проєкти.",
    supportButton: "ПІДТРИМАТИ FLEKIII",
    supportNote: "Кнопка відкриває Monobank Jar.",
    supportExtra: "Кожна підтримка допомагає мені витрачати більше часу на розробку.",
    backTop: "На початок ↑",
    footerText: "Створено незалежно."
  }
};

translations.en.mapTitle = "THE FLEKIII ECOSYSTEM";
translations.en.mapSubtitle = "Projects, platforms and infrastructure connected as one direction.";
translations.en.mapCore = "independent ecosystem";
translations.en.mapMessenger = "Messenger";
translations.en.mapAI = "AI";
translations.en.mapVideo = "Video";
translations.en.mapFinance = "Finance";
translations.en.mapServices = "SERVICES";
translations.en.mapOperating = "TRUE OS · ONE FAMILY";
translations.en.mapOperatingSub = "PC + Android + iPhone 11";
translations.uk.mapTitle = "ЕКОСИСТЕМА FLEKIII";
translations.uk.mapSubtitle = "Проєкти, платформи та інфраструктура, об'єднані в один напрям.";
translations.uk.mapCore = "незалежна екосистема";
translations.uk.mapMessenger = "Месенджер";
translations.uk.mapAI = "AI";
translations.uk.mapVideo = "Відео";
translations.uk.mapFinance = "Фінанси";
translations.uk.mapServices = "СЕРВІСИ";
translations.uk.mapOperating = "TRUE OS · ОДНА СІМ'Я";
translations.uk.mapOperatingSub = "PC + Android + iPhone 11";
const projectCatalog = {
  javascript: {
    icon: "📚",
    name: "JavaScript",
    status: "IN PROGRESS",
    en: "I'm currently learning JavaScript and using it to build practical things while improving my programming skills.",
    uk: "Зараз я вивчаю JavaScript і використовую його для створення практичних речей, одночасно покращуючи свої навички програмування."
  },
  vpn: {
    icon: "🔐",
    name: "VPN",
    status: "PLANNED",
    page: "https://flekiii.github.io/vpn/?v=3",
    en: "A private VPN project focused on secure and flexible network access.",
    uk: "Власний VPN-проєкт, орієнтований на безпечний та гнучкий доступ до мережі."
  },
  browser: {
    icon: "🌐",
    name: "Private Browser",
    status: "PLANNED",
    page: "https://flekiii.github.io/browser/?v=3",
    en: "A privacy-focused browser designed around customization and user control.",
    uk: "Приватний браузер, створений навколо кастомізації та контролю користувача."
  },
  search: {
    icon: "🔎",
    name: "Search Engine",
    status: "PLANNED",
    page: "https://flekiii.github.io/search/?v=3",
    en: "An independent search engine for discovering information online.",
    uk: "Власний пошуковик для пошуку та відкриття інформації в інтернеті."
  },
  email: {
    icon: "📧",
    name: "Email Service",
    status: "PLANNED",
    page: "https://flekiii.github.io/email/?v=3",
    en: "My own email service for private communication and a personal digital identity.",
    uk: "Власний email-сервіс для приватного спілкування та цифрової ідентичності."
  },
  cloud: {
    icon: "☁️",
    name: "Cloud Drive",
    status: "PLANNED",
    page: "https://flekiii.github.io/cloud/?v=3",
    en: "A private cloud storage platform inspired by the idea of an independent Google Drive alternative.",
    uk: "Власне хмарне сховище за ідеєю незалежного аналога Google Drive."
  },
  music: {
    icon: "🎵",
    name: "Music Platform",
    status: "PLANNED",
    page: "https://flekiii.github.io/music/?v=3",
    en: "A music platform inspired by SoundCloud for artists, uploads and discovery.",
    uk: "Власна музична платформа на кшталт SoundCloud для артистів, завантажень і відкриття нової музики."
  },
  games: {
    icon: "🎮",
    name: "Game Platform",
    status: "PLANNED",
    page: "https://flekiii.github.io/games/?v=3",
    en: "A dedicated platform for video games, developers and players.",
    uk: "Окрема платформа для відеоігор, розробників та гравців."
  },
  as: {
    icon: "🤖",
    name: "AS",
    status: "PLANNED",
    page: "https://flekiii.github.io/as/?v=3",
    en: "My own AI project and one of the core parts of the flekiii ecosystem.",
    uk: "Мій власний AI та один з основних елементів екосистеми flekiii."
  },
  flekibard: {
    icon: "💬",
    name: "Flekibard",
    status: "PLANNED",
    page: "https://flekiii.github.io/flekibard/?v=3",
    en: "My own messenger focused on customization, privacy and freedom.",
    uk: "Мій власний месенджер з акцентом на кастомізацію, приватність і свободу."
  },
  flassi: {
    icon: "🎬",
    name: "flassi",
    status: "PLANNED",
    page: "https://flekiii.github.io/flassi/?v=3",
    en: "A short-video platform for creating, watching and sharing quick vertical videos.",
    uk: "Власна платформа коротких вертикальних відео для створення, перегляду та поширення контенту."
  },
  trust: {
    icon: "💰",
    name: "TRUSTmoney",
    status: "PLANNED",
    page: "https://flekiii.github.io/trust/?v=3",
    en: "A future financial platform built around my own TRUST Network.",
    uk: "Майбутня фінансова платформа, побудована навколо власної TRUST Network."
  },
  network: {
    icon: "🌐",
    name: "Private Network",
    status: "PLANNED",
    page: "https://flekiii.github.io/network/?v=3",
    en: "A private network designed as part of the wider flekiii ecosystem.",
    uk: "Власна приватна мережа як частина більшої екосистеми flekiii."
  },
  "trueos-pc": {
    icon: "🖥️",
    name: "TRUE OS · PC",
    status: "PLANNED",
    page: "https://flekiii.github.io/true-os/?v=3",
    en: "My own operating system direction for personal computers.",
    uk: "Власний напрям операційної системи для персональних комп'ютерів."
  },
  "trueos-redmi": {
    icon: "📱",
    name: "TRUE OS · Android",
    status: "PLANNED",
    page: "https://flekiii.github.io/true-os/?v=3",
    en: "A mobile operating system direction for Android.",
    uk: "Мобільний напрям операційної системи для Android."
  },
  "trueos-iphone": {
    icon: "🍎",
    name: "TRUE OS · iPhone 11",
    status: "PLANNED",
    page: "https://flekiii.github.io/true-os/?v=3",
    en: "A mobile operating system direction for iPhone 11.",
    uk: "Мобільний напрям операційної системи для iPhone 11."
  }
};

async function loadGithubActivity() {
  const container = document.getElementById("githubActivity");

  if (!container) {
    return;
  }

  try {
    const response = await fetch("https://api.github.com/users/flekiii/repos?sort=updated&direction=desc&per_page=6", {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error("GitHub API error");
    }

    const repositories = (await response.json())
      .filter((repo) => !repo.fork)
      .slice(0, 5);

    if (repositories.length === 0) {
      container.innerHTML = '<div class="github-loading">No public repositories yet.</div>';
      return;
    }

    container.innerHTML = repositories.map((repo) => {
      const description = repo.description
        ? escapeHtml(repo.description)
        : "Independent project repository.";

      const language = repo.language
        ? escapeHtml(repo.language.toUpperCase())
        : "PROJECT";

      return `
        <a class="github-item" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          <span>
            <span class="github-item-name">${escapeHtml(repo.name)}</span>
            <span class="github-item-description">${description}</span>
          </span>
          <span class="github-item-meta">${language}</span>
        </a>
      `;
    }).join("");
  } catch {
    const language = document.documentElement.lang === "uk" ? "uk" : "en";
    const message = translations[language].githubError;
    container.innerHTML = `<div class="github-loading">${message}</div>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const yearElement = document.getElementById("year");
const cards = document.querySelectorAll(".project-card");

const projectFilters = document.querySelectorAll(".project-filter");

function applyProjectFilter(filter) {
  projectFilters.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  cards.forEach((card) => {
    const visible = filter === "all" || card.dataset.category === filter;
    card.classList.toggle("project-card-hidden", !visible);

    if (visible) {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }
  });
}

projectFilters.forEach((button) => {
  button.addEventListener("click", () => {
    applyProjectFilter(button.dataset.filter || "all");
  });
});

const languagePicker = document.getElementById("languagePicker");
const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const currentLanguage = document.getElementById("currentLanguage");
const languageOptions = document.querySelectorAll(".language-option");


const mobileMenuButton = document.getElementById("mobileMenuButton");
const mainNav = document.getElementById("mainNav");
const mainNavLinks = mainNav ? mainNav.querySelectorAll("a") : [];

function closeMobileMenu() {
  document.querySelector(".nav")?.classList.remove("mobile-open");
  if (mobileMenuButton) {
    mobileMenuButton.setAttribute("aria-expanded", "false");
    mobileMenuButton.setAttribute("aria-label", "Open navigation");
  }
}

if (mobileMenuButton && mainNav) {
  mobileMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const nav = document.querySelector(".nav");
    const open = nav.classList.toggle("mobile-open");
    mobileMenuButton.setAttribute("aria-expanded", String(open));
    mobileMenuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });

  mainNavLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("click", (event) => {
    const nav = document.querySelector(".nav");
    if (nav && !nav.contains(event.target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

const overviewTabs = document.querySelectorAll(".overview-tab");
const overviewPanels = document.querySelectorAll(".overview-panel");

if (overviewTabs.length) {
  const activeTab = document.querySelector('.overview-tab.active') || overviewTabs[0];
  const activePanel = document.querySelector('.overview-panel.active') || overviewPanels[0];

  overviewTabs.forEach((tab) => {
    const active = tab === activeTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  overviewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel === activePanel);
  });
}

overviewTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    overviewTabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });

    overviewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === target);
    });
  });
});

const projectModal = document.getElementById("projectModal");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectModalText = document.getElementById("projectModalText");
const projectModalStatus = document.getElementById("projectModalStatus");
const projectModalLink = document.getElementById("projectModalLink");

let currentProjectId = null;

function updateYear() {
  yearElement.textContent = new Date().getFullYear();
}

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

function closeLanguageMenu() {
  languagePicker.classList.remove("open");
  languageButton.setAttribute("aria-expanded", "false");
  languageMenu.setAttribute("aria-hidden", "true");
}

function toggleLanguageMenu() {
  const isOpen = languagePicker.classList.toggle("open");
  languageButton.setAttribute("aria-expanded", String(isOpen));
  languageMenu.setAttribute("aria-hidden", String(!isOpen));
}

function renderModal(projectId) {
  if (!projectId || !projectCatalog[projectId]) {
    return;
  }

  const language = document.documentElement.lang === "uk" ? "uk" : "en";
  const project = projectCatalog[projectId];

  projectModalTitle.textContent = project.icon + " " + project.name;
  projectModalText.textContent = project[language];
  projectModalStatus.textContent = language === "uk"
    ? (project.status === "IN PROGRESS" ? "В ПРОЦЕСІ" : "У ПЛАНАХ")
    : project.status;

  if (project.page) {
    projectModalLink.hidden = false;
    projectModalLink.dataset.page = project.page;
    projectModalLink.onclick = function () {
      window.location.href = project.page;
    };
  } else {
    projectModalLink.hidden = true;
    projectModalLink.dataset.page = "";
    projectModalLink.onclick = null;
  }
}

function openProject(projectId) {
  if (!projectCatalog[projectId]) {
    return;
  }

  currentProjectId = projectId;
  renderModal(projectId);
  projectModal.classList.add("open");
  projectModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeProject() {
  currentProjectId = null;
  projectModal.classList.remove("open");
  projectModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".project-view");

  if (!button) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  openProject(button.dataset.project);
});

document.querySelectorAll("[data-modal-close]").forEach((element) => {
  element.addEventListener("click", closeProject);
});

function setLanguage(language) {
  const selected = translations[language] ? language : "en";

  document.documentElement.lang = selected;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = translations[selected][key];

    if (value !== undefined) {
      element.innerHTML = value;
    }
  });

  currentLanguage.textContent = selected === "uk" ? "UA" : "EN";

  languageOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.language === selected);
  });

  localStorage.setItem("flekiii-language", selected);
  updateYear();

  if (currentProjectId) {
    renderModal(currentProjectId);
  }

  closeLanguageMenu();
}

languageButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLanguageMenu();
});

languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setLanguage(option.dataset.language);
  });
});

document.addEventListener("click", (event) => {
  if (!languagePicker.contains(event.target)) {
    closeLanguageMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLanguageMenu();

    if (projectModal.classList.contains("open")) {
      closeProject();
    }
  }
});

const savedLanguage = localStorage.getItem("flekiii-language");
setLanguage(savedLanguage || "en");
updateYear();
loadGithubActivity();
