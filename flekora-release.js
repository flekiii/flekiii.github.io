// FLEKORA release integration. Written by prepare_website.py after checking the Linux archive.
(() => {
  const release = {"name": "FLEKORA-0.4.2-x86_64.AppImage", "size": 70048248, "sha256": "5f2cdca7671db387749b0e07e1d5d997451c3de8aa9959b24f19008266f35e53", "glibc": "2.43", "available": true};
  const available = release.available !== false;
  const downloadLabels = {en:'DOWNLOAD APPIMAGE',uk:'ЗАВАНТАЖИТИ APPIMAGE',pl:'POBIERZ APPIMAGE',de:'APPIMAGE HERUNTERLADEN',ja:'APPIMAGEをダウンロード',es:'DESCARGAR APPIMAGE',fr:'TÉLÉCHARGER APPIMAGE'};
  const copy = {
    en: {ready:'LINUX ALPHA AVAILABLE', desc:'Offline notes, tasks and a floating timer or stopwatch. Export and import backups without an account.', about:'FLEKORA keeps your notes and tasks on your device. Its rounded mini assistant stays on top, shares tasks with the main window and restores the timer. Five interface languages and four themes are available.', features:['Notes and tasks stored locally in SQLite','Switchable timer or stopwatch with pause, resume and compact view','Backup export/import, five languages and four themes'], road:['Improve the offline experience','Test Linux packages on more distributions','Accounts and sync postponed until servers are available'], downloads:'VIEW DOWNLOADS', install:'Linux x86_64 · AppImage', status:'The 0.4.2 alpha targets BlackArch/Arch with XFCE/X11. Make the AppImage executable and launch it without sudo. Compatibility with other distributions needs testing. Flutter is not required to run it.', checksum:'SHA-256 checksum'},
    uk: {ready:'LINUX-АЛЬФА ДОСТУПНА', desc:'Офлайн-нотатки, завдання й плаваючий таймер або секундомір. Експорт та імпорт копій без акаунта.', about:'FLEKORA зберігає нотатки й завдання на твоєму пристрої. Округлений мініпомічник тримається поверх вікон, використовує спільні завдання й відновлює таймер. Є п’ять мов інтерфейсу та чотири теми.', features:['Локальні нотатки й завдання в SQLite','Вибір таймера або секундоміра, пауза, продовження й компактний вигляд','Експорт/імпорт копій, п’ять мов і чотири теми'], road:['Покращувати офлайн-можливості','Перевіряти Linux-пакети на інших дистрибутивах','Акаунти й синхронізацію відкладено до появи серверів'], downloads:'ПЕРЕГЛЯНУТИ ЗАВАНТАЖЕННЯ', install:'Linux x86_64 · AppImage', status:'Альфа 0.4.2 призначена для BlackArch/Arch із XFCE/X11. Зроби AppImage виконуваним та запусти без sudo. Сумісність з іншими дистрибутивами потребує перевірки. Flutter для запуску не потрібен.', checksum:'Контрольна сума SHA-256'},
    pl: {ready:'ALFA LINUX DOSTĘPNA', desc:'Notatki, zadania i pływający minutnik lub stoper offline. Eksport i import kopii bez konta.', about:'FLEKORA przechowuje notatki i zadania na Twoim urządzeniu. Zaokrąglony miniasystent pozostaje na wierzchu, współdzieli zadania z głównym oknem i przywraca minutnik. Dostępnych jest pięć języków i cztery motywy.', features:['Lokalne notatki i zadania w SQLite','Minutnik lub stoper z pauzą, wznowieniem i widokiem kompaktowym','Eksport/import kopii, pięć języków i cztery motywy'], road:['Rozwój funkcji offline','Testowanie pakietów na innych dystrybucjach Linux','Konta i synchronizacja odłożone do uruchomienia serwerów'], downloads:'ZOBACZ PLIKI', install:'Linux x86_64 · AppImage', status:'Alfa 0.4.2 jest przeznaczona dla BlackArch/Arch z XFCE/X11. Nadaj AppImage uprawnienia do wykonania i uruchom bez sudo. Inne dystrybucje wymagają testów zgodności. Flutter nie jest potrzebny do uruchomienia.', checksum:'Suma kontrolna SHA-256'},
    de: {ready:'LINUX-ALPHA VERFÜGBAR', desc:'Offline-Notizen, Aufgaben und ein schwebender Timer oder eine Stoppuhr. Sicherungen ohne Konto exportieren und importieren.', about:'FLEKORA speichert Notizen und Aufgaben auf deinem Gerät. Der abgerundete Miniassistent bleibt im Vordergrund, teilt Aufgaben mit dem Hauptfenster und stellt den Timer wieder her. Fünf Sprachen und vier Designs sind verfügbar.', features:['Lokale Notizen und Aufgaben in SQLite','Timer oder Stoppuhr mit Pause, Fortsetzung und kompakter Ansicht','Sicherungsexport und -import, fünf Sprachen und vier Designs'], road:['Offline-Funktionen verbessern','Linux-Pakete auf weiteren Distributionen testen','Konten und Synchronisierung bis zur Verfügbarkeit von Servern verschoben'], downloads:'DOWNLOADS ANSEHEN', install:'Linux x86_64 · AppImage', status:'Die Alpha 0.4.2 richtet sich an BlackArch/Arch mit XFCE/X11. Mache die AppImage ausführbar und starte sie ohne sudo. Andere Distributionen erfordern Kompatibilitätstests. Zum Starten ist Flutter nicht erforderlich.', checksum:'SHA-256-Prüfsumme'},
    ja: {ready:'LINUXアルファ版公開中', desc:'オフラインのノート、タスク、フローティングタイマーまたはストップウォッチ。アカウントなしでバックアップを書き出し、読み込めます。', about:'FLEKORAはノートとタスクをデバイスに保存します。角が丸いミニアシスタントは最前面に表示でき、メインウィンドウとタスクを共有し、タイマーを復元します。5言語と4つのテーマに対応しています。', features:['SQLiteに保存するローカルのノートとタスク','タイマーとストップウォッチの切り替え、一時停止・再開・コンパクト表示','バックアップの書き出しと読み込み、5言語、4テーマ'], road:['オフライン機能の改善','他のLinuxディストリビューションでの動作確認','アカウントと同期はサーバーの準備まで延期'], downloads:'ダウンロードを見る', install:'Linux x86_64 · AppImage', status:'アルファ版0.4.2はXFCE/X11を使用するBlackArch/Arch向けです。AppImageに実行権限を付け、sudoなしで起動してください。他のディストリビューションでは互換性の確認が必要です。実行時にFlutterは不要です。', checksum:'SHA-256チェックサム'},
    es: {ready:'ALFA LINUX DISPONIBLE', desc:'Notas, tareas y temporizador o cronómetro flotante sin conexión. Exporta e importa copias sin una cuenta.', about:'FLEKORA guarda notas y tareas en tu dispositivo. El miniasistente redondeado permanece encima, comparte tareas con la ventana principal y restaura el temporizador. Incluye cinco idiomas y cuatro temas.', features:['Notas y tareas locales en SQLite','Temporizador o cronómetro con pausa, reanudación y vista compacta','Exportación e importación de copias, cinco idiomas y cuatro temas'], road:['Mejorar las funciones sin conexión','Probar paquetes en más distribuciones Linux','Cuentas y sincronización aplazadas hasta disponer de servidores'], downloads:'VER DESCARGAS', install:'Linux x86_64 · AppImage', status:'La alfa 0.4.2 está dirigida a BlackArch/Arch con XFCE/X11. Dale permiso de ejecución a la AppImage y ábrela sin sudo. Otras distribuciones requieren pruebas de compatibilidad. No necesitas Flutter para ejecutarla.', checksum:'Suma de comprobación SHA-256'},
    fr: {ready:'ALPHA LINUX DISPONIBLE', desc:'Notes, tâches et minuteur ou chronomètre flottant hors ligne. Exportez et importez des sauvegardes sans compte.', about:'FLEKORA conserve les notes et tâches sur votre appareil. Le miniassistant arrondi reste au premier plan, partage les tâches avec la fenêtre principale et restaure le minuteur. Cinq langues et quatre thèmes sont disponibles.', features:['Notes et tâches locales dans SQLite','Minuteur ou chronomètre avec pause, reprise et vue compacte','Export et import des sauvegardes, cinq langues et quatre thèmes'], road:['Améliorer les fonctions hors ligne','Tester les paquets sur davantage de distributions Linux','Comptes et synchronisation reportés jusqu’à la disponibilité des serveurs'], downloads:'VOIR LES TÉLÉCHARGEMENTS', install:'Linux x86_64 · AppImage', status:'L’alpha 0.4.2 vise BlackArch/Arch avec XFCE/X11. Rendez l’AppImage exécutable et lancez-la sans sudo. Les autres distributions nécessitent des tests de compatibilité. Flutter n’est pas nécessaire pour l’exécution.', checksum:'Somme de contrôle SHA-256'}
  };
  const pending = {
    en:['LINUX ALPHA','The AppImage has been tested locally. The download will appear after upload.'],
    uk:['LINUX-АЛЬФА','AppImage перевірено локально. Завантаження з’явиться після публікації файла.'],
    pl:['ALFA LINUX','AppImage został przetestowany lokalnie. Pobieranie będzie dostępne po przesłaniu pliku.'],
    de:['LINUX-ALPHA','Die AppImage wurde lokal getestet. Der Download erscheint nach dem Hochladen.'],
    ja:['LINUXアルファ版','AppImageはローカルで動作確認済みです。ファイルの公開後にダウンロードできます。'],
    es:['ALFA LINUX','La AppImage se ha probado localmente. La descarga aparecerá después de subir el archivo.'],
    fr:['ALPHA LINUX','L’AppImage a été testée localement. Le téléchargement sera disponible après la mise en ligne du fichier.']
  };
  if(!available)for(const [language,text] of Object.entries(copy))text.ready=pending[language][0];
  const strings = language => copy[language] || copy.en;
  const featureTitles = {en:'What you can do.',uk:'Що вже можна робити.',pl:'Co możesz zrobić.',de:'Was du tun kannst.',ja:'できること。',es:'Lo que puedes hacer.',fr:'Ce que vous pouvez faire.'};
  const bugUrl = 'https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml&title=%5BFLEKORA%5D%20';
  const binaryUrl = `https://flekiii.github.io/downloads/flekora/${release.name}`;
  if (typeof translations !== 'undefined' && typeof projectCatalog !== 'undefined') {
    for (const [language, text] of Object.entries(copy)) {
      Object.assign(translations[language], {projectFlekoraDesc:text.desc, statusFlekoraRelease:text.ready,
        downloadProjectFlekora:text.desc, downloadProjectFlekoraText:text.status});
    }
    projectCatalog.flekora = {icon:'✦', name:'FLEKORA', status:'LINUX ALPHA', page:'https://flekiii.github.io/flekora/', en:copy.en.desc, uk:copy.uk.desc};
    const asset = {id:'flekora-linux-042', name:release.name, size:release.size, browser_download_url:binaryUrl};
    const fallback = {tag_name:'flekora-0.4.2', assets:available?[asset]:[]};
    downloadProjects.flekora = {title:'FLEKORA', subtitleKey:'downloadProjectFlekoraText', tagPrefix:'flekora-', platforms:['linux'], fallbackRelease:fallback, fallbackVersion:'0.4.2', unavailableKey:'downloadsUnavailable', bugUrl};
    const previousLoad = loadDownloadProject;
    loadDownloadProject = async function(projectId) {
      if (projectId !== 'flekora') return previousLoad(projectId);
      downloadReleaseCache.flekora = fallback;
      if (currentDownloadProject === projectId) {
        const status = document.getElementById('downloadStatus');
        const version = document.getElementById('downloadProjectVersion');
        if (version) version.textContent = '0.4.2';
        if (status) status.dataset.state = available?'ready':'unavailable';
        updateDownloadStatus();
      }
    };
    const previousModal = renderModal;
    renderModal = function(projectId) {
      previousModal(projectId);
      if (projectId === 'flekora') {
        const text = strings(document.documentElement.lang);
        projectModalText.textContent = text.desc;
        projectModalStatus.textContent = text.ready;
      }
    };
    setLanguage(document.documentElement.lang);
  }
  if (typeof P !== 'undefined' && typeof PROJECT_PAGE_TEXT !== 'undefined') {
    P.flekora = {icon:'✦', name:'FLEKORA', cat:'DESKTOP', en:copy.en.desc, uk:copy.uk.desc,
      aboutEn:copy.en.about, aboutUk:copy.uk.about, featuresEn:copy.en.features, featuresUk:copy.uk.features,
      roadEn:copy.en.road, roadUk:copy.uk.road};
    for (const [language, text] of Object.entries(copy)) {
      Object.assign(PROJECT_PAGE_TEXT[language], {flekoraReady:text.ready, flekoraBuilds:text.install, flekoraDownloads:text.downloads});
    }
    const previousRender = renderProject;
    renderProject = function(language) {
      previousRender(language);
      if (document.body.dataset.projectId !== 'flekora') return;
      const text = strings(language);
      const write = (selector, value) => {const node=document.querySelector(selector); if(node) node.textContent=value;};
      write('[data-project-content="lead"]',text.desc); write('[data-project-content="about"]',text.about);
      write('[data-project-i18n="featuresTitle"]',featureTitles[language] || featureTitles.en);
      write('.project-status',text.ready); write('[data-project-i18n="statusTitle"]',text.ready);
      write('[data-project-i18n="statusText"]',text.status + (release.glibc ? ' glibc ≥ ' + release.glibc + '.' : ''));
      const spans=document.querySelectorAll('.project-meta-row span');
      [text.ready,'0.4.2','LINUX x86_64',text.install].forEach((value,index)=>{if(spans[index])spans[index].textContent=value;});
      const list=(selector,items)=>{const node=document.querySelector(selector);const tag=selector.includes('roadmap')?'article':'div';if(node)node.innerHTML=items.map((value,index)=>`<${tag}><span>0${index+1}</span><strong>${esc(value)}</strong></${tag}>`).join('');};
      list('[data-project-content="features"]',text.features); list('[data-project-content="roadmap"]',text.road);
      const downloads=document.querySelector('[data-project-i18n="flekoraDownloads"]');
      if(downloads){
        downloads.href=available?binaryUrl:'../#resources';
        if(available){downloads.textContent=downloadLabels[language]||downloadLabels.en;downloads.setAttribute('download',release.name);}
        else downloads.removeAttribute('download');
      }
      const notice=document.getElementById('flekora-publish-note');
      if(notice){notice.hidden=available;notice.textContent=(pending[language]||pending.en)[1];}
      let checksum=document.getElementById('flekora-checksum');
      if(available && !checksum){checksum=document.createElement('a');checksum.id='flekora-checksum';checksum.className='button secondary';document.querySelector('.project-bottom-actions')?.append(checksum);}
      if(checksum){checksum.hidden=!available;checksum.href=binaryUrl+'.sha256';checksum.textContent=text.checksum;}
    };
  }
})();
