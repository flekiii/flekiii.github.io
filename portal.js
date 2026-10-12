/* flekiii Portal: static GitHub Pages-compatible sections, seven complete locales, inherited color palettes. */
(function () {
  "use strict";
  const order = [
    "nav","hubK","hubT","hubL","tabMap","tabStatus","tabSecure","tabHelp","tabCommunity",
    "mapT","mapL","mapHint","mapOpen","live","dev","preview","beta",
    "nx","nv","nt","nf","nm","nfl",
    "statusT","statusL","statusSite","statusXoni","statusSiteNote","statusXoniNote","statusCheck","checking","online","unknown","unavailable","checked",
    "secureT","secureL","localT","localB","xoniT","xoniB","limitsT","limitsB","secureNote",
    "helpT","helpL","search","noResults","faq1q","faq1a","faq2q","faq2a","faq3q","faq3a","faq4q","faq4a","helpDownload",
    "comT","comL","bugT","bugB","ideaT","ideaB","discT","discB","comOpen","comNote"
  ];
  const dictionary = {
    en: [
      "Explore","ECOSYSTEM HUB","Everything connects.","Explore projects, check service availability, learn about privacy and find support in one place.",
      "Ecosystem","System status","Security","Help center","Community",
      "Connected projects","Select a project to see its role in the ecosystem.","Choose a node to explore its purpose.","Explore project ↗",
      "Available","In development","Early concept","Beta / alpha",
      "Private messages for XONI users and future shared sign-in.","Gaming launcher, library and game distribution.","An independent desktop operating system.","A customizable private messenger.","Live video wallpapers for Linux and Android.","Offline notes, tasks and a focus timer.",
      "Service diagnostics","On-demand browser checks, not guaranteed continuous monitoring.","This website","XONI Mail","Checks a resource on the current site.","Cross-origin checks may be blocked by the browser; an unknown result does not mean an outage.",
      "Check again","Checking…","Reachable","Unknown","Could not verify","Last check:",
      "Privacy & security","Clear information about what exists today and what is still planned.",
      "Site preferences","This site saves your selected theme and language in browser local storage. It does not require an account to browse.",
      "XONI Mail accounts","XONI Mail is designed to avoid mandatory real names and phone numbers. Protect your recovery phrase; messages currently stay within XONI Mail.",
      "Security limitations","A project being privacy-focused does not prove end-to-end encryption, completed audits or zero logs. Check each release and its documentation before trusting sensitive data.",
      "Never share recovery phrases, tokens or passwords in a public bug report.",
      "Help center","Quick answers and download instructions.","Search help articles…","No matching help articles.",
      "Where can I download apps?","Use the Downloads catalog to select a released app and platform. Read the installation and removal instructions on its download page.",
      "How do I install an Android APK?","Download an official APK, verify its source, then allow installation from that source when Android prompts. Disable this permission again afterward.",
      "Can I recover a XONI Mail account?","Keep the private recovery phrase/key you receive. Recovery options depend on the currently deployed service; losing the phrase may make recovery impossible.",
      "How do I switch languages or themes?","Use the selectors in the website header. Your choice is saved in this browser.",
      "Open downloads ↗",
      "Community & feedback","Help shape the projects, propose improvements and report bugs.",
      "Report a bug","Open a GitHub issue with steps to reproduce. GitHub sign-in and repository permissions may be required.",
      "Suggest a feature","Share ideas through GitHub issues when submissions are enabled.",
      "Join the discussion","Visit the GitHub community area. Discussions require that the repository feature is enabled.",
      "Open ↗","Never post private information or security vulnerabilities publicly. GitHub features may require sign-in or enablement."
    ],
    uk: [
      "Огляд","ЦЕНТР ЕКОСИСТЕМИ","Усе пов’язано.","Досліджуй проєкти, перевіряй доступність сервісів, дізнавайся про приватність і знаходь допомогу в одному місці.",
      "Екосистема","Статус сервісів","Безпека","Довідка","Спільнота",
      "Пов’язані проєкти","Обери проєкт, щоб дізнатися про його роль в екосистемі.","Натисни на вузол, щоб побачити його призначення.","Переглянути проєкт ↗",
      "Доступний","У розробці","Рання концепція","Бета / альфа",
      "Приватні повідомлення між користувачами XONI й майбутній спільний вхід.","Ігровий лаунчер, бібліотека та поширення ігор.","Незалежна настільна операційна система.","Приватний месенджер із персоналізацією.","Живі відеошпалери для Linux та Android.","Офлайн-нотатки, задачі й таймер концентрації.",
      "Діагностика сервісів","Перевірки з браузера на запит, а не безперервний моніторинг.","Цей сайт","XONI Mail","Перевіряє ресурс поточного сайту.","Браузер може блокувати перевірки інших доменів; невідомий статус не означає збій.",
      "Перевірити знову","Перевіряємо…","Доступний","Невідомо","Не вдалося перевірити","Остання перевірка:",
      "Приватність і безпека","Чесно про те, що вже працює, а що лише заплановано.",
      "Налаштування сайту","Сайт зберігає вибрані тему та мову в локальному сховищі браузера. Для перегляду реєстрація не потрібна.",
      "Акаунти XONI Mail","XONI Mail задуманий без обов’язкових справжнього імені й телефона. Бережи фразу відновлення; зараз повідомлення залишаються всередині XONI Mail.",
      "Обмеження безпеки","Орієнтація на приватність не доводить наявність наскрізного шифрування, завершених аудитів чи відсутності логів. Перевіряй документацію кожного релізу.",
      "Ніколи не публікуй фрази відновлення, токени чи паролі в баг-репортах.",
      "Центр допомоги","Швидкі відповіді та інструкції із завантаження.","Пошук у довідці…","Нічого не знайдено.",
      "Де завантажувати програми?","Відкрий каталог завантажень, обери випущену програму й платформу. Прочитай інструкцію зі встановлення та видалення.",
      "Як встановити APK на Android?","Завантаж офіційний APK, перевір джерело та дозволь встановлення з нього, коли Android попросить. Після цього вимкни дозвіл.",
      "Чи можна відновити XONI Mail?","Зберігай приватну фразу або ключ відновлення. Можливості залежать від поточної версії сервісу; без фрази відновлення може бути неможливим.",
      "Як змінити мову або тему?","Скористайся перемикачами вгорі сайту. Вибір зберігається в цьому браузері.",
      "Відкрити завантаження ↗",
      "Спільнота та відгуки","Допомагай розвивати проєкти, пропонуй функції й повідомляй про помилки.",
      "Повідомити про баг","Створи GitHub Issue з кроками відтворення. Можуть знадобитися вхід у GitHub і дозвіл репозиторію.",
      "Запропонувати функцію","Поділися ідеєю через GitHub Issues, якщо надсилання ввімкнено.",
      "Приєднатися до обговорень","Перейди до GitHub-спільноти. Обговорення працюватимуть, якщо функцію ввімкнено.",
      "Відкрити ↗","Не публікуй приватні дані чи вразливості у відкритому доступі. Для GitHub може знадобитися вхід або ввімкнення функцій."
    ],
    pl: [
      "Odkrywaj","CENTRUM EKOSYSTEMU","Wszystko jest połączone.","Poznaj projekty, sprawdź dostępność usług, informacje o prywatności i pomoc w jednym miejscu.",
      "Ekosystem","Status usług","Bezpieczeństwo","Pomoc","Społeczność",
      "Połączone projekty","Wybierz projekt, aby poznać jego rolę w ekosystemie.","Kliknij węzeł, aby poznać jego funkcję.","Zobacz projekt ↗",
      "Dostępny","W rozwoju","Wczesny pomysł","Beta / alfa",
      "Prywatne wiadomości dla użytkowników XONI i przyszłe wspólne logowanie.","Launcher gier, biblioteka i dystrybucja gier.","Niezależny system operacyjny dla komputerów.","Prywatny komunikator z personalizacją.","Animowane tapety wideo dla Linuksa i Androida.","Notatki offline, zadania i minutnik skupienia.",
      "Diagnostyka usług","Sprawdzenie z przeglądarki na żądanie, nie ciągły monitoring.","Ta strona","XONI Mail","Sprawdza zasób bieżącej strony.","Przeglądarka może blokować sprawdzanie innych domen; nieznany status nie oznacza awarii.",
      "Sprawdź ponownie","Sprawdzanie…","Dostępny","Nieznany","Nie udało się sprawdzić","Ostatnie sprawdzenie:",
      "Prywatność i bezpieczeństwo","Jasno wyjaśniamy, co już działa, a co dopiero planujemy.",
      "Preferencje strony","Strona zapisuje język i motyw w lokalnej pamięci przeglądarki. Do przeglądania nie trzeba konta.",
      "Konta XONI Mail","XONI Mail ma nie wymagać prawdziwego imienia ani numeru telefonu. Chroń frazę odzyskiwania; wiadomości działają obecnie wewnątrz XONI.",
      "Ograniczenia bezpieczeństwa","Nacisk na prywatność nie dowodzi szyfrowania end-to-end, audytów ani braku logów. Sprawdź dokumentację wydania przed użyciem wrażliwych danych.",
      "Nie udostępniaj publicznie fraz odzyskiwania, tokenów ani haseł.",
      "Centrum pomocy","Szybkie odpowiedzi i instrukcje pobierania.","Szukaj w pomocy…","Brak wyników.",
      "Skąd pobrać aplikacje?","Otwórz katalog pobierania, wybierz wydaną aplikację i platformę. Przeczytaj instrukcje instalacji i odinstalowania.",
      "Jak zainstalować APK na Androidzie?","Pobierz oficjalny APK, zweryfikuj źródło i pozwól na instalację, gdy Android zapyta. Następnie wyłącz to uprawnienie.",
      "Czy można odzyskać konto XONI Mail?","Zachowaj prywatną frazę lub klucz odzyskiwania. Opcje zależą od aktualnej wersji; bez frazy odzyskanie konta może być niemożliwe.",
      "Jak zmienić język lub motyw?","Użyj przełączników w nagłówku strony. Wybór jest zapisywany w tej przeglądarce.",
      "Otwórz pobieranie ↗",
      "Społeczność i opinie","Pomóż rozwijać projekty, proponuj funkcje i zgłaszaj błędy.",
      "Zgłoś błąd","Utwórz zgłoszenie GitHub z krokami odtworzenia. Może być wymagane logowanie i uprawnienia.",
      "Zaproponuj funkcję","Podziel się pomysłem przez GitHub Issues, jeśli zgłoszenia są włączone.",
      "Dołącz do rozmowy","Odwiedź społeczność GitHub. Dyskusje wymagają włączenia tej funkcji.",
      "Otwórz ↗","Nie publikuj danych prywatnych ani luk bezpieczeństwa. GitHub może wymagać zalogowania lub aktywacji funkcji."
    ],
    de: [
      "Entdecken","ÖKOSYSTEM-HUB","Alles hängt zusammen.","Entdecke Projekte, prüfe die Erreichbarkeit der Dienste und finde Datenschutzinfos und Hilfe an einem Ort.",
      "Ökosystem","Systemstatus","Sicherheit","Hilfe","Community",
      "Verbundene Projekte","Wähle ein Projekt, um seine Rolle im Ökosystem zu sehen.","Wähle einen Knoten, um mehr zu erfahren.","Projekt ansehen ↗",
      "Verfügbar","In Entwicklung","Frühes Konzept","Beta / Alpha",
      "Private Nachrichten für XONI-Nutzer und künftig gemeinsame Anmeldung.","Spiele-Launcher, Bibliothek und Spielevertrieb.","Ein unabhängiges Desktop-Betriebssystem.","Privater Messenger mit Anpassungsmöglichkeiten.","Live-Videohintergründe für Linux und Android.","Offline-Notizen, Aufgaben und Fokus-Timer.",
      "Dienstdiagnose","Browserprüfungen auf Anfrage, keine kontinuierliche Überwachung.","Diese Website","XONI Mail","Prüft eine Ressource auf dieser Website.","Browser können Anfragen an andere Domains blockieren; unbekannt bedeutet nicht ausgefallen.",
      "Erneut prüfen","Wird geprüft…","Erreichbar","Unbekannt","Nicht überprüfbar","Letzte Prüfung:",
      "Datenschutz & Sicherheit","Was heute funktioniert und was erst geplant ist.",
      "Website-Einstellungen","Die Website speichert Sprache und Design im lokalen Browserspeicher. Zum Ansehen ist kein Konto nötig.",
      "XONI-Mail-Konten","XONI Mail soll keine echten Namen oder Telefonnummern verlangen. Bewahre den Wiederherstellungsschlüssel auf; Nachrichten bleiben derzeit im XONI-System.",
      "Sicherheitsgrenzen","Datenschutz als Ziel beweist weder Ende-zu-Ende-Verschlüsselung noch Audits oder Logfreiheit. Prüfe die Dokumentation jeder Version.",
      "Veröffentliche nie Wiederherstellungsphrasen, Tokens oder Passwörter in Fehlermeldungen.",
      "Hilfecenter","Schnelle Antworten und Download-Anleitungen.","Hilfe durchsuchen…","Keine passenden Einträge.",
      "Wo kann ich Apps herunterladen?","Öffne Downloads, wähle eine veröffentlichte App und Plattform. Lies die Installations- und Entfernungsanleitung.",
      "Wie installiere ich eine Android-APK?","Lade die offizielle APK herunter, prüfe die Quelle und erlaube die Installation, wenn Android fragt. Entziehe die Berechtigung danach wieder.",
      "Kann ich ein XONI-Mail-Konto wiederherstellen?","Bewahre die private Wiederherstellungsphrase bzw. den Schlüssel auf. Möglichkeiten hängen von der installierten Version ab; ohne Phrase kann es unmöglich sein.",
      "Wie ändere ich Sprache oder Design?","Nutze die Auswahl im Seitenkopf. Die Einstellungen werden in diesem Browser gespeichert.",
      "Downloads öffnen ↗",
      "Community & Feedback","Gestalte Projekte mit, schlage Funktionen vor und melde Fehler.",
      "Fehler melden","Erstelle ein GitHub-Issue mit Schritten zum Nachstellen. Anmeldung und Berechtigungen können nötig sein.",
      "Funktion vorschlagen","Teile Ideen über GitHub Issues, sofern Einsendungen aktiviert sind.",
      "Mitdiskutieren","Besuche die GitHub-Community. Discussions muss im Repository aktiviert sein.",
      "Öffnen ↗","Veröffentliche keine privaten Daten oder Sicherheitslücken. GitHub erfordert eventuell Login oder aktivierte Funktionen."
    ],
    es: [
      "Explorar","CENTRO DEL ECOSISTEMA","Todo está conectado.","Explora proyectos, consulta la disponibilidad de los servicios y encuentra información de privacidad y ayuda.",
      "Ecosistema","Estado del sistema","Seguridad","Ayuda","Comunidad",
      "Proyectos conectados","Elige un proyecto para conocer su función en el ecosistema.","Selecciona un nodo para conocer su propósito.","Ver proyecto ↗",
      "Disponible","En desarrollo","Concepto inicial","Beta / alfa",
      "Mensajes privados para usuarios de XONI e inicio de sesión compartido futuro.","Lanzador, biblioteca y distribución de videojuegos.","Un sistema operativo de escritorio independiente.","Mensajería privada personalizable.","Fondos de pantalla de vídeo para Linux y Android.","Notas sin conexión, tareas y temporizador de enfoque.",
      "Diagnóstico de servicios","Comprobaciones bajo demanda desde el navegador, no supervisión continua.","Este sitio web","XONI Mail","Comprueba un recurso del sitio actual.","El navegador puede bloquear comprobaciones entre dominios; desconocido no significa caída.",
      "Comprobar de nuevo","Comprobando…","Accesible","Desconocido","No se pudo verificar","Última comprobación:",
      "Privacidad y seguridad","Información clara sobre lo que ya existe y lo que está previsto.",
      "Preferencias del sitio","Este sitio guarda el tema y el idioma en el almacenamiento local del navegador. No necesitas cuenta para navegar.",
      "Cuentas de XONI Mail","XONI Mail está pensado para no exigir nombre real ni teléfono. Protege la frase de recuperación; los mensajes siguen dentro de XONI Mail.",
      "Limitaciones de seguridad","Priorizar la privacidad no demuestra cifrado de extremo a extremo, auditorías ni ausencia de registros. Consulta la documentación antes de usar datos sensibles.",
      "No publiques frases de recuperación, tokens ni contraseñas en informes públicos.",
      "Centro de ayuda","Respuestas rápidas e instrucciones de descarga.","Buscar en la ayuda…","No hay resultados.",
      "¿Dónde descargo aplicaciones?","Abre Descargas, elige una aplicación publicada y una plataforma. Lee las instrucciones de instalación y eliminación.",
      "¿Cómo instalo un APK en Android?","Descarga el APK oficial, verifica su origen y permite la instalación cuando Android lo solicite. Desactiva luego ese permiso.",
      "¿Puedo recuperar una cuenta de XONI Mail?","Conserva tu frase o clave privada de recuperación. Las opciones dependen de la versión publicada; sin la frase, recuperarla puede ser imposible.",
      "¿Cómo cambio el idioma o el tema?","Usa los selectores de la cabecera. La elección queda guardada en este navegador.",
      "Abrir descargas ↗",
      "Comunidad y comentarios","Ayuda a mejorar los proyectos, sugiere funciones e informa de errores.",
      "Informar de un error","Crea un issue de GitHub con los pasos para reproducirlo. Puede requerir iniciar sesión y permisos.",
      "Sugerir una función","Comparte ideas mediante GitHub Issues si los envíos están habilitados.",
      "Participar en debates","Visita la comunidad de GitHub. Discussions debe estar habilitado en el repositorio.",
      "Abrir ↗","No publiques datos privados ni vulnerabilidades. GitHub puede requerir inicio de sesión o activación de funciones."
    ],
    fr: [
      "Explorer","CENTRE DE L’ÉCOSYSTÈME","Tout est connecté.","Explorez les projets, vérifiez la disponibilité des services et trouvez des informations sur la confidentialité et de l’aide.",
      "Écosystème","État des services","Sécurité","Aide","Communauté",
      "Projets connectés","Choisissez un projet pour découvrir son rôle dans l’écosystème.","Sélectionnez un nœud pour découvrir son objectif.","Voir le projet ↗",
      "Disponible","En développement","Concept initial","Bêta / alpha",
      "Messages privés entre utilisateurs XONI et future connexion unifiée.","Lanceur, bibliothèque et distribution de jeux.","Un système d’exploitation de bureau indépendant.","Messagerie privée personnalisable.","Fonds d’écran vidéo animés pour Linux et Android.","Notes hors ligne, tâches et minuteur de concentration.",
      "Diagnostic des services","Vérifications sur demande depuis le navigateur, pas une surveillance continue.","Ce site","XONI Mail","Vérifie une ressource de ce site.","Le navigateur peut bloquer les contrôles entre domaines ; inconnu ne signifie pas en panne.",
      "Vérifier à nouveau","Vérification…","Accessible","Inconnu","Vérification impossible","Dernière vérification :",
      "Confidentialité et sécurité","Ce qui existe aujourd’hui et ce qui reste à développer.",
      "Préférences du site","Ce site stocke la langue et le thème dans le stockage local du navigateur. Aucun compte n’est nécessaire pour le consulter.",
      "Comptes XONI Mail","XONI Mail vise à éviter l’obligation de fournir un vrai nom ou un numéro de téléphone. Gardez votre phrase de récupération ; les messages restent internes à XONI Mail.",
      "Limites de sécurité","Un projet axé sur la vie privée ne garantit ni chiffrement de bout en bout, ni audits, ni absence de journaux. Consultez la documentation avant d’y confier des données sensibles.",
      "Ne publiez jamais vos phrases de récupération, jetons ou mots de passe dans un signalement public.",
      "Centre d’aide","Réponses rapides et instructions de téléchargement.","Rechercher dans l’aide…","Aucun résultat.",
      "Où télécharger les applications ?","Ouvrez Téléchargements, choisissez une application publiée et une plateforme. Lisez les instructions d’installation et de suppression.",
      "Comment installer un APK sur Android ?","Téléchargez l’APK officiel, vérifiez la source et autorisez l’installation lorsque Android le demande. Retirez ensuite cette autorisation.",
      "Puis-je récupérer un compte XONI Mail ?","Conservez votre phrase ou clé de récupération privée. Les possibilités dépendent de la version déployée ; sans la phrase, la récupération peut être impossible.",
      "Comment changer de langue ou de thème ?","Utilisez les sélecteurs de l’en-tête. Votre choix est mémorisé dans ce navigateur.",
      "Ouvrir les téléchargements ↗",
      "Communauté et retours","Participez à l’évolution des projets, proposez des fonctions et signalez les bugs.",
      "Signaler un bug","Créez une issue GitHub avec les étapes de reproduction. Une connexion et des autorisations peuvent être nécessaires.",
      "Proposer une fonction","Partagez vos idées via GitHub Issues si les soumissions sont activées.",
      "Participer aux discussions","Consultez l’espace GitHub. Discussions doit être activé dans le dépôt.",
      "Ouvrir ↗","Ne publiez pas de données privées ou de vulnérabilités. GitHub peut nécessiter une connexion ou l’activation de fonctionnalités."
    ],
    ja: [
      "詳しく見る","エコシステム ハブ","すべてがつながる。","プロジェクト、サービスの稼働確認、プライバシー情報、ヘルプを一か所で確認できます。",
      "エコシステム","サービス状況","セキュリティ","ヘルプ","コミュニティ",
      "つながるプロジェクト","プロジェクトを選ぶと、エコシステムでの役割がわかります。","ノードを選んで詳細を確認してください。","プロジェクトを見る ↗",
      "公開中","開発中","初期構想","ベータ / アルファ",
      "XONIユーザー間の非公開メッセージと将来の共通ログイン。","ゲームランチャー、ライブラリ、ゲーム配信。","独立したデスクトップOS。","カスタマイズできるプライベートメッセンジャー。","LinuxとAndroid向けの動画壁紙。","オフラインのメモ、タスク、集中タイマー。",
      "サービス診断","ブラウザーでの手動確認です。常時監視ではありません。","このウェブサイト","XONI Mail","このサイト内のリソースを確認します。","別ドメインへの確認はブラウザーによって制限されます。「不明」は障害を意味しません。",
      "再確認","確認中…","アクセス可能","不明","確認できません","最終確認:",
      "プライバシーと安全性","現在利用できる機能と、今後の計画を明確に説明します。",
      "サイトの設定","言語とテーマの設定はブラウザーのローカルストレージに保存されます。閲覧にアカウントは不要です。",
      "XONI Mailのアカウント","XONI Mailは実名や電話番号を必須にしない設計です。復旧フレーズを大切に保管してください。現在はXONI内でのみメッセージを送れます。",
      "セキュリティ上の制約","プライバシー重視でも、エンドツーエンド暗号化、監査済み、ログなしを保証するものではありません。重要な情報を預ける前に各リリースの説明をご確認ください。",
      "復旧フレーズ、トークン、パスワードを公開の不具合報告に書かないでください。",
      "ヘルプセンター","よくある質問とダウンロード案内。","ヘルプを検索…","該当する記事がありません。",
      "アプリはどこでダウンロードできますか？","ダウンロード一覧で公開済みのアプリとOSを選び、インストールと削除の説明を読んでください。",
      "AndroidにAPKをインストールするには？","公式APKをダウンロードして配布元を確認し、Androidの案内に従ってインストールを許可します。完了後は許可を戻してください。",
      "XONI Mailのアカウントを復旧できますか？","秘密の復旧フレーズやキーを保管してください。復旧方法は現在のバージョンによって異なり、フレーズがないと復旧できない場合があります。",
      "言語やテーマを変更するには？","ページ上部のメニューから変更できます。このブラウザーに設定が保存されます。",
      "ダウンロードを開く ↗",
      "コミュニティとフィードバック","改善案を提案し、不具合を報告してプロジェクトに参加しましょう。",
      "不具合を報告","再現手順を添えてGitHub Issueを作成します。ログインや権限が必要な場合があります。",
      "機能を提案","投稿が有効な場合、GitHub Issuesからアイデアを送れます。",
      "ディスカッション","GitHubのコミュニティページへ。リポジトリ側でDiscussionsを有効にする必要があります。",
      "開く ↗","個人情報や脆弱性を公開しないでください。GitHubへのログインや機能の有効化が必要な場合があります。"
    ]
  };
  const L = {};
  Object.keys(dictionary).forEach(function (lang) {
    if (dictionary[lang].length !== order.length) throw new Error("Portal translation count mismatch: " + lang + " " + dictionary[lang].length + " vs " + order.length);
    L[lang] = Object.fromEntries(order.map(function(k, i) { return [k, dictionary[lang][i]]; }));
  });
  const tp = function (key) { return '<span data-portal="' + key + '"></span>'; };
  const links = [
    ["ecosystem","tabMap"], ["system-status","tabStatus"], ["security","tabSecure"],
    ["help-center","tabHelp"], ["community","tabCommunity"]
  ];
  const nodes = [
    {id:"xoni",name:"XONI Mail",description:"nx",state:"live",href:"https://xoni-mail.pages.dev/",x:"20%",y:"22%"},
    {id:"veltrix",name:"VELTRIX",description:"nv",state:"dev",href:"#projects",projectId:"games",x:"50%",y:"9%"},
    {id:"true",name:"TRUE OS",description:"nt",state:"preview",href:"#projects",projectId:"trueos-pc",x:"80%",y:"22%"},
    {id:"flekibard",name:"Flekibard",description:"nf",state:"dev",href:"#projects",projectId:"flekibard",x:"20%",y:"78%"},
    {id:"motion",name:"MOTION",description:"nm",state:"beta",href:"#projects",projectId:"motion",x:"50%",y:"91%"},
    {id:"flekora",name:"FLEKORA",description:"nfl",state:"beta",href:"#projects",projectId:"flekora",x:"80%",y:"78%"}
  ];
  const anchor = document.getElementById("projects");
  if (!anchor || document.getElementById("flekiiiPortal")) return;
  const container = document.createElement("div");
  container.id = "flekiiiPortal";
  container.className = "portal-shell";
  container.innerHTML =
    '<section class="portal-section" id="portal" aria-labelledby="portal-heading"><div class="portal-intro">' +
      '<span class="portal-kicker">' + tp("hubK") + '</span><h2 id="portal-heading">' + tp("hubT") + '</h2><p>' + tp("hubL") + '</p>' +
      '<div class="portal-tabs" aria-label="Portal sections">' + links.map(function(x){return '<a href="#'+x[0]+'">'+tp(x[1])+'</a>';}).join("") + '</div></div></section>' +
    '<section class="portal-section" id="ecosystem"><div class="portal-heading"><div><h2>'+tp("mapT")+'</h2><p>'+tp("mapL")+'</p></div></div>' +
      '<div class="portal-network" role="group" aria-label="Interactive ecosystem project map"><svg class="portal-wires" aria-hidden="true" viewBox="0 0 1000 440" preserveAspectRatio="none"><path d="M500 220 L200 97 M500 220 L500 40 M500 220 L800 97 M500 220 L200 343 M500 220 L500 400 M500 220 L800 343" /></svg><div class="portal-orbit-core"><strong>flekiii<span style="color:var(--pink)">.</span></strong><small id="portalCoreLabel"></small></div>' +
      nodes.map(function(n){return '<button type="button" class="portal-node" data-node="'+n.id+'" style="--x:'+n.x+';--y:'+n.y+'"><strong>'+n.name+'</strong><small>'+tp(n.state)+'</small></button>';}).join("") +
      '</div><div class="portal-selection" aria-live="polite"><div><small id="portalSelectedState"></small><h3 id="portalSelectedName"></h3><p id="portalSelectedDescription"></p></div><a class="portal-link" id="portalSelectedLink" href="#projects">'+tp("mapOpen")+'</a></div>' +
      '<p class="portal-muted">'+tp("mapHint")+'</p></section>' +
    '<section class="portal-section" id="system-status"><div class="portal-heading"><div><h2>'+tp("statusT")+'</h2><p>'+tp("statusL")+'</p></div></div>' +
      '<div class="portal-status-grid"><article class="portal-card"><div class="portal-status-name"><h3>'+tp("statusSite")+'</h3><span class="portal-status-label" id="portalSiteState" data-state="unknown">'+tp("unknown")+'</span></div><p>'+tp("statusSiteNote")+'</p></article>' +
      '<article class="portal-card"><div class="portal-status-name"><h3>'+tp("statusXoni")+'</h3><span class="portal-status-label" id="portalXoniState" data-state="unknown">'+tp("unknown")+'</span></div><p>'+tp("statusXoniNote")+'</p></article></div>' +
      '<div class="portal-status-bottom"><button class="portal-action" id="portalRefresh" type="button">'+tp("statusCheck")+'</button><span class="portal-muted" id="portalLastCheck"></span></div></section>' +
    '<section class="portal-section" id="security"><div class="portal-heading"><div><h2>'+tp("secureT")+'</h2><p>'+tp("secureL")+'</p></div></div><div class="portal-security-grid">' +
      [["localT","localB"],["xoniT","xoniB"],["limitsT","limitsB"]].map(function(pair){return '<article class="portal-card"><h3>'+tp(pair[0])+'</h3><p>'+tp(pair[1])+'</p></article>';}).join("") +
      '</div><p class="portal-muted">'+tp("secureNote")+'</p></section>' +
    '<section class="portal-section" id="help-center"><div class="portal-heading"><div><h2>'+tp("helpT")+'</h2><p>'+tp("helpL")+'</p></div></div><input class="portal-search" type="search" id="portalSearch" aria-label="Search help" autocomplete="off">' +
      '<div class="portal-faq" id="portalFaq">' +
      [["faq1q","faq1a"],["faq2q","faq2a"],["faq3q","faq3a"],["faq4q","faq4a"]].map(function(pair){return '<details><summary>'+tp(pair[0])+'</summary><p>'+tp(pair[1])+'</p></details>';}).join("") +
      '</div><p class="portal-muted" id="portalNoResults" hidden>'+tp("noResults")+'</p><a class="portal-link" href="./downloads/">'+tp("helpDownload")+'</a></section>' +
    '<section class="portal-section" id="community"><div class="portal-heading"><div><h2>'+tp("comT")+'</h2><p>'+tp("comL")+'</p></div></div><div class="portal-community-grid">' +
      [["bugT","bugB","https://github.com/flekiii/flekiii.github.io/issues/new?template=bug_report.yml"],["ideaT","ideaB","https://github.com/flekiii/flekiii.github.io/issues/new?labels=enhancement"],["discT","discB","https://github.com/flekiii/flekiii.github.io/discussions"]].map(function(c){return '<article class="portal-card"><h3>'+tp(c[0])+'</h3><p>'+tp(c[1])+'</p><a class="portal-link" href="'+c[2]+'" target="_blank" rel="noopener noreferrer">'+tp("comOpen")+'</a></article>';}).join("") +
      '</div><p class="portal-muted">'+tp("comNote")+'</p></section>';
  anchor.insertAdjacentElement("afterend", container);
  const nav = document.querySelector("#mainNav");
  if (nav && !nav.querySelector('a[href="#portal"]')) {
    const a = document.createElement("a");
    a.href = "#portal";
    a.dataset.portal = "nav";
    nav.appendChild(a);
    a.addEventListener("click", function () {
      const top = document.getElementById("mobileMenuButton");
      document.querySelector(".nav")?.classList.remove("mobile-open");
      if (top) top.setAttribute("aria-expanded","false");
    });
  }
  function currentLang() {
    const l = document.documentElement.lang || "en";
    return L[l] ? l : "en";
  }
  function translatePortal() {
    const dict = L[currentLang()];
    container.querySelectorAll("[data-portal]").forEach(function(el) { el.textContent = dict[el.dataset.portal] || ""; });
    const navigation = nav && nav.querySelector('a[href="#portal"]');
    if (navigation) navigation.textContent = dict.nav;
    document.getElementById("portalSearch").placeholder = dict.search;
    document.getElementById("portalSearch").setAttribute("aria-label", dict.search);
    container.querySelector(".portal-tabs").setAttribute("aria-label", dict.hubK);
    container.querySelector(".portal-network").setAttribute("aria-label", dict.mapT);
    document.getElementById("portalCoreLabel").textContent = dict.tabMap;
    updateNodeSelection();
    updateStatusText();
    filterFaq();
  }
  let selectedNode = nodes[0];
  function updateNodeSelection() {
    const dict = L[currentLang()];
    document.getElementById("portalSelectedState").textContent = dict[selectedNode.state];
    document.getElementById("portalSelectedName").textContent = selectedNode.name;
    document.getElementById("portalSelectedDescription").textContent = dict[selectedNode.description];
    const link = document.getElementById("portalSelectedLink");
    link.href = selectedNode.href;
    if (selectedNode.href.startsWith("https:")) {link.target = "_blank";link.rel = "noopener noreferrer";}
    else {link.removeAttribute("target");link.removeAttribute("rel");}
    container.querySelectorAll(".portal-node").forEach(function(el){
      const isSelected = el.dataset.node === selectedNode.id;
      el.classList.toggle("is-selected", isSelected);
      el.setAttribute("aria-pressed", String(isSelected));
    });
  }
  document.getElementById("portalSelectedLink").addEventListener("click", function(event){
    if (!selectedNode.projectId) return;
    const target = document.querySelector(".project-view[data-project=\"" + selectedNode.projectId + "\"]");
    if (target) {event.preventDefault();target.click();}
  });
  container.querySelectorAll(".portal-node").forEach(function(button){
    button.addEventListener("click", function() {
      selectedNode = nodes.find(function(n){return n.id === button.dataset.node;}) || nodes[0];
      updateNodeSelection();
    });
  });
  function filterFaq() {
    const query = document.getElementById("portalSearch").value.trim().toLocaleLowerCase();
    let visible = 0;
    container.querySelectorAll("#portalFaq details").forEach(function(detail) {
      const match = detail.textContent.toLocaleLowerCase().includes(query);
      detail.hidden = !match;
      if (match) visible++;
    });
    document.getElementById("portalNoResults").hidden = visible > 0;
  }
  document.getElementById("portalSearch").addEventListener("input",filterFaq);
  const states = {site:"unknown",xoni:"unknown"};
  let lastCheck = null;
  function updateStatusText() {
    const d = L[currentLang()];
    [["site","portalSiteState"],["xoni","portalXoniState"]].forEach(function(v){
      const el = document.getElementById(v[1]);
      el.dataset.state = states[v[0]] === "online" ? "online" : "unknown";
      el.textContent = d[states[v[0]]];
    });
    document.getElementById("portalLastCheck").textContent = lastCheck ? d.checked + " " + lastCheck.toLocaleTimeString(currentLang()) : "";
    document.getElementById("portalRefresh").textContent = d.statusCheck;
  }
  async function probe(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(function(){ controller.abort(); },7000);
    try {
      const response = await fetch(url, Object.assign({method:"GET",cache:"no-store",signal:controller.signal},options || {}));
      return response.ok ? "online" : "unavailable";
    } catch (_) {
      return "unknown"; // CORS, blocked network, or outage cannot be distinguished client-side
    } finally {clearTimeout(timeout);}
  }
  const refreshButton = document.getElementById("portalRefresh");
  async function checkStatus() {
    if (refreshButton.disabled) return;
    refreshButton.disabled = true;
    refreshButton.textContent = L[currentLang()].checking;
    states.site = "checking"; states.xoni = "checking"; updateStatusText();
    refreshButton.textContent = L[currentLang()].checking;
    const results = await Promise.all([
      probe("./favicon.svg?portal_check="+Date.now()),
      probe("https://xoni-mail.pages.dev/?portal_check="+Date.now(),{mode:"cors"})
    ]);
    states.site = results[0]; states.xoni = results[1];
    lastCheck = new Date();
    refreshButton.disabled = false;
    updateStatusText();
  }
  refreshButton.addEventListener("click",checkStatus);
  const localeObserver = new MutationObserver(function(records) {
    if (records.some(function(rec){return rec.attributeName === "lang";})) translatePortal();
  });
  localeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  document.querySelectorAll(".language-option").forEach(function(btn){btn.addEventListener("click",function(){queueMicrotask(translatePortal);});});
  translatePortal();
  checkStatus();
})();
