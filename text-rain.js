/* flekiii / v15 — repeated number-rain reveal for every piece of visible text.
   Each glyph is visually animated but the original sentence remains accessible. */
(() => {
  "use strict";
  const rootSelectors=["main",".site-header"];
  const skip="script,style,noscript,template,svg,canvas,input,textarea,select,pre,code,option,[aria-hidden='true'],.visually-hidden,.matrix-heading,.rain-inline,[data-no-rain]";
  const motion=matchMedia("(prefers-reduced-motion: reduce)");
  const letter=/[\p{L}\p{N}]/u;
  const splitter=(typeof Intl!=="undefined" && typeof Intl.Segmenter==="function")?
    new Intl.Segmenter(undefined,{granularity:"grapheme"}):null;
  const segments=value=>splitter?Array.from(splitter.segment(value),item=>item.segment):Array.from(value);
  let observer=null;
  let visible=new WeakSet();
  let generation=0;
  const originalText=new WeakMap();
  let activeBlocks=[];

  function nodeAllowed(textNode){
    const parent=textNode.parentElement;
    if(!parent||!textNode.nodeValue||!letter.test(textNode.nodeValue))return false;
    if(parent.closest(skip))return false;
    return !!parent.closest("main, .site-header");
  }

  function buildText(textNode,order){
    const raw=textNode.nodeValue;
    const visual=document.createElement("span");
    visual.className="rain-visual";
    visual.setAttribute("aria-hidden","true");

    const tokens=raw.match(/\s+|[^\s]+/gu)||[];
    let letterIndex=0;
    for(const token of tokens){
      if(/^\s+$/u.test(token)){
        visual.appendChild(document.createTextNode(token));continue;
      }
      const word=document.createElement("span");
      word.className="rain-word";
      for(const char of segments(token)){
        if(!letter.test(char)){
          word.appendChild(document.createTextNode(char));continue;
        }
        const glyph=document.createElement("span");
        glyph.className="rain-char";
        const offset=Math.min(1000,letterIndex*29);
        glyph.style.setProperty("--rain-delay",offset+"ms");
        const n=(order*11+letterIndex*7+2)%10;
        glyph.dataset.digitA=String(n);
        glyph.dataset.digitB=String((n+3)%10);

        const original=document.createElement("span");
        original.className="rain-glyph";
        original.textContent=char;
        glyph.appendChild(original);
        word.appendChild(glyph);
        letterIndex++;
      }
      visual.appendChild(word);
    }
    const wrapper=document.createElement("span");
    wrapper.className="rain-inline";
    // Do not make assistive tech read individual digits/character nodes.
    const accessible=document.createElement("span");
    accessible.className="rain-accessible";
    accessible.textContent=raw;
    wrapper.appendChild(accessible);
    wrapper.appendChild(visual);
    originalText.set(wrapper,raw);
    textNode.replaceWith(wrapper);
    return wrapper;
  }

  function onVisibility(entries){
    for(const entry of entries){
      const el=entry.target;
      const inView=entry.isIntersecting&&entry.intersectionRatio>.01;
      if(inView){
        if(visible.has(el))continue;
        visible.add(el);
        if(motion.matches)continue;
        // Removing the class out of view resets the CSS animations.
        // A reflow starts them again on *every* new entry.
        el.classList.remove("rain-active");
        void el.offsetWidth;
        el.classList.add("rain-active");
      }else if(visible.has(el)){
        visible.delete(el);
        el.classList.remove("rain-active");
      }
    }
  }

  function cleanUp(){
    observer?.disconnect();
    observer=null;
    for(const wrapper of activeBlocks){
      if(!wrapper.isConnected)continue;
      wrapper.replaceWith(document.createTextNode(originalText.get(wrapper)||""));
    }
    activeBlocks=[];
    visible=new WeakSet();
  }

  function rebuild(){
    cleanUp();
    const roots=rootSelectors.map(sel=>document.querySelector(sel)).filter(Boolean);
    const candidates=[];
    for(const root of roots){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
        acceptNode(node){
          return nodeAllowed(node)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
        }
      });
      while(walker.nextNode())candidates.push(walker.currentNode);
    }
    candidates.forEach((node,index)=>activeBlocks.push(buildText(node,index)));
    const canObserve="IntersectionObserver" in window;
    if(!canObserve||motion.matches)return;
    observer=new IntersectionObserver(onVisibility,{
      rootMargin:"-6% 0px -9% 0px",threshold:[0,.02,.3]
    });
    for(const wrapper of activeBlocks)observer.observe(wrapper);
    generation++;
  }
  document.addEventListener("fleki:languagechange",rebuild);
  motion.addEventListener?.("change",rebuild);
  rebuild();
})();