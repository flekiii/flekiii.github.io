/* flekiii Downloads v2 — public releases, installation and emergency removal */
(() => {
  "use strict";

  const HOME_REPO = "flekiii/flekiii.github.io";
  const MOTION_REPO = "flekiii/motion";
  const site = "https://flekiii.github.io/";
  const asset = (repository, tag, name, size, os, sha) => ({
    name, size, os, url: "https://github.com/" + repository + "/releases/download/" +
      encodeURIComponent(tag) + "/" + encodeURIComponent(name),
    sha: sha ? ("https://github.com/" + repository + "/releases/download/" +
      encodeURIComponent(tag) + "/" + encodeURIComponent(name + ".sha256")) : ""
  });

  const APPS = [
    {
      id:"flekora", name:"FLEKORA", symbol:"✦", version:"0.4.3 · ALPHA",
      platforms:["linux"], en:"Offline notes, tasks, timer and stopwatch. Save backups locally without an account.",
      uk:"Офлайн-нотатки, завдання, таймер і секундомір. Резервні копії зберігаються локально.",
      needs:"Linux x86_64 · BlackArch/Arch, XFCE/X11 · glibc 2.43 or newer",
      bug:"https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml&title=%5BFLEKORA%5D%20",
      assets:[{
        name:"FLEKORA-0.4.3-x86_64.AppImage",os:"linux",size:70068728,
        url:site+"downloads/flekora/FLEKORA-0.4.3-x86_64.AppImage",
        sha:site+"downloads/flekora/FLEKORA-0.4.3-x86_64.AppImage.sha256"
      }]
    },
    {
      id:"power", name:"Fleki Power Menu", symbol:"⏻", version:"0.2.0 · BETA",
      platforms:["linux"], en:"A smooth top-edge power menu for XFCE, with confirmations and your own colors.",
      uk:"Плавне меню живлення зверху екрана для XFCE з підтвердженнями та вибором кольорів.",
      needs:"Linux x86_64 · XFCE/X11 · host Python 3, GTK3 and PyGObject",
      repo:HOME_REPO,tagPrefix:"fleki-power-",
      bug:"https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml&title=%5BFleki%20Power%20Menu%5D%20",
      assets:[asset(HOME_REPO,"fleki-power-v0.2.0","Fleki-Power-Menu-0.2.0-x86_64.AppImage",952824,"linux",true)]
    },
    {
      id:"orbit", name:"Fleki Orbit", symbol:"◎", version:"0.1.0 · BETA",
      platforms:["linux"], en:"A full-screen app launcher for XFCE with search, backgrounds and themes.",
      uk:"Повноекранне меню запуску програм XFCE із пошуком, фонами й темами.",
      needs:"Linux x86_64 · XFCE/X11 · Python 3, GTK3, PyGObject, Pycairo, xfconf-query, gtk-launch · FFmpeg optional",
      repo:HOME_REPO,tagPrefix:"fleki-orbit-",
      bug:"https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml&title=%5BFleki%20Orbit%5D%20",
      assets:[asset(HOME_REPO,"fleki-orbit-v0.1.0","fleki-orbit-v0.1.0.tar.gz",27539,"linux",true)]
    },
    {
      id:"motion", name:"MOTION", symbol:"◉", version:"LINUX + ANDROID · BETA",
      platforms:["linux","android"],
      en:"Animated video and photo wallpapers, with desktop icons, themes and customization.",
      uk:"Живі відео- та фотошпалери з ярликами, темами та налаштуванням.",
      needs:"Linux x86_64 · XFCE/X11; video wallpaper requires mpv + xwinwrap · Android APK available separately",
      repo:MOTION_REPO,tagPrefix:"v",
      bug:"https://github.com/flekiii/motion/issues/new?template=bug_report.yml&title=%5BMOTION%5D%20",
      assets:[
        asset(MOTION_REPO,"v0.1.0-beta","MOTION-0.1.0-beta-linux-x86_64.AppImage",10148344,"linux",true),
        asset(MOTION_REPO,"v0.1.0-beta","MOTION-0.1.0-beta-linux-x86_64.tar.gz",10089528,"linux",true),
        asset(MOTION_REPO,"android-v0.3.2-beta","MOTION-0.3.2-beta-android-universal.apk",88818618,"android",true)
      ]
    },
    {
      id:"fleki-convert", name:"FLEKI CONVERT", symbol:"↔", version:"1.0.0",
      platforms:["linux","android"], en:"Modern currency converter. Linux packages and an Android APK are available.",
      uk:"Сучасний конвертер валют. Є пакети для Linux та APK для Android.",
      needs:"Linux x86_64 · Arch, Debian, Fedora or AppImage · Android APK",
      repo:HOME_REPO,tagPrefix:"fleki-convert-",
      bug:"https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml&title=%5BFLEKI%20CONVERT%5D%20",
      assets:[
        asset(HOME_REPO,"fleki-convert-v1.0.0","fleki_convert-1.0.0+1-linux.AppImage",10078712,"linux",false),
        asset(HOME_REPO,"fleki-convert-v1.0.0","fleki-convert-1.0.0-1-x86_64.pkg.tar.zst",9975671,"linux",false),
        asset(HOME_REPO,"fleki-convert-v1.0.0","fleki_convert-1.0.0+1-linux.deb",7445212,"linux",false),
        asset(HOME_REPO,"fleki-convert-v1.0.0","fleki_convert-1.0.0+1-linux.rpm",9952168,"linux",false),
        asset(HOME_REPO,"fleki-convert-v1.0.0","fleki-convert-1.0.0-android.apk",48947157,"android",false)
      ]
    }
  ];
  const byId = Object.fromEntries(APPS.map(a=>[a.id,a]));
  const STRINGS = {
    en: {
      navProjects:"PROJECTS",navDownloads:"DOWNLOADS",navSupport:"SUPPORT",
      backHome:"← FLEKIII",catEyebrow:"OFFICIAL RELEASES · FLEKIII",catTitle:"Choose your ",catTitleAccent:"app.",
      catIntro:"All published applications in one place. Pick a project to see real downloads, setup instructions and safe emergency removal.",
      count:"RELEASED APPS",searchLabel:"Search apps",search:"Search released apps…",all:"ALL",linux:"LINUX",android:"ANDROID",ready:"RELEASED",open:"VIEW FILES",none:"No matching released apps.",
      backApps:"← ALL APPS",release:"OFFICIAL RELEASE",test:"TESTED BUILD",platformLabel:"PLATFORM",platformTitle:"Choose operating system",
      filesLabel:"DOWNLOADS",filesTitle:"Official files",filesIntro:"Only published files are shown. Choose a build for its installation instructions.",
      installLabel:"INSTALLATION",installTitle:"How to install",install:"INSTALL GUIDE",download:"DOWNLOAD ↓",sha:"SHA-256 ↗",
      emergencyLabel:"EMERGENCY · UNINSTALL",emergencyTitle:"If you urgently need to remove the app",
      emergency:"If it freezes or starts unexpectedly, close it via System Monitor; if it restarts at login, disable its entry under XFCE Settings → Session and Startup → Application Autostart. Use the commands below only for the affected project. Personal data is not automatically erased.",
      project:"PROJECT PAGE ↗",bug:"REPORT A BUG ↗",footer:"Independent software. Official downloads only.",
      loading:"Checking the latest official release…",fallback:"Showing verified published files.",latest:"Latest release checked.",
      fileMissing:"No published files for this platform.",size:"FILE SIZE",requirements:"SYSTEM REQUIREMENTS",
      copy:"COPY COMMAND",copied:"COPIED!",copyFail:"SELECT THE COMMAND ABOVE",
      installApp:"Make the downloaded AppImage executable, then run it without sudo.",
      installTarOrbit:"Extract the official archive. Locate install.sh inside the extracted directory, enter that directory and run ./install.sh. You may enable startup with ./install.sh --enable-autostart. The archive also includes uninstall.sh.",
      installTarMotion:"Extract the portable bundle and follow the README included with the archive. The launcher location may differ between packages.",
      installPkg:"Install the downloaded package with pacman on Arch / BlackArch. Review the package dependencies before confirming.",
      installDeb:"Install the downloaded DEB on Debian / Ubuntu using apt.",
      installRpm:"Install the downloaded RPM on Fedora with dnf.",
      installApk:"On your Android phone, download the APK and open it with the Files app. Allow installation from this trusted source when prompted, install the app, then turn off that permission again. Never install an APK from a copied third-party link.",
      installGeneric:"Open the downloaded file according to its platform format.",
      appNotePower:"This AppImage does not bundle Python, GTK3 or PyGObject. Install them on the host Linux system first.",
      appNoteFlekora:"FLEKORA 0.4.3 requires glibc 2.43 or newer. Export important notes before removing personal data.",
      appNoteMotion:"Linux video wallpapers require mpv and xwinwrap on XFCE/X11.",
      installTip:"If you saved the file outside Downloads, adjust the file path.",
      check:"Checksum available for this build.",
      filters:"Filter by platform",
      light:"Light",dark:"Dark"
    },
    uk: {
      navProjects:"ПРОЄКТИ",navDownloads:"ЗАВАНТАЖЕННЯ",navSupport:"ПІДТРИМКА",
      backHome:"← FLEKIII",catEyebrow:"ОФІЦІЙНІ РЕЛІЗИ · FLEKIII",catTitle:"Обери свою ",catTitleAccent:"програму.",
      catIntro:"Усі випущені програми в одному місці. Обери проєкт, щоб побачити реальні файли, встановлення та безпечне екстрене видалення.",
      count:"ВИПУЩЕНИХ ПРОГРАМ",searchLabel:"Пошук програм",search:"Пошук випущених програм…",all:"УСІ",linux:"LINUX",android:"ANDROID",ready:"ДОСТУПНО",open:"ВІДКРИТИ ФАЙЛИ",none:"Не знайдено жодної випущеної програми.",
      backApps:"← УСІ ПРОГРАМИ",release:"ОФІЦІЙНИЙ РЕЛІЗ",test:"ПЕРЕВІРЕНА ЗБІРКА",platformLabel:"ПЛАТФОРМА",platformTitle:"Обери операційну систему",
      filesLabel:"ЗАВАНТАЖЕННЯ",filesTitle:"Офіційні файли",filesIntro:"Тут лише опубліковані файли. Для кожного формату доступна інструкція зі встановлення.",
      installLabel:"ВСТАНОВЛЕННЯ",installTitle:"Як встановити",install:"ІНСТРУКЦІЯ",download:"ЗАВАНТАЖИТИ ↓",sha:"SHA-256 ↗",
      emergencyLabel:"ЕКСТРЕНЕ ВИДАЛЕННЯ",emergencyTitle:"Як терміново видалити програму",
      emergency:"Якщо програма зависла або запускається сама, закрий її через Системний монітор. Якщо вона запускається під час входу, вимкни її у XFCE: Налаштування → Сеанси та запуск → Автозапуск програм. Наведені нижче команди стосуються лише цієї програми. Особисті дані автоматично не стираються.",
      project:"СТОРІНКА ПРОЄКТУ ↗",bug:"ПОВІДОМИТИ ПРО БАГ ↗",footer:"Незалежні програми. Тільки офіційні завантаження.",
      loading:"Перевіряємо останні офіційні релізи…",fallback:"Показано перевірені опубліковані файли.",latest:"Останній реліз перевірено.",
      fileMissing:"Для цієї платформи немає опублікованих файлів.",size:"РОЗМІР ФАЙЛУ",requirements:"СИСТЕМНІ ВИМОГИ",
      copy:"КОПІЮВАТИ КОМАНДУ",copied:"СКОПІЙОВАНО!",copyFail:"ВИДІЛИ Й СКОПІЮЙ КОМАНДУ",
      installApp:"Зроби завантажений AppImage виконуваним і запусти без sudo.",
      installTarOrbit:"Розпакуй офіційний архів. Знайди install.sh у розпакованій папці, перейди до нього та виконай ./install.sh. Для автозапуску передбачено ./install.sh --enable-autostart. В архіві також є uninstall.sh.",
      installTarMotion:"Розпакуй портативну збірку та дотримуйся README всередині архіву. Розташування запускного файла залежить від пакета.",
      installPkg:"Встанови завантажений пакет через pacman на Arch / BlackArch. Перевір залежності перед підтвердженням.",
      installDeb:"Встанови завантажений DEB через apt на Debian / Ubuntu.",
      installRpm:"Встанови завантажений RPM через dnf на Fedora.",
      installApk:"На Android завантаж APK, відкрий його через «Файли» та дозволь встановлення з цього джерела, якщо буде запит. Після встановлення вимкни цей дозвіл. Не використовуй APK зі сторонніх копій посилання.",
      installGeneric:"Відкрий завантажений файл відповідно до його формату.",
      appNotePower:"Цей AppImage не містить усередині Python, GTK3 і PyGObject — вони мають бути встановлені в Linux.",
      appNoteFlekora:"FLEKORA 0.4.3 вимагає glibc 2.43 або новішої. Експортуй важливі нотатки перед очищенням даних.",
      appNoteMotion:"Для живих відеошпалер у Linux потрібні mpv та xwinwrap з XFCE/X11.",
      installTip:"Якщо файл збережено не в Downloads — зміни шлях у команді.",
      check:"Для цієї збірки є контрольна сума.",
      filters:"Фільтр платформи",light:"Світла",dark:"Темна"
    },
    pl:{catTitle:"Wybierz ",catTitleAccent:"aplikację.",catIntro:"Wybierz opublikowany projekt, pobierz pliki i sprawdź instrukcje instalacji oraz awaryjnego usuwania.",search:"Szukaj aplikacji…",ready:"DOSTĘPNE",open:"PLIKI",backApps:"← WSZYSTKIE APLIKACJE",installTitle:"Jak zainstalować",emergencyTitle:"Awaryjne odinstalowanie",download:"POBIERZ ↓",copy:"KOPIUJ",copied:"SKOPIOWANO!",filesTitle:"Oficjalne pliki",platformTitle:"Wybierz system",navDownloads:"POBIERANIE"},
    de:{catTitle:"Wähle deine ",catTitleAccent:"App.",catIntro:"Offizielle Versionen an einem Ort. Dateien, Installation und Notfall-Deinstallation.",search:"Apps suchen…",ready:"VERFÜGBAR",open:"DATEIEN",backApps:"← ALLE APPS",installTitle:"Installation",emergencyTitle:"Notfall-Deinstallation",download:"DOWNLOAD ↓",copy:"KOPIEREN",copied:"KOPIERT!",filesTitle:"Offizielle Dateien",platformTitle:"Betriebssystem wählen",navDownloads:"DOWNLOADS"},
    es:{catTitle:"Elige tu ",catTitleAccent:"app.",catIntro:"Versiones oficiales en un solo lugar, con instalación y desinstalación de emergencia.",search:"Buscar aplicaciones…",ready:"DISPONIBLE",open:"ARCHIVOS",backApps:"← TODAS LAS APPS",installTitle:"Cómo instalar",emergencyTitle:"Desinstalación de emergencia",download:"DESCARGAR ↓",copy:"COPIAR",copied:"¡COPIADO!",filesTitle:"Archivos oficiales",platformTitle:"Elige sistema operativo",navDownloads:"DESCARGAS"},
    fr:{catTitle:"Choisis ton ",catTitleAccent:"application.",catIntro:"Toutes les versions officielles au même endroit, avec installation et suppression d’urgence.",search:"Rechercher des applications…",ready:"DISPONIBLE",open:"FICHIERS",backApps:"← TOUTES LES APPS",installTitle:"Comment installer",emergencyTitle:"Désinstallation d’urgence",download:"TÉLÉCHARGER ↓",copy:"COPIER",copied:"COPIÉ !",filesTitle:"Fichiers officiels",platformTitle:"Choisir le système",navDownloads:"TÉLÉCHARGEMENTS"},
    ja:{catTitle:"アプリを",catTitleAccent:"選ぶ。",catIntro:"公開済みアプリの公式ファイル、インストール方法、緊急アンインストールをまとめました。",search:"アプリを検索…",ready:"公開済み",open:"ファイルを見る",backApps:"← アプリ一覧",installTitle:"インストール方法",emergencyTitle:"緊急アンインストール",download:"ダウンロード ↓",copy:"コピー",copied:"コピーしました！",filesTitle:"公式ファイル",platformTitle:"OSを選択",navDownloads:"ダウンロード"}
  };
  let language = "en";
  let filter = "all";
  let current = null;
  let currentOS = "linux";
  let chosenFile = "";
  let releases = Object.create(null);
  let started = new Set();

  const $ = id => document.getElementById(id);
  const t = key => (STRINGS[language] && STRINGS[language][key]) || STRINGS.en[key] || key;
  function el(tag, className, text) {
    const out = document.createElement(tag);
    if (className) out.className = className;
    if (text !== undefined) out.textContent = text;
    return out;
  }
  function stored(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  const themes = [
    ["pink","Rose"],["blue","Ocean"],["purple","Lavender"],["green","Emerald"],["amber","Amber"],
    ["crimson","Crimson"],["ice","Ice"],["sunset","Sunset"],["mint","Mint"],["violet","Violet"],
    ["graphite","Graphite"],["cherry","Cherry"],["solar","Solar"],["teal","Teal"],["mocha","Mocha"]
  ];
  function themeOptions() {
    const select = $("fdTheme");
    for (const [key,label] of themes) {
      const dark = el("option", "", label + " · " + t("dark"));
      dark.value = key;
      const light = el("option", "", label + " · " + t("light"));
      light.value = key + "-light";
      select.append(dark, light);
    }
    const saved = stored("flekiii-theme","green");
    select.value = [...themes.map(x=>x[0]),...themes.map(x=>x[0]+"-light")].includes(saved) ? saved : "green";
    document.documentElement.dataset.theme = select.value;
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    save("flekiii-theme",theme);
  }
  function setLanguage(next) {
    language = STRINGS[next] ? next : "en";
    save("flekiii-language",language);
    document.documentElement.lang = language;
    $("fdLanguage").value = language;
    document.title = "Downloads · flekiii";
    $("fdNavProjects").textContent = t("navProjects");
    $("fdNavDownloads").textContent = t("navDownloads");
    $("fdNavSupport").textContent = t("navSupport");
    $("fdHomeBack").textContent = t("backHome");
    $("fdCatalogEyebrow").textContent = t("catEyebrow");
    const h1 = $("fdCatalogTitle");
    h1.replaceChildren(document.createTextNode(t("catTitle")),el("em","",t("catTitleAccent")));
    $("fdCatalogIntro").textContent = t("catIntro");
    $("fdSearchLabel").textContent = t("searchLabel");
    $("fdSearch").placeholder = t("search");
    $("fdEmpty").textContent = t("none");
    $("fdReleaseCount").textContent = APPS.length + " " + t("count");
    $("fdBackToApps").textContent = t("backApps");
    $("fdReleaseLabel").textContent = t("release");
    $("fdRequirementTag").textContent = t("test");
    $("fdPlatformsLabel").textContent = t("platformLabel");
    $("fdPlatformsTitle").textContent = t("platformTitle");
    $("fdFilesLabel").textContent = t("filesLabel");
    $("fdFilesTitle").textContent = t("filesTitle");
    $("fdFilesIntro").textContent = t("filesIntro");
    $("fdInstallLabel").textContent = t("installLabel");
    $("fdInstallTitle").textContent = t("installTitle");
    $("fdEmergencyLabel").textContent = t("emergencyLabel");
    $("fdEmergencyTitle").textContent = t("emergencyTitle");
    $("fdEmergencyText").textContent = t("emergency");
    $("fdProjectPage").textContent = t("project");
    $("fdReportBug").textContent = t("bug");
    $("fdFooter").textContent = t("footer");
    const labels = {all:t("all"),linux:t("linux"),android:t("android")};
    $("fdFilters").setAttribute("aria-label",t("filters"));
    $("fdFilters").querySelectorAll("[data-filter]").forEach(b=>b.textContent=labels[b.dataset.filter]);
    $("fdTheme").replaceChildren();
    themeOptions();
    render();
  }
  function format(name) {
    const lower = name.toLowerCase();
    if (lower.endsWith(".appimage")) return "AppImage";
    if (lower.endsWith(".pkg.tar.zst")) return "Arch · PKG";
    if (lower.endsWith(".deb")) return "DEB";
    if (lower.endsWith(".rpm")) return "RPM";
    if (lower.endsWith(".apk")) return "Android · APK";
    if (lower.endsWith(".tar.gz")) return "TAR.GZ";
    return "FILE";
  }
  function size(bytes) { return bytes ? (bytes/1048576).toFixed(1) + " MB" : "—"; }
  function iconFor(app, parent) {
    if (app.id==="flekora") {
      const img=el("img");
      img.src="../flekora-icon.svg";
      img.alt="";
      img.loading="lazy";
      parent.append(img);
    } else parent.textContent=app.symbol;
  }
  function allowedFile(app, item) {
    if (!item || !item.name || !item.browser_download_url || !app.repo) return false;
    if (!item.browser_download_url.startsWith("https://github.com/" + app.repo + "/releases/download/")) return false;
    if (/\.sha256$|\.sig$|\.asc$|\.json$/i.test(item.name)) return false;
    return /\.appimage$|\.apk$|\.tar\.gz$|\.pkg\.tar\.zst$|\.deb$|\.rpm$/i.test(item.name);
  }
  function normalizeRelease(app, selected) {
    const list = selected.flatMap(release=>{
      const base = release.assets || [];
      return base.filter(item=>allowedFile(app,item)).map(item=>({
        name:item.name,size:item.size || 0,url:item.browser_download_url,
        os:/\.apk$/i.test(item.name)?"android":"linux",
        sha:base.some(sum=>sum.name===item.name+".sha256") ?
          base.find(sum=>sum.name===item.name+".sha256").browser_download_url : ""
      }));
    });
    const seen=new Set();
    return list.filter(a=>{if(seen.has(a.name))return false;seen.add(a.name);return app.platforms.includes(a.os);});
  }
  async function checkLatest(app) {
    if (!app.repo || started.has(app.id)) return;
    started.add(app.id);
    try {
      const res = await fetch("https://api.github.com/repos/" + app.repo + "/releases?per_page=75",
        {headers:{Accept:"application/vnd.github+json"},cache:"no-store"});
      if (!res.ok) throw Error("github " + res.status);
      const all = await res.json();
      if (!Array.isArray(all)) throw Error("invalid releases");
      const sorted = all.filter(r=>r && !r.draft && typeof r.tag_name === "string")
        .sort((a,b)=>new Date(b.published_at||b.created_at||0)-new Date(a.published_at||a.created_at||0));
      let chosen;
      if (app.id==="motion") {
        const linux=sorted.find(r=>/^v[0-9]/i.test(r.tag_name));
        const android=sorted.find(r=>/^android-v[0-9]/i.test(r.tag_name));
        chosen=[linux,android].filter(Boolean);
      } else chosen=sorted.filter(r=>r.tag_name.startsWith(app.tagPrefix)).slice(0,1);
      const list = normalizeRelease(app, chosen);
      if (list.length) {
        // Preserve the last published fallback if GitHub's latest is missing a platform build.
        for (const fallback of app.assets)
          if (!list.some(item=>item.os===fallback.os)) list.push(fallback);
        releases[app.id] = list;
      }
      if (current===app.id) {
        $("fdReleaseStatus").textContent=t("latest");
        renderFiles();
      }
    } catch (_) {
      if (current===app.id) $("fdReleaseStatus").textContent=t("fallback");
    }
  }
  function visibleAssets(app) { return releases[app.id] || app.assets; }
  function renderCatalog() {
    const cards=$("fdCards");
    cards.replaceChildren();
    const term=$("fdSearch").value.trim().toLocaleLowerCase();
    const found=APPS.filter(a=>{
      return (filter==="all" || a.platforms.includes(filter)) &&
        (a.name.toLocaleLowerCase().includes(term) ||
         a.en.toLocaleLowerCase().includes(term) ||
         a.uk.toLocaleLowerCase().includes(term));
    });
    $("fdEmpty").hidden=found.length>0;
    for (const app of found) {
      const card=el("button","fd-card");
      card.type="button";
      card.dataset.open=app.id;
      card.setAttribute("aria-label",app.name+" · "+t("open"));
      const top=el("div","fd-card-top");
      const icon=el("div","fd-card-icon");iconFor(app,icon);
      top.append(icon,el("span","fd-card-status",t("ready")));
      card.append(top,el("h3","",app.name),el("p","",language==="uk"?app.uk:app.en));
      const foot=el("div","fd-card-foot");
      foot.append(el("span","fd-card-platforms",app.platforms.map(p=>p.toUpperCase()).join(" · ")),el("span","fd-card-arrow","↗"));
      card.append(foot);
      cards.append(card);
    }
  }
  function route(rememberScroll) {
    const query=new URLSearchParams(window.location.search);
    const app=byId[query.get("app")];
    if (!app) {
      current=null;
      $("fdCatalog").hidden=false;
      $("fdDetail").hidden=true;
      $("fdStageCatalog").classList.add("fd-step-active");
      $("fdStageDetail").classList.remove("fd-step-active");
      renderCatalog();
    } else {
      const newApp=current!==app.id;
      current=app.id;
      currentOS=app.platforms.includes(query.get("os"))?query.get("os"):app.platforms[0];
      if(newApp)chosenFile="";
      $("fdCatalog").hidden=true;
      $("fdDetail").hidden=false;
      $("fdStageCatalog").classList.remove("fd-step-active");
      $("fdStageDetail").classList.add("fd-step-active");
      renderDetail();
      checkLatest(app);
    }
    if(!rememberScroll)window.scrollTo({top:0,behavior:"instant"});
  }
  function goto(app,os) {
    const q=new URLSearchParams();
    if(app){q.set("app",app);if(os)q.set("os",os);}
    const next = window.location.pathname + (q.toString() ? "?" + q.toString() : "");
    history.pushState(null,"",next);
    route(false);
  }
  function renderDetail() {
    const app=byId[current];
    if(!app)return;
    $("fdAppIcon").replaceChildren();iconFor(app,$("fdAppIcon"));
    $("fdDetailTitle").textContent=app.name;
    document.title=app.name+" · Downloads · flekiii";
    $("fdDetailDescription").textContent=language==="uk"?app.uk:app.en;
    $("fdVersion").textContent=app.version;
    $("fdPlatforms").textContent=app.platforms.map(x=>x.toUpperCase()).join(" · ");
    $("fdRequirementTag").textContent=t("test");
    $("fdProjectPage").href="../"+(app.id==="fleki-convert"?"fleki-convert":app.id)+"/";
    $("fdReportBug").href=app.bug;
    const tabs=$("fdOsTabs");
    tabs.replaceChildren();
    for(const os of app.platforms) {
      const b=el("button",currentOS===os?"is-active":"",t(os));
      b.type="button";b.dataset.os=os;
      b.setAttribute("aria-pressed",String(currentOS===os));
      tabs.append(b);
    }
    $("fdReleaseStatus").textContent=app.repo?(releases[app.id]?t("latest"):t("loading")):t("fallback");
    renderFiles();
    if (typeof window.flekiRenderUninstall === "function")
      window.flekiRenderUninstall($("fdSharedUninstall"),app.id);
  }
  function renderFiles() {
    const app=byId[current];
    if(!app)return;
    const files=visibleAssets(app).filter(file=>file.os===currentOS);
    if(!files.some(f=>f.name===chosenFile))chosenFile=files[0]?.name || "";
    const container=$("fdFiles");
    container.replaceChildren();
    if(!files.length)container.append(el("p","fd-empty",t("fileMissing")));
    for(const file of files){
      const item=el("article","fd-file"+(chosenFile===file.name?" is-selected":""));
      const data=el("div","fd-file-data");
      data.append(el("span","fd-file-type",format(file.name)),el("strong","fd-file-name",file.name),el("p","fd-file-size",size(file.size)));
      if(file.sha && /^https:\/\//.test(file.sha)) {
        const hash=el("a","fd-sha",t("sha"));
        hash.href=file.sha;hash.target="_blank";hash.rel="noopener noreferrer";
        data.append(hash);
      }
      const actions=el("div","fd-file-actions");
      const install=el("button","fd-action",t("install"));
      install.type="button";install.dataset.install=file.name;
      const download=el("a","fd-action fd-action-primary",t("download"));
      download.href=file.url;download.target="_blank";download.rel="noopener noreferrer";
      actions.append(install,download);
      item.append(data,actions);
      container.append(item);
    }
    renderInstallation();
  }
  const quote = value => "'" + String(value).split("'").join("'\"'\"'") + "'";
  function installation(app,file) {
    const name=quote(file.name);
    const path='"$HOME/Downloads/"' + name;
    const suffix=file.name.toLowerCase();
    if(suffix.endsWith(".appimage")) {
      return {kind:"installApp",code:"cd \"$HOME/Downloads\"\nchmod +x -- "+name+"\n./"+name};
    }
    if(suffix.endsWith(".pkg.tar.zst"))return {kind:"installPkg",code:"sudo pacman -U -- "+path};
    if(suffix.endsWith(".deb"))return {kind:"installDeb",code:"sudo apt install "+path};
    if(suffix.endsWith(".rpm"))return {kind:"installRpm",code:"sudo dnf install "+path};
    if(suffix.endsWith(".apk"))return {kind:"installApk",code:""};
    if(suffix.endsWith(".tar.gz") && app.id==="orbit") {
      const out='"$HOME/Downloads/fleki-orbit-v0.1.0"';
      return {kind:"installTarOrbit",code:"mkdir -p "+out+"\ntar -xzf "+path+" -C "+out+
        "\nfind "+out+" -maxdepth 5 -type f -name install.sh -print"};
    }
    if(suffix.endsWith(".tar.gz")) {
      const out='"$HOME/Apps/MOTION"';
      return {kind:"installTarMotion",code:"mkdir -p "+out+"\ntar -xzf "+path+" -C "+out+
        "\nfind "+out+" -maxdepth 4 -type f \\( -iname 'README*' -o -perm -u+x \\) -print"};
    }
    return {kind:"installGeneric",code:""};
  }
  function copyButton(code) {
    const copy=el("button","fd-action",t("copy"));
    copy.type="button";
    copy.addEventListener("click",async()=>{
      try {
        await navigator.clipboard.writeText(code);
        copy.textContent=t("copied");
      } catch (_) {copy.textContent=t("copyFail");}
    });
    return copy;
  }
  function renderInstallation() {
    const app=byId[current];
    if(!app)return;
    const file=visibleAssets(app).find(f=>f.name===chosenFile && f.os===currentOS);
    const wrap=$("fdInstallContent");
    wrap.replaceChildren();
    if(!file){wrap.append(el("p","fd-install-note",t("fileMissing")));return;}
    const details=installation(app,file);
    wrap.append(el("div","fd-install-filename",format(file.name)+" · "+file.name),
      el("p","fd-install-note",t(details.kind)));
    if(details.code){
      const codebox=el("div","fd-code");
      const pre=el("pre");
      pre.append(el("code","",details.code));
      codebox.append(pre,copyButton(details.code));
      wrap.append(codebox,el("p","fd-install-note",t("installTip")));
    }
    const extras=[el("p","fd-install-note",t("requirements")+": "+app.needs)];
    if(app.id==="power" && currentOS==="linux")extras.push(el("p","fd-install-note",t("appNotePower")));
    if(app.id==="motion" && currentOS==="linux")extras.push(el("p","fd-install-note",t("appNoteMotion")));
    if(app.id==="flekora")extras.push(el("p","fd-install-note",t("appNoteFlekora")));
    wrap.append(...extras);
  }
  function render() {
    renderCatalog();
    if(current)renderDetail();
  }
  function init() {
    themeOptions();
    const savedLanguage=stored("flekiii-language","en");
    $("fdLanguage").addEventListener("change",e=>setLanguage(e.target.value));
    $("fdTheme").addEventListener("change",e=>setTheme(e.target.value));
    $("fdSearch").addEventListener("input",renderCatalog);
    $("fdFilters").addEventListener("click",e=>{
      const button=e.target.closest("[data-filter]");
      if(!button)return;
      filter=button.dataset.filter;
      $("fdFilters").querySelectorAll("[data-filter]").forEach(b=>{
        const active=b===button;
        b.classList.toggle("is-active",active);
        b.setAttribute("aria-pressed",String(active));
      });
      renderCatalog();
    });
    document.addEventListener("click",e=>{
      const card=e.target.closest("[data-open]");
      if(card && byId[card.dataset.open]){goto(card.dataset.open);return;}
      if(e.target.closest("#fdBackToApps")){goto(null);return;}
      const os=e.target.closest("[data-os]");
      if(os && current && byId[current].platforms.includes(os.dataset.os)) {
        goto(current,os.dataset.os);
        return;
      }
      const install=e.target.closest("[data-install]");
      if(install && current){
        chosenFile=install.dataset.install;
        renderFiles();
        $("fdInstallation").scrollIntoView({behavior:"smooth",block:"start"});
      }
    });
    window.addEventListener("popstate",()=>route(true));
    setLanguage(savedLanguage);
    route(true);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
