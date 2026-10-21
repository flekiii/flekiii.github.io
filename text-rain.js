/* Number rainfall for EVERY visible portfolio inscription.
   Uses the same matrix-char / matrix-digit markup as the original statement.
   Replays on each viewport re-entry without breaking link/button behavior. */
(() => {
  "use strict";

  const selector = [
    ".site-header .dock-home",
    ".site-header .desktop-nav a",
    ".site-header .lang-switch button",
    ".profile-wordmark",
    ".expertise .section-heading h2",
    ".expertise-item .expertise-index",
    ".expertise-item h3",
    ".expertise-item p",
    ".skills-intro h2",
    ".skills-intro p",
    ".skill-group h3",
    ".skill-pills span",
    ".support-message .section-label",
    ".support-message h2",
    ".support-message p:not(.section-label)",
    ".support-message .button span:first-child",
    ".card-controls button",
    ".contact-kicker",
    ".contact-content h2",
    ".contact-content > p:not(.contact-kicker)",
    ".contact-links a span:first-child",
    ".bank-top strong", ".bank-top small",
    ".bank-back-top strong", ".bank-back-top small",
    ".bank-printed-details span", ".bank-bottom small", ".bank-bottom strong",
    ".bank-bottom > span", ".bank-number",
    ".bank-back-caption", ".bank-back-serial", ".bank-back-footer span",
    ".bank-fine-print", ".bank-signature span"
  ].join(",");

  const reduce=matchMedia("(prefers-reduced-motion: reduce)");
  const grapheme=(typeof Intl!=="undefined"&&Intl.Segmenter)
    ? new Intl.Segmenter(undefined,{granularity:"grapheme"})
    : null;
  const split=s=>grapheme?Array.from(grapheme.segment(s),part=>part.segment):Array.from(s);
  const alnum=/[\p{L}\p{N}]/u;
  const originals=new WeakMap();
  let wrappers=[];
  let observer=null;
  let inView=new WeakSet();

  function wrap(node,target,ordinal){
    const text=node.nodeValue;
    const container=document.createElement("span");
    container.className="rain-inline";
    const sr=document.createElement("span");
    sr.className="rain-readable";
    sr.textContent=text;
    const visible=document.createElement("span");
    visible.className="rain-visual";
    visible.setAttribute("aria-hidden","true");

    const longText=target.matches("p");
    const stride=longText?12:target.matches("h2")?36:24;
    let index=0;
    const pieces=text.match(/\s+|[^\s]+/gu)||[];
    for(const token of pieces){
      if(/^\s+$/u.test(token)){
        visible.appendChild(document.createTextNode(token));
        continue;
      }
      const word=document.createElement("span");
      word.className="rain-word";
      for(const ch of split(token)){
        if(!alnum.test(ch)){
          word.appendChild(document.createTextNode(ch));
          continue;
        }
        const glyph=document.createElement("span");
        glyph.className="matrix-char";
        glyph.textContent=ch;
        glyph.style.setProperty("--stagger",Math.min(1500,index*stride)+"ms");
        // Four real falling digit glyphs just like the "free world" heading.
        for(let i=0;i<4;i++){
          const digit=document.createElement("span");
          digit.className="matrix-digit";
          digit.textContent=String((ordinal*13+index*7+i*3+5)%10);
          digit.style.setProperty("--rain-delay",(i*85)+"ms");
          digit.setAttribute("aria-hidden","true");
          glyph.appendChild(digit);
        }
        word.appendChild(glyph);
        index++;
      }
      visible.appendChild(word);
    }
    container.append(sr,visible);
    originals.set(container,text);
    node.replaceWith(container);
    wrappers.push(container);
  }

  function reset(){
    observer?.disconnect();
    observer=null;
    for(const item of wrappers){
      if(item.isConnected)item.replaceWith(document.createTextNode(originals.get(item)||""));
    }
    wrappers=[];
    inView=new WeakSet();
  }

  function reveal(entries){
    for(const entry of entries){
      const target=entry.target;
      // Low threshold also supports long paragraphs and small mobile screens.
      const showing=entry.isIntersecting&&entry.intersectionRatio>.01;
      if(showing){
        if(inView.has(target))continue;
        inView.add(target);
        target.classList.remove("matrix-start");
        // Restart every CSS transition/animation after a full exit.
        void target.offsetWidth;
        target.classList.add("matrix-start");
      }else if(inView.has(target)){
        inView.delete(target);
        target.classList.remove("matrix-start");
      }
    }
  }

  function rebuild(){
    reset();
    if(reduce.matches)return; // keep unmodified semantic text for reduced motion
    const targets=Array.from(document.querySelectorAll(selector));
    let ordinal=0;
    for(const target of targets){
      if(target.closest("[data-no-rain], [aria-hidden='true']"))continue;
      const textNodes=[];
      const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT,{
        acceptNode(node){
          return node.nodeValue&&alnum.test(node.nodeValue)
            ? NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
        }
      });
      while(walker.nextNode())textNodes.push(walker.currentNode);
      if(!textNodes.length)continue;
      for(const node of textNodes)wrap(node,target,ordinal++);
    }
    if(!("IntersectionObserver" in window)){
      for(const target of targets)target.classList.add("matrix-start");
      return;
    }
    observer=new IntersectionObserver(reveal,{
      rootMargin:"-4% 0px -6% 0px",threshold:[0,.02,.25]
    });
    for(const target of targets){
      if(target.querySelector(".rain-inline"))observer.observe(target);
    }
  }

  document.addEventListener("fleki:languagechange",rebuild);
  reduce.addEventListener?.("change",rebuild);
  // app.js has already chosen the UA/EN text before this defer script runs.
  rebuild();
})();