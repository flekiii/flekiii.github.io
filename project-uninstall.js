/* Uninstall guides for released flekiii apps. App data is never deleted automatically. */
(() => {
  "use strict";
  const guides = {
    power: [
      ["appimage", 'rm -i -- "$HOME/Downloads/Fleki-Power-Menu-0.2.0-x86_64.AppImage"'],
      ["python", 'pkill -f "^python3 $HOME/.local/bin/fleki-power-menu.py$" || true\nrm -i -- "$HOME/.local/bin/fleki-power-menu.py"\nrm -i -- "$HOME/.config/autostart/fleki-power-menu.desktop"'],
      ["settings", 'rm -i -- "$HOME/.config/fleki-power-menu/settings.json"']
    ],
    orbit: [
      ["installed", 'pkill -f "^python3 $HOME/.local/bin/fleki-orbit-menu.py$" || true\nrm -i -- "$HOME/.local/bin/fleki-orbit-menu.py"\nfor file in "$HOME/.config/autostart/fleki-orbit-menu.desktop" "$HOME/.config/autostart/fleki-orbit.desktop"; do\n  [ ! -f "$file" ] || rm -i -- "$file"\ndone\nrm -rI -- "$HOME/.local/opt/fleki-orbit"'],
      ["archive", 'rm -i -- "$HOME/Downloads/fleki-orbit-v0.1.0.tar.gz"']
    ],
    motion: [
      ["appimage", 'rm -i -- "$HOME/Downloads/MOTION-0.1.0-beta-linux-x86_64.AppImage"'],
      ["archive", 'rm -i -- "$HOME/Downloads/MOTION-0.1.0-beta-linux-x86_64.tar.gz"'],
      ["extracted", 'find "$HOME/Downloads" -maxdepth 2 -type d -iname "*motion*" -print'],
      ["androidMotion", null]
    ],
    flekora: [
      ["appimage", 'rm -i -- "$HOME/Downloads/FLEKORA-0.4.3-x86_64.AppImage"']
    ],
    "fleki-convert": [
      ["appimage", 'rm -i -- "$HOME/Downloads/fleki_convert-1.0.0+1-linux.AppImage"'],
      ["arch", 'sudo pacman -R fleki-convert'],
      ["deb", "pkg=\"$(dpkg-query -W -f='${binary:Package}\\n' | grep -Ei '^fleki[-_]convert$' | head -n 1)\"\nif [ -n \"$pkg\" ]; then\n  sudo apt remove \"$pkg\"\nelse\n  echo 'FLEKI CONVERT package not found'\nfi"],
      ["rpm", "pkg=\"$(rpm -qa --qf '%{NAME}\\n' | grep -Ei '^fleki[-_]convert$' | head -n 1)\"\nif [ -n \"$pkg\" ]; then\n  sudo dnf remove \"$pkg\"\nelse\n  echo 'FLEKI CONVERT package not found'\nfi"],
      ["androidConvert", null]
    ]
  };
  const keys = ["eyebrow","title","intro","copy","copied","error","pathNotice","privacyNotice","appimage","python","settings","installed","archive","extracted","androidMotion","androidConvert","arch","deb","rpm","orbitWarning","extractedWarning","flekoraWarning","packageWarning"];
  const L = {
    en: ["UNINSTALL","How to remove this app.","Choose the download type you used. Only the named app is affected.","Copy","Copied!","Select and copy","Commands assume the file is in Downloads. Change the path if you moved it.","Your notes, settings and other personal data are not erased automatically.","Linux · AppImage","Older Python version and autostart","Saved color (optional)","Installed Fleki Orbit","Downloaded TAR.GZ archive","Extracted folder (find first)","Android · MOTION","Android · FLEKI CONVERT","Arch / BlackArch package","Debian / Ubuntu package","Fedora / RPM package","Check the contents of the Orbit folder before confirming removal.","This command only finds potential folders. Inspect them and remove only the folder you extracted.","Export your FLEKORA notes before deleting any personal data.","Check the package name from the first command; use the actual name if it differs."],
    uk: ["ВИДАЛЕННЯ","Як видалити програму.","Обери формат, який завантажував. Інші проєкти не зачіпаються.","Копіювати","Скопійовано!","Виділи й скопіюй","Команди розраховані на папку Downloads. Якщо файл переміщено — зміни шлях.","Нотатки, налаштування та інші особисті дані не видаляються автоматично.","Linux · AppImage","Стара Python-версія та автозапуск","Збережений колір (необов’язково)","Встановлений Fleki Orbit","Завантажений архів TAR.GZ","Розпакована папка (спочатку знайти)","Android · MOTION","Android · FLEKI CONVERT","Пакет Arch / BlackArch","Пакет Debian / Ubuntu","Пакет Fedora / RPM","Перевір вміст папки Orbit перед підтвердженням її видалення.","Ця команда лише шукає папки. Перевір результат і видали тільки папку, яку розпаковував.","Експортуй нотатки FLEKORA перед окремим очищенням особистих даних.","Перевір назву пакета, показану першою командою. Якщо інша — використовуй її."],
    pl: ["ODINSTALOWANIE","Jak usunąć aplikację.","Wybierz pobrany format. Pozostałe projekty pozostają bez zmian.","Kopiuj","Skopiowano!","Zaznacz i skopiuj","Polecenia zakładają folder Downloads. Zmień ścieżkę, jeśli przeniesiono plik.","Notatki, ustawienia i inne dane nie są automatycznie usuwane.","Linux · AppImage","Starsza wersja Python i autostart","Zapisany kolor (opcjonalnie)","Zainstalowany Fleki Orbit","Pobrane archiwum TAR.GZ","Rozpakowany folder (najpierw znajdź)","Android · MOTION","Android · FLEKI CONVERT","Pakiet Arch / BlackArch","Pakiet Debian / Ubuntu","Pakiet Fedora / RPM","Sprawdź folder Orbit przed potwierdzeniem usunięcia.","To polecenie tylko wyszukuje foldery. Usuń ręcznie wyłącznie właściwy folder.","Przed usunięciem danych wyeksportuj notatki FLEKORA.","Sprawdź nazwę pakietu i użyj właściwej, jeśli jest inna."],
    de: ["DEINSTALLATION","App entfernen.","Wähle das Downloadformat. Andere Projekte bleiben unberührt.","Kopieren","Kopiert!","Markieren und kopieren","Beispiele verwenden Downloads. Pfad bei Bedarf anpassen.","Notizen, Einstellungen und persönliche Daten werden nicht automatisch gelöscht.","Linux · AppImage","Ältere Python-Version und Autostart","Gespeicherte Farbe (optional)","Installierter Fleki Orbit","Heruntergeladenes TAR.GZ","Entpackter Ordner (erst suchen)","Android · MOTION","Android · FLEKI CONVERT","Arch / BlackArch-Paket","Debian / Ubuntu-Paket","Fedora / RPM-Paket","Prüfe den Orbit-Ordner vor dem Löschen.","Dieser Befehl sucht nur Ordner. Lösche ausschließlich den richtigen Ordner.","Exportiere wichtige FLEKORA-Notizen, bevor du Daten löschst.","Prüfe den Paketnamen und verwende bei Abweichung den tatsächlichen Namen."],
    es: ["DESINSTALAR","Cómo eliminar la aplicación.","Elige el formato descargado. Los demás proyectos no se modifican.","Copiar","¡Copiado!","Selecciona y copia","Los comandos suponen Downloads. Cambia la ruta si moviste el archivo.","Las notas, ajustes y datos personales no se borran automáticamente.","Linux · AppImage","Versión Python anterior e inicio automático","Color guardado (opcional)","Fleki Orbit instalado","Archivo TAR.GZ descargado","Carpeta extraída (buscar primero)","Android · MOTION","Android · FLEKI CONVERT","Paquete Arch / BlackArch","Paquete Debian / Ubuntu","Paquete Fedora / RPM","Revisa la carpeta Orbit antes de confirmar su eliminación.","Este comando solo busca carpetas. Elimina únicamente la carpeta correcta.","Exporta las notas de FLEKORA antes de borrar datos personales.","Verifica el nombre del paquete y utiliza el real si es diferente."],
    fr: ["DÉSINSTALLATION","Supprimer l’application.","Choisis le format téléchargé. Les autres projets ne sont pas touchés.","Copier","Copié !","Sélectionner et copier","Les commandes supposent Downloads. Modifie le chemin si nécessaire.","Les notes, réglages et données personnelles ne sont pas supprimés automatiquement.","Linux · AppImage","Ancienne version Python et démarrage automatique","Couleur enregistrée (facultatif)","Fleki Orbit installé","Archive TAR.GZ téléchargée","Dossier extrait (chercher d’abord)","Android · MOTION","Android · FLEKI CONVERT","Paquet Arch / BlackArch","Paquet Debian / Ubuntu","Paquet Fedora / RPM","Vérifie le dossier Orbit avant de confirmer sa suppression.","Cette commande cherche seulement les dossiers. Supprime uniquement le bon dossier.","Exporte les notes FLEKORA avant d’effacer des données personnelles.","Vérifie le nom du paquet et utilise le nom réel s’il diffère."],
    ja: ["アンインストール","アプリを削除する方法","ダウンロードした形式を選んでください。他のプロジェクトは変更しません。","コピー","コピーしました！","選択してコピー","例ではDownloadsを使用します。移動した場合はパスを変更してください。","ノートや設定、個人データは自動的に削除されません。","Linux · AppImage","以前のPython版と自動起動","保存された色（任意）","インストール済みFleki Orbit","ダウンロードしたTAR.GZ","展開フォルダー（まず検索）","Android · MOTION","Android · FLEKI CONVERT","Arch / BlackArchパッケージ","Debian / Ubuntuパッケージ","Fedora / RPMパッケージ","削除前にOrbitフォルダーの中身を確認してください。","このコマンドは検索のみです。正しいフォルダーだけ削除してください。","個人データの削除前にFLEKORAのノートを保存してください。","パッケージ名を確認し、異なる場合は正しい名前を使ってください。"]
  };
  function t(key) {
    const i = keys.indexOf(key);
    const lang = document.documentElement.lang;
    return (L[lang] || L.en)[i] || L.en[i] || key;
  }
  function make(tag, className, value) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (value !== undefined) e.textContent = value;
    return e;
  }
  function paint(section = document.getElementById("project-uninstall"), id = (section && section.dataset.projectId) || document.body.dataset.projectId) {
    if (!section || !guides[id]) return;
    section.replaceChildren();
    const header = make("header", "project-uninstall-header");
    header.append(make("span", "project-section-label", t("eyebrow")));
    const title = make("h2", "", t("title"));
    title.id = "project-uninstall-title";
    header.append(title, make("p", "project-uninstall-intro", t("intro")));
    section.append(header);
    const grid = make("div", "project-uninstall-grid");
    for (const [type, command] of guides[id]) {
      const os = section.dataset.os;
      const isAndroid = type === "androidMotion" || type === "androidConvert";
      if ((os === "android" && !isAndroid) || (os === "linux" && isAndroid)) continue;
      const item = make("article", "project-uninstall-item");
      item.append(make("h3", "project-uninstall-item-title", t(type)));
      if (command !== null) {
        const block = make("div", "project-uninstall-codebox");
        const pre = make("pre");
        pre.append(make("code", "", command));
        const copy = make("button", "project-uninstall-copy", t("copy"));
        copy.type = "button";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(command);
            copy.textContent = t("copied");
            copy.classList.add("copied");
          } catch (_) {
            copy.textContent = t("error");
          }
        });
        block.append(pre, copy);
        item.append(block);
      } else {
        const name = type === "androidMotion" ? "MOTION" : "FLEKI CONVERT";
        const sentences = {
          en: "On your phone: Settings → Apps → " + name + " → Uninstall.",
          uk: "На телефоні: Налаштування → Програми → " + name + " → Видалити.",
          pl: "Na telefonie: Ustawienia → Aplikacje → " + name + " → Odinstaluj.",
          de: "Auf dem Smartphone: Einstellungen → Apps → " + name + " → Deinstallieren.",
          es: "En el teléfono: Ajustes → Aplicaciones → " + name + " → Desinstalar.",
          fr: "Sur le téléphone : Paramètres → Applications → " + name + " → Désinstaller.",
          ja: "スマートフォン：設定 → アプリ → " + name + " → アンインストール。"
        };
        item.append(make("p", "project-uninstall-android", sentences[document.documentElement.lang] || sentences.en));
      }
      const warningKey = type === "installed" ? "orbitWarning" : type === "extracted" ? "extractedWarning" : id === "flekora" ? "flekoraWarning" : ["deb","rpm"].includes(type) ? "packageWarning" : null;
      if (warningKey) item.append(make("p", "project-uninstall-warning", t(warningKey)));
      grid.append(item);
    }
    section.append(grid, make("p", "project-uninstall-footnote", t("pathNotice")), make("p", "project-uninstall-footnote", t("privacyNotice")));
  }
  // Shared API for the Downloads flow. Project pages keep their own automatic guide.
  window.flekiRenderUninstall = (container, projectId) => {
    if (!container || !guides[projectId]) return false;
    container.dataset.projectId = projectId;
    paint(container, projectId);
    return true;
  };

  function init() {
    if (!guides[document.body.dataset.projectId]) return;
    const actions = document.querySelector(".project-bottom-actions");
    if (!actions) return;
    const section = make("section", "project-roadmap-card project-uninstall-card");
    section.id = "project-uninstall";
    section.setAttribute("aria-labelledby", "project-uninstall-title");
    actions.before(section);
    paint();
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
