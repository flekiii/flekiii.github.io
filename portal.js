/* flekiii Downloads gateway: multilingual app shortcuts and community links. */
(function () {
  "use strict";
  const copy = {
    en: {
      nav:"Downloads", kicker:"OFFICIAL DOWNLOADS", title:"Your next tool is one click away.",
      intro:"Choose an app to open its official installation options, or browse the complete catalog.",
      catalog:"Open download center", catalogNote:"Official files · installation guides · removal instructions",
      choose:"Choose files ↗", platform:"Available builds",
      apps:{
        flekora:["FLEKORA","Offline notes, tasks and a floating timer.","LINUX"],
        motion:["MOTION","Live wallpapers for Linux and Android.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","A currency converter for desktop and mobile.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","A full-screen app launcher for XFCE.","LINUX"],
        power:["Fleki Power Menu","Quick power controls for XFCE.","LINUX"]
      },
      community:"Community & feedback", communityText:"Share an idea, report a problem or join the project discussion.",
      bug:"Report a bug", idea:"Suggest a feature", discuss:"Join the discussion", open:"Open ↗"
    },
    uk: {
      nav:"Завантаження", kicker:"ОФІЦІЙНІ ЗАВАНТАЖЕННЯ", title:"Потрібна програма — за один клік.",
      intro:"Обери застосунок, щоб відкрити його офіційні файли й інструкції, або переглянь увесь каталог.",
      catalog:"Відкрити каталог", catalogNote:"Офіційні файли · встановлення · видалення",
      choose:"Обрати файли ↗", platform:"Доступні збірки",
      apps:{
        flekora:["FLEKORA","Офлайн-нотатки, завдання та плаваючий таймер.","LINUX"],
        motion:["MOTION","Живі шпалери для Linux та Android.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","Конвертер валют для комп’ютера й телефона.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","Повноекранний лаунчер програм для XFCE.","LINUX"],
        power:["Fleki Power Menu","Швидке керування живленням у XFCE.","LINUX"]
      },
      community:"Спільнота та відгуки", communityText:"Запропонуй ідею, повідом про помилку або долучайся до обговорення проєктів.",
      bug:"Повідомити про баг", idea:"Запропонувати функцію", discuss:"Долучитися до обговорення", open:"Відкрити ↗"
    },
    pl: {
      nav:"Pobieranie", kicker:"OFICJALNE PLIKI", title:"Twoja następna aplikacja jest o krok stąd.",
      intro:"Wybierz aplikację, aby otworzyć oficjalne pliki instalacyjne, albo przejrzyj cały katalog.",
      catalog:"Otwórz katalog", catalogNote:"Oficjalne pliki · instalacja · instrukcje usuwania",
      choose:"Wybierz pliki ↗", platform:"Dostępne kompilacje",
      apps:{
        flekora:["FLEKORA","Notatki offline, zadania i pływający timer.","LINUX"],
        motion:["MOTION","Animowane tapety dla Linuksa i Androida.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","Konwerter walut na komputer i telefon.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","Pełnoekranowy launcher aplikacji XFCE.","LINUX"],
        power:["Fleki Power Menu","Szybkie sterowanie zasilaniem w XFCE.","LINUX"]
      },
      community:"Społeczność i opinie", communityText:"Podziel się pomysłem, zgłoś problem lub dołącz do rozmowy o projektach.",
      bug:"Zgłoś błąd", idea:"Zaproponuj funkcję", discuss:"Dołącz do dyskusji", open:"Otwórz ↗"
    },
    de: {
      nav:"Downloads", kicker:"OFFIZIELLE DOWNLOADS", title:"Dein nächstes Tool ist nur einen Klick entfernt.",
      intro:"Wähle eine App für die offiziellen Installationsdateien oder öffne den gesamten Katalog.",
      catalog:"Downloadcenter öffnen", catalogNote:"Offizielle Dateien · Installation · Deinstallationshilfe",
      choose:"Dateien auswählen ↗", platform:"Verfügbare Versionen",
      apps:{
        flekora:["FLEKORA","Offline-Notizen, Aufgaben und ein schwebender Timer.","LINUX"],
        motion:["MOTION","Animierte Hintergründe für Linux und Android.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","Währungsrechner für Desktop und Smartphone.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","Vollbild-App-Launcher für XFCE.","LINUX"],
        power:["Fleki Power Menu","Schnelle Energieoptionen für XFCE.","LINUX"]
      },
      community:"Community & Feedback", communityText:"Teile eine Idee, melde ein Problem oder diskutiere die Projekte mit.",
      bug:"Fehler melden", idea:"Funktion vorschlagen", discuss:"Diskussion öffnen", open:"Öffnen ↗"
    },
    es: {
      nav:"Descargas", kicker:"DESCARGAS OFICIALES", title:"Tu próxima herramienta está a un clic.",
      intro:"Elige una aplicación para abrir sus opciones oficiales de instalación o consulta todo el catálogo.",
      catalog:"Abrir catálogo", catalogNote:"Archivos oficiales · instalación · instrucciones para desinstalar",
      choose:"Elegir archivos ↗", platform:"Versiones disponibles",
      apps:{
        flekora:["FLEKORA","Notas sin conexión, tareas y temporizador flotante.","LINUX"],
        motion:["MOTION","Fondos animados para Linux y Android.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","Conversor de divisas para escritorio y móvil.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","Lanzador de aplicaciones a pantalla completa para XFCE.","LINUX"],
        power:["Fleki Power Menu","Controles rápidos de energía para XFCE.","LINUX"]
      },
      community:"Comunidad y comentarios", communityText:"Comparte una idea, informa de un problema o participa en la conversación.",
      bug:"Informar de un error", idea:"Sugerir una función", discuss:"Unirse al debate", open:"Abrir ↗"
    },
    fr: {
      nav:"Téléchargements", kicker:"TÉLÉCHARGEMENTS OFFICIELS", title:"Votre prochain outil est à un clic.",
      intro:"Choisissez une application pour accéder à ses options d’installation officielles ou parcourez le catalogue.",
      catalog:"Ouvrir le catalogue", catalogNote:"Fichiers officiels · installation · instructions de suppression",
      choose:"Choisir les fichiers ↗", platform:"Versions disponibles",
      apps:{
        flekora:["FLEKORA","Notes hors ligne, tâches et minuteur flottant.","LINUX"],
        motion:["MOTION","Fonds d’écran animés pour Linux et Android.","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","Convertisseur de devises pour ordinateur et mobile.","LINUX · ANDROID"],
        orbit:["Fleki Orbit","Lanceur d’applications XFCE en plein écran.","LINUX"],
        power:["Fleki Power Menu","Commandes d’alimentation rapides pour XFCE.","LINUX"]
      },
      community:"Communauté et retours", communityText:"Partagez une idée, signalez un problème ou participez aux discussions.",
      bug:"Signaler un bug", idea:"Proposer une fonction", discuss:"Participer aux discussions", open:"Ouvrir ↗"
    },
    ja: {
      nav:"ダウンロード", kicker:"公式ダウンロード", title:"必要なアプリをワンクリックで。",
      intro:"アプリを選ぶと公式インストール項目を開きます。すべてのカタログも確認できます。",
      catalog:"ダウンロード一覧を開く", catalogNote:"公式ファイル · インストール · 削除方法",
      choose:"ファイルを選ぶ ↗", platform:"利用可能なビルド",
      apps:{
        flekora:["FLEKORA","オフラインのメモ、タスク、フローティングタイマー。","LINUX"],
        motion:["MOTION","LinuxとAndroid向けのライブ壁紙。","LINUX · ANDROID"],
        convert:["FLEKI CONVERT","PCとスマートフォン向けの通貨換算アプリ。","LINUX · ANDROID"],
        orbit:["Fleki Orbit","XFCE向け全画面アプリランチャー。","LINUX"],
        power:["Fleki Power Menu","XFCE向けの電源操作メニュー。","LINUX"]
      },
      community:"コミュニティとフィードバック", communityText:"アイデアを共有し、問題を報告して、プロジェクトの議論に参加できます。",
      bug:"不具合を報告", idea:"機能を提案", discuss:"ディスカッションに参加", open:"開く ↗"
    }
  };
  const hubLabels={"en":["Release Hub","Manage GitHub releases, uploads and updates.","LINUX · PREVIEW","PREPARING","VIEW PREVIEW ↗"],"uk":["Release Hub","Керування GitHub-релізами, файлами та оновленнями.","LINUX · ПРЕВ'Ю","ГОТУЄТЬСЯ","ПЕРЕГЛЯНУТИ ↗"],"pl":["Release Hub","Zarządzanie wydaniami GitHub, plikami i aktualizacjami.","LINUX · PODGLĄD","W PRZYGOTOWANIU","ZOBACZ ↗"],"de":["Release Hub","GitHub-Releases, Dateien und Updates verwalten.","LINUX · VORSCHAU","IN VORBEREITUNG","ANSEHEN ↗"],"es":["Release Hub","Gestiona versiones GitHub, archivos y actualizaciones.","LINUX · VISTA PREVIA","EN PREPARACIÓN","VER ↗"],"fr":["Release Hub","Gérez les versions GitHub, les fichiers et les mises à jour.","LINUX · APERÇU","EN PRÉPARATION","VOIR ↗"],"ja":["Release Hub","GitHubリリース、ファイル、更新を管理します。","LINUX · プレビュー","準備中","詳細を見る ↗"]};
  for(const [lang,row] of Object.entries(hubLabels)){copy[lang].apps.hub=row.slice(0,3);copy[lang].hubPending=row[3];copy[lang].hubAction=row[4];}
  const projects = [
    {id:"flekora",key:"flekora",mark:"F"},
    {id:"motion",key:"motion",mark:"M"},
    {id:"fleki-convert",key:"convert",mark:"C",icon:"./fleki-convert-icon.svg"},
    {id:"release-hub",key:"hub",mark:"RH",icon:"./release-hub-icon.svg"},
    {id:"orbit",key:"orbit",mark:"O"},
    {id:"power",key:"power",mark:"P"}
  ];
  const home = document.getElementById("projects");
  if (!home || document.getElementById("flekiiiPortal")) return;
  const shell = document.createElement("div");
  shell.id = "flekiiiPortal";
  shell.className = "portal-shell";
  shell.innerHTML =
    '<section class="portal-section portal-download-section" id="portal-downloads" aria-labelledby="portal-download-title">' +
      '<div class="portal-download-hero">' +
        '<div class="portal-download-copy"><span class="portal-kicker" data-portal="kicker"></span>' +
          '<h2 id="portal-download-title" data-portal="title"></h2><p data-portal="intro"></p>' +
          '<a class="portal-catalog-button" href="./downloads/"><span data-portal="catalog"></span><b aria-hidden="true">↗</b></a>' +
          '<span class="portal-catalog-note" data-portal="catalogNote"></span></div>' +
        '<div class="portal-download-art" aria-hidden="true"><div class="portal-download-ring portal-ring-one"></div>' +
          '<div class="portal-download-ring portal-ring-two"></div><div class="portal-download-core"><span>flekiii</span><b>DOWNLOADS</b></div>' +
          '<i class="portal-float-tag tag-flekora">FLEKORA</i><i class="portal-float-tag tag-motion">MOTION</i><i class="portal-float-tag tag-release-hub">RELEASE HUB</i></div>' +
      '</div><div class="portal-app-grid" aria-label="Available projects"></div></section>' +
    '<section class="portal-section portal-community-section portal-community-redesign" id="community">' +
      '<div class="portal-community-heading"><div><span class="portal-kicker">FLEKIII COMMUNITY</span>' +
        '<h2 data-portal="community"></h2><p data-portal="communityText"></p></div><span class="portal-community-count" aria-hidden="true">03</span></div>' +
      '<div class="portal-community-grid">' +
        '<a class="portal-card portal-community-card" href="https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml" target="_blank" rel="noopener noreferrer">' +
          '<span class="portal-community-card-top"><span class="portal-community-mark">01</span><span class="portal-community-arrow" aria-hidden="true">↗</span></span>' +
          '<div class="portal-community-card-copy"><h3 data-portal="bug"></h3><p data-portal="bugText"></p></div><span class="portal-link"><span data-portal="open"></span><b aria-hidden="true">↗</b></span></a>' +
        '<a class="portal-card portal-community-card" href="https://github.com/flekiii/flekiii.github.io/issues/new?labels=enhancement" target="_blank" rel="noopener noreferrer">' +
          '<span class="portal-community-card-top"><span class="portal-community-mark">02</span><span class="portal-community-arrow" aria-hidden="true">↗</span></span>' +
          '<div class="portal-community-card-copy"><h3 data-portal="idea"></h3><p data-portal="ideaText"></p></div><span class="portal-link"><span data-portal="open"></span><b aria-hidden="true">↗</b></span></a>' +
        '<a class="portal-card portal-community-card" href="https://github.com/flekiii/flekiii.github.io/discussions" target="_blank" rel="noopener noreferrer">' +
          '<span class="portal-community-card-top"><span class="portal-community-mark">03</span><span class="portal-community-arrow" aria-hidden="true">↗</span></span>' +
          '<div class="portal-community-card-copy"><h3 data-portal="discuss"></h3><p data-portal="discussText"></p></div><span class="portal-link"><span data-portal="open"></span><b aria-hidden="true">↗</b></span></a>' +
      '</div></section>';
  const appGrid = shell.querySelector(".portal-app-grid");
  projects.forEach(function (project) {
    const card = document.createElement("article");
    card.className = "portal-app-card";
    card.dataset.appId=project.id;
    const mark=project.icon?'<span class="portal-app-mark"><img src="'+project.icon+'" width="32" height="32" alt="" loading="lazy"></span>':'<span class="portal-app-mark" aria-hidden="true">'+project.mark+'</span>';
    card.innerHTML =
      mark +
      '<div class="portal-app-info"><small data-app-platform="' + project.key + '"></small><h3 data-app-name="' + project.key + '"></h3><p data-app-description="' + project.key + '"></p></div>' +
      '<a class="portal-app-link" href="./downloads/?app=' + project.id + '"><span data-portal="choose"></span><b aria-hidden="true">↗</b></a>';
    appGrid.appendChild(card);
  });
  home.insertAdjacentElement("afterend", shell);

  const nav = document.getElementById("mainNav");
  if (nav && !nav.querySelector(".nav-downloads")) {
    const link = document.createElement("a");
    link.className = "nav-downloads";
    link.href = "./downloads/";
    link.dataset.portal = "nav";
    nav.appendChild(link);
    link.addEventListener("click", function () {
      document.querySelector(".nav")?.classList.remove("mobile-open");
      document.getElementById("mobileMenuButton")?.setAttribute("aria-expanded", "false");
    });
  }

  const bugText = {
    en:"Open a GitHub issue with steps to reproduce.",
    uk:"Створи GitHub Issue і додай кроки відтворення.",
    pl:"Utwórz zgłoszenie GitHub z krokami odtworzenia.",
    de:"Erstelle ein GitHub-Issue mit Schritten zum Nachstellen.",
    es:"Crea un issue de GitHub con los pasos para reproducirlo.",
    fr:"Créez une issue GitHub avec les étapes de reproduction.",
    ja:"再現手順を添えてGitHub Issueを作成します。"
  };
  const ideaText = {
    en:"Share a useful idea for the next release.",
    uk:"Поділися ідеєю для наступного оновлення.",
    pl:"Podziel się pomysłem na kolejne wydanie.",
    de:"Teile eine Idee für eine kommende Version.",
    es:"Comparte una idea para una próxima versión.",
    fr:"Partagez une idée pour une prochaine version.",
    ja:"次のリリースに向けたアイデアを共有できます。"
  };
  const discussText = {
    en:"Follow updates and talk about the projects.",
    uk:"Стеж за оновленнями та обговорюй проєкти.",
    pl:"Śledź aktualizacje i rozmawiaj o projektach.",
    de:"Verfolge Neuigkeiten und diskutiere die Projekte.",
    es:"Sigue las novedades y conversa sobre los proyectos.",
    fr:"Suivez les nouveautés et échangez autour des projets.",
    ja:"更新情報を確認し、プロジェクトについて話し合えます。"
  };
  function currentLanguage() {
    const lang = document.documentElement.lang || "en";
    return copy[lang] ? lang : "en";
  }
  function translate() {
    const lang = currentLanguage();
    const text = copy[lang];
    shell.querySelectorAll("[data-portal]").forEach(function (node) {
      node.textContent = text[node.dataset.portal] || "";
    });
    const navLink = nav && nav.querySelector(".nav-downloads");
    if (navLink) navLink.textContent = text.nav;
    shell.querySelectorAll("[data-app-name]").forEach(function (node) {
      const app = text.apps[node.dataset.appName];
      node.textContent = app[0];
    });
    shell.querySelectorAll("[data-app-description]").forEach(function (node) {
      const app = text.apps[node.dataset.appDescription];
      node.textContent = app[1];
    });
    shell.querySelectorAll("[data-app-platform]").forEach(function (node) {
      node.textContent = node.dataset.appPlatform==="hub" ? text.hubPending+" · "+text.apps.hub[2] : text.platform+" · "+text.apps[node.dataset.appPlatform][2];
    });
    const hubAction=shell.querySelector('[data-app-id="release-hub"] [data-portal="choose"]');
    if(hubAction)hubAction.textContent=text.hubAction;
    shell.querySelector('[data-portal="bug"]')?.closest(".portal-card")?.querySelector("p").replaceChildren(bugText[lang]);
    shell.querySelector('[data-portal="idea"]')?.closest(".portal-card")?.querySelector("p").replaceChildren(ideaText[lang]);
    shell.querySelector('[data-portal="discuss"]')?.closest(".portal-card")?.querySelector("p").replaceChildren(discussText[lang]);
  }
  const observer = new MutationObserver(function (records) {
    if (records.some(function (record) { return record.attributeName === "lang"; })) translate();
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  document.querySelectorAll(".language-option").forEach(function (button) {
    button.addEventListener("click",function(){queueMicrotask(translate);});
  });
  translate();
})();
