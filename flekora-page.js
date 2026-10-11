// FLEKORA settings use the same storage keys and CSS palettes as the homepage.
(() => {
  const ids=['pink','blue','purple','green','amber','crimson','ice','sunset','mint','violet','graphite','cherry','solar','teal','mocha'];
  const labels={
    en:['Theme','Palette','Dark','Light','Rose','Ocean','Lavender','Emerald','Amber','Crimson','Ice','Sunset','Mint','Violet','Graphite','Cherry','Solar','Teal','Mocha'],
    uk:['Тема','Палітра','Темна','Світла','Троянда','Океан','Лаванда','Смарагд','Бурштин','Багряна','Лід','Захід сонця','М’ята','Фіолетова','Графіт','Вишня','Сонячна','Бірюза','Мокко'],
    pl:['Motyw','Paleta','Ciemny','Jasny','Róża','Ocean','Lawenda','Szmaragd','Bursztyn','Karmazyn','Lód','Zachód słońca','Mięta','Fiolet','Grafit','Wiśnia','Słoneczny','Turkus','Mokka'],
    de:['Design','Palette','Dunkel','Hell','Rose','Ozean','Lavendel','Smaragd','Bernstein','Karmin','Eis','Sonnenuntergang','Minze','Violett','Graphit','Kirsche','Sonne','Türkis','Mokka'],
    ja:['テーマ','配色','ダーク','ライト','ローズ','オーシャン','ラベンダー','エメラルド','アンバー','クリムゾン','アイス','サンセット','ミント','バイオレット','グラファイト','チェリー','ソーラー','ティール','モカ'],
    es:['Tema','Paleta','Oscuro','Claro','Rosa','Océano','Lavanda','Esmeralda','Ámbar','Carmesí','Hielo','Atardecer','Menta','Violeta','Grafito','Cereza','Solar','Turquesa','Moca'],
    fr:['Thème','Palette','Sombre','Clair','Rose','Océan','Lavande','Émeraude','Ambre','Cramoisi','Glace','Coucher de soleil','Menthe','Violet','Graphite','Cerise','Solaire','Sarcelle','Moka']
  };
  const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
  function applyTheme(value,save=false){
    let theme=value==='light'?'pink-light':value;
    const base=String(theme||'').replace(/-light$/,'');
    if(!ids.includes(base))theme='pink';
    document.documentElement.dataset.theme=theme;
    const select=document.querySelector('[data-flekora-theme-base]');
    if(select)select.value=theme.replace(/-light$/,'');
    document.querySelectorAll('[data-flekora-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.flekoraMode===(theme.endsWith('-light')?'light':'dark'))));
    if(save)write('flekiii-theme',theme);
  }
  function localize(language){
    const text=labels[language]||labels.en;
    ['theme','palette','dark','light'].forEach((key,index)=>{const node=document.querySelector(`[data-flekora-i18n="${key}"]`);if(node)node.textContent=text[index];});
    const select=document.querySelector('[data-flekora-theme-base]');
    if(select){select.innerHTML=ids.map((id,index)=>`<option value="${id}">${text[index+4]}</option>`).join('');select.setAttribute('aria-label',text[1]);}
    applyTheme(document.documentElement.dataset.theme||read('flekiii-theme'));
  }
  const previous=setLang;
  setLang=function(language){previous(language);localize(document.documentElement.lang);};
  document.addEventListener('DOMContentLoaded',()=>{
    applyTheme(read('flekiii-theme'));
    localize(document.documentElement.lang);
    document.querySelector('[data-flekora-theme-base]')?.addEventListener('change',event=>{
      applyTheme(event.target.value+(document.documentElement.dataset.theme.endsWith('-light')?'-light':''),true);
    });
    document.querySelectorAll('[data-flekora-mode]').forEach(button=>button.addEventListener('click',()=>{
      applyTheme(document.documentElement.dataset.theme.replace(/-light$/,'')+(button.dataset.flekoraMode==='light'?'-light':''),true);
    }));
  });
  window.addEventListener('storage',event=>{
    if(event.key==='flekiii-theme')applyTheme(event.newValue);
    if(event.key==='flekiii-language' && event.newValue)setLang(event.newValue);
  });
})();
