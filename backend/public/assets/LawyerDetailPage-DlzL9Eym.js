import{r as x,j as e,L as y,f as P}from"./vendor-react-B153i_ke.js";import{d as C,e as D,f as v,c as _,S as R}from"./index-DqwIl7Nw.js";function q(t){return t?{id:t.id,slug:t.slug,name:t.name,nameHanja:t.nameHanja||"",nameEn:t.nameEn||"",title:t.position||"",affiliation:"법무법인 하이로",team:t.team||"",photo:t.photoUrl||"",photoAlt:`${t.name} ${t.position||""} 프로필 사진`.trim(),tagline:t.tagline||"",intro:t.introduction||"",consultUrl:"/consultation",email:t.email||"",phone:t.phone||"",consultHours:t.consultHours||"",blogUrl:t.blogUrl||"",practiceAreas:g(t.specialties),education:T(t.education),career:T(t.career),qualifications:g(t.qualifications),publications:g(t.publications),books:g(t.books),media:g(t.media),columns:g(t.columns),cases:g(t.cases),memberships:g(t.memberships)}:null}function g(t){if(!t)return[];if(Array.isArray(t))return t;try{const n=JSON.parse(t);if(Array.isArray(n))return n}catch{}return String(t).split(`
`).map(n=>n.trim()).filter(Boolean)}function T(t){return g(t).map(i=>{if(i&&typeof i=="object")return{period:i.period||"",title:i.title||"",detail:i.detail||""};const l=String(i),r=l.indexOf("/");if(r>-1)return{period:l.slice(0,r).trim(),title:l.slice(r+1).trim()};const a=l.match(/^([\d~\-–\s년월일현재]+)\s+(.+)$/);return a?{period:a[1].trim(),title:a[2].trim()}:{period:"",title:l}})}function J({name:t}){const[n,i]=x.useState(!1),[l,r]=x.useState(!1),a=x.useRef(null);x.useEffect(()=>{if(!n)return;function f(j){a.current&&!a.current.contains(j.target)&&i(!1)}function m(j){j.key==="Escape"&&i(!1)}return document.addEventListener("mousedown",f),document.addEventListener("keydown",m),()=>{document.removeEventListener("mousedown",f),document.removeEventListener("keydown",m)}},[n]);async function s(){const f=typeof window<"u"?window.location.href:"",m=`${t} 변호사 — 법무법인 하이로`;if(navigator.share)try{await navigator.share({title:m,url:f});return}catch{}i(j=>!j)}async function h(){try{await navigator.clipboard.writeText(window.location.href),r(!0),setTimeout(()=>r(!1),1500)}catch{}}return e.jsxs("div",{ref:a,style:{position:"relative",width:"100%"},children:[e.jsx("button",{type:"button",className:"lp-btn lp-btn-secondary","aria-haspopup":"menu","aria-expanded":n,onClick:s,children:"공유하기"}),n&&e.jsxs("div",{role:"menu",className:"lp-share-menu",children:[e.jsx("button",{role:"menuitem",type:"button",onClick:h,className:"lp-share-item",children:l?"✓ 복사됨":"링크 복사"}),e.jsx("a",{role:"menuitem",href:`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(t)}`,target:"_blank",rel:"noopener noreferrer",className:"lp-share-item",children:"X (Twitter)"}),e.jsx("a",{role:"menuitem",href:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,target:"_blank",rel:"noopener noreferrer",className:"lp-share-item",children:"Facebook"})]}),e.jsx("style",{children:`
        .lp-share-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: #fff; border: 1px solid var(--lp-line); border-radius: 6px;
          min-width: 180px; padding: 4px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          z-index: 50;
        }
        .lp-share-item {
          display: block; width: 100%; text-align: left;
          padding: 10px 16px; font-size: 14px; color: var(--lp-ink);
          background: transparent; border: 0; cursor: pointer; text-decoration: none;
        }
        .lp-share-item:hover { background: var(--lp-accent-soft); color: var(--lp-accent); }
        @media (min-width: 1024px) {
          .lp-share-menu { right: auto; left: 0; }
        }
      `})]})}function K({lawyer:t}){var i,l;const n=t.photoAlt||`${t.name} 변호사 프로필 사진`;return e.jsxs("section",{className:"lp-hero",children:[e.jsxs("div",{className:"lp-hero-inner",children:[e.jsx("div",{className:"lp-hero-photo-wrap",children:t.photo?e.jsx("img",{src:t.photo,alt:n,className:"lp-hero-photo",loading:"eager"}):e.jsx("div",{className:"lp-hero-photo lp-hero-photo--placeholder","aria-hidden":"true",children:((i=t.name)==null?void 0:i[0])||"?"})}),e.jsxs("div",{className:"lp-hero-text",children:[(t.affiliation||t.team)&&e.jsxs("p",{className:"lp-eyebrow",children:[t.affiliation,t.team?` · ${t.team}`:""]}),e.jsxs("h1",{className:"lp-name",children:[e.jsx("span",{children:t.name}),t.nameHanja&&e.jsxs("span",{className:"lp-name-hanja",children:[" ",t.nameHanja]})]}),e.jsxs("p",{className:"lp-subtitle",children:[t.title,t.nameEn?` · ${t.nameEn}`:""]}),t.tagline&&e.jsx("p",{className:"lp-tagline",children:t.tagline}),((l=t.practiceAreas)==null?void 0:l.length)>0&&e.jsx("ul",{className:"lp-chips","aria-label":"주요 업무분야",children:t.practiceAreas.map(r=>e.jsx("li",{className:"lp-chip",children:r},r))}),e.jsxs("div",{className:"lp-cta-row",children:[e.jsx(y,{to:t.consultUrl||"/consultation",className:"lp-btn lp-btn-primary",children:"상담 예약"}),e.jsx(J,{name:t.name})]})]})]}),e.jsx("style",{children:`
        .lp-hero { background: var(--lp-bg); }
        .lp-hero-inner {
          max-width: 72rem; margin: 0 auto;
          padding: 28px 20px 36px;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px;
        }
        .lp-hero-photo-wrap { width: 168px; }
        .lp-hero-photo {
          width: 100%; aspect-ratio: 3 / 4; object-fit: cover;
          border-radius: 8px; background: #ddd;
          border: 1px solid var(--lp-line);
          box-shadow: 0 4px 16px -8px rgba(26,26,26,0.18);
        }
        .lp-hero-photo--placeholder {
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-serif); font-size: 64px; color: var(--lp-muted);
        }
        .lp-hero-text { width: 100%; max-width: 36rem; }
        .lp-eyebrow {
          font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--lp-muted); margin: 0 0 10px;
        }
        .lp-name {
          font-family: var(--font-serif-kr);
          font-size: 30px; line-height: 1.15; letter-spacing: -0.015em;
          color: var(--lp-ink); margin: 0; font-weight: 700;
        }
        .lp-name-hanja {
          font-size: 0.55em; color: var(--lp-muted); margin-left: 8px; font-weight: 400;
        }
        .lp-subtitle {
          font-size: 14.5px; color: var(--lp-ink-soft); margin: 8px 0 0;
        }
        .lp-tagline {
          font-family: var(--font-serif-kr);
          font-size: 16px; line-height: 1.65; color: var(--lp-ink-soft);
          margin: 18px 0 0; white-space: pre-line;
        }
        .lp-chips {
          list-style: none; padding: 0; margin: 22px 0 0;
          display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
        }
        .lp-chip {
          background: var(--lp-accent-soft); color: var(--lp-accent);
          padding: 5px 12px; border-radius: 9999px; font-size: 12.5px; font-weight: 500;
          letter-spacing: -0.01em;
        }
        .lp-cta-row {
          margin-top: 24px; display: flex; flex-direction: column; gap: 10px; width: 100%;
        }
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          height: 46px; padding: 0 22px; border-radius: 6px;
          font-size: 14.5px; font-weight: 600; cursor: pointer; text-decoration: none;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          width: 100%; letter-spacing: -0.01em;
        }
        .lp-btn-primary { background: var(--lp-accent); color: #fff; border: 1px solid var(--lp-accent); }
        .lp-btn-primary:hover { background: var(--lp-accent-hover); border-color: var(--lp-accent-hover); }
        .lp-btn-secondary {
          background: transparent; color: var(--lp-ink); border: 1px solid var(--lp-ink);
        }
        .lp-btn-secondary:hover { background: var(--lp-ink); color: #fff; }

        @media (min-width: 640px) {
          .lp-hero-inner { padding: 36px 24px 44px; gap: 28px; }
          .lp-hero-photo-wrap { width: 200px; }
          .lp-name { font-size: 34px; }
        }

        @media (min-width: 1024px) {
          .lp-hero-inner {
            flex-direction: row; align-items: flex-start; text-align: left;
            gap: 56px; padding: 64px 24px 72px;
          }
          .lp-hero-photo-wrap { width: 260px; flex-shrink: 0; }
          .lp-hero-text { max-width: none; flex: 1; }
          .lp-name { font-size: 44px; }
          .lp-subtitle { font-size: 17px; }
          .lp-tagline { font-size: 19px; }
          .lp-chips { justify-content: flex-start; }
          .lp-cta-row { flex-direction: row; width: auto; }
          .lp-btn { width: auto; min-width: 160px; }
        }
      `})]})}function O({tabs:t,active:n,onChange:i}){const l=x.useRef({});x.useEffect(()=>{const a=l.current[n];a&&a.scrollIntoView&&a.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"})},[n]);function r(a){const s=t.findIndex(m=>m.id===n);if(s<0)return;let h=s;if(a.key==="ArrowRight")h=(s+1)%t.length;else if(a.key==="ArrowLeft")h=(s-1+t.length)%t.length;else if(a.key==="Home")h=0;else if(a.key==="End")h=t.length-1;else return;a.preventDefault();const f=t[h];i(f.id),setTimeout(()=>{var m;return(m=l.current[f.id])==null?void 0:m.focus()},0)}return e.jsxs("div",{className:"lp-tabbar-wrap",children:[e.jsx("div",{className:"lp-tabbar-inner",children:e.jsx("div",{role:"tablist","aria-label":"변호사 프로필 탭",className:"lp-tab-scroll",onKeyDown:r,children:t.map(a=>{const s=a.id===n;return e.jsx("button",{ref:h=>l.current[a.id]=h,role:"tab",type:"button",id:`lp-tab-${a.id}`,"aria-controls":`lp-panel-${a.id}`,"aria-selected":s,tabIndex:s?0:-1,className:`lp-tab ${s?"is-active":""}`,onClick:()=>i(a.id),children:a.label},a.id)})})}),e.jsx("style",{children:`
        .lp-tabbar-wrap {
          position: sticky; top: 0; z-index: 30;
          background: rgba(255,255,255,0.96);
          backdrop-filter: saturate(140%) blur(8px);
          -webkit-backdrop-filter: saturate(140%) blur(8px);
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-tabbar-inner {
          max-width: 72rem; margin: 0 auto; padding: 0 20px;
        }
        .lp-tab-scroll {
          display: flex; gap: 2px;
          overflow-x: auto; white-space: nowrap;
          margin: 0 -20px; padding: 0 20px;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .lp-tab-scroll::-webkit-scrollbar { display: none; }
        .lp-tab {
          flex: 0 0 auto;
          background: transparent; border: 0; cursor: pointer;
          padding: 14px 12px; font-size: 14.5px; color: var(--lp-ink-soft);
          font-weight: 500; letter-spacing: -0.01em;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
        }
        .lp-tab:hover { color: var(--lp-ink); }
        .lp-tab.is-active {
          color: var(--lp-accent); font-weight: 700;
          border-bottom-color: var(--lp-accent);
        }
        .lp-tab:focus-visible {
          outline: 2px solid var(--lp-accent); outline-offset: -2px; border-radius: 2px;
        }
        @media (min-width: 640px) {
          .lp-tabbar-inner { padding: 0 24px; }
          .lp-tab-scroll { margin: 0 -24px; padding: 0 24px; gap: 4px; }
          .lp-tab { padding: 16px 14px; font-size: 15px; }
        }
        @media (min-width: 1024px) {
          .lp-tab { padding: 20px 18px; font-size: 16px; }
        }
      `})]})}function E({items:t}){return!t||t.length===0?e.jsx("p",{className:"lp-empty",children:"등록된 항목이 없습니다."}):e.jsxs("ul",{className:"lp-timeline",children:[t.map((n,i)=>e.jsxs("li",{className:"lp-timeline-item",children:[n.period&&e.jsx("div",{className:"lp-timeline-period",children:n.period}),e.jsxs("div",{className:"lp-timeline-content",children:[e.jsx("div",{className:"lp-timeline-title",children:n.title}),n.detail&&e.jsx("div",{className:"lp-timeline-detail",children:n.detail})]})]},i)),e.jsx("style",{children:`
        .lp-timeline { list-style: none; padding: 0; margin: 0; }
        .lp-timeline-item {
          padding: 14px 0;
          border-bottom: 1px solid var(--lp-line);
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px 16px;
        }
        .lp-timeline-item:first-child { padding-top: 4px; }
        .lp-timeline-item:last-child { border-bottom: 0; padding-bottom: 4px; }
        .lp-timeline-period {
          flex: 0 0 auto;
          min-width: 90px;
          font-family: var(--font-mono); font-size: 12px; color: var(--lp-muted);
          letter-spacing: 0.02em;
        }
        .lp-timeline-content {
          flex: 1 1 0;
          min-width: 0;
        }
        .lp-timeline-title {
          font-size: 15.5px; color: var(--lp-ink); line-height: 1.5;
          word-break: keep-all; overflow-wrap: anywhere;
        }
        .lp-timeline-detail { font-size: 13.5px; color: var(--lp-muted); margin-top: 4px; line-height: 1.55; }
        @media (min-width: 640px) {
          .lp-timeline-item { padding: 16px 0; gap: 4px 24px; }
          .lp-timeline-period { min-width: 110px; font-size: 13px; }
          .lp-timeline-title { font-size: 16px; }
        }
        @media (min-width: 1024px) {
          .lp-timeline-item { gap: 4px 32px; }
          .lp-timeline-period { min-width: 130px; }
          .lp-timeline-title { font-size: 17px; }
        }
      `})]})}function k({items:t,emptyMessage:n="등록된 항목이 없습니다."}){return!t||t.length===0?e.jsx("p",{className:"lp-empty",children:n}):e.jsxs("ul",{className:"lp-itemlist",children:[t.map((i,l)=>{const r=e.jsxs(e.Fragment,{children:[i.lead&&e.jsx("span",{className:"lp-itemlist-lead",children:i.lead}),e.jsx("span",{className:"lp-itemlist-title",children:i.title}),i.meta&&e.jsx("span",{className:"lp-itemlist-meta",children:i.meta})]});return e.jsx("li",{className:"lp-itemlist-item",children:i.url?e.jsx("a",{href:i.url,target:i.external?"_blank":void 0,rel:i.external?"noopener noreferrer":void 0,children:r}):e.jsx("span",{children:r})},l)}),e.jsx("style",{children:`
        .lp-itemlist { list-style: none; padding: 0; margin: 0; }
        .lp-itemlist-item {
          padding: 14px 0; border-bottom: 1px solid var(--lp-line);
          font-size: 15.5px; line-height: 1.65;
        }
        .lp-itemlist-item:first-child { padding-top: 4px; }
        .lp-itemlist-item:last-child { border-bottom: 0; padding-bottom: 4px; }
        .lp-itemlist-item a {
          color: inherit; text-decoration: none;
          display: block;
        }
        .lp-itemlist-item a:hover .lp-itemlist-title {
          color: var(--lp-accent); text-decoration: underline;
        }
        .lp-itemlist-lead {
          font-family: var(--font-mono); font-size: 12.5px; color: var(--lp-muted);
          margin-right: 12px; letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .lp-itemlist-title { color: var(--lp-ink); word-break: keep-all; }
        .lp-itemlist-meta {
          display: block; color: var(--lp-muted); font-size: 13.5px;
          margin-top: 4px;
        }
        @media (min-width: 640px) {
          .lp-itemlist-item { font-size: 16px; }
          .lp-itemlist-meta { display: inline; margin-left: 8px; margin-top: 0; font-size: 14px; }
        }
      `})]})}function d({children:t}){return e.jsx("h2",{className:"lp-section-h2",children:t})}function U({lawyer:t}){var n;return e.jsxs("div",{className:"lp-section-stack",children:[t.intro&&e.jsxs("section",{children:[e.jsx(d,{children:"소개"}),e.jsx("p",{className:"lp-intro-body",children:t.intro})]}),e.jsxs("section",{children:[e.jsx(d,{children:"학력"}),e.jsx(E,{items:t.education})]}),e.jsxs("section",{children:[e.jsx(d,{children:"경력"}),e.jsx(E,{items:t.career})]}),e.jsxs("section",{children:[e.jsx(d,{children:"자격"}),e.jsx(k,{items:(t.qualifications||[]).map(i=>({title:i}))})]}),((n=t.memberships)==null?void 0:n.length)>0&&e.jsxs("section",{children:[e.jsx(d,{children:"소속 위원회 · 학회"}),e.jsx(k,{items:t.memberships.map(i=>({title:i}))})]}),(t.consultHours||t.email||t.phone||t.blogUrl)&&e.jsxs("section",{children:[e.jsx(d,{children:"연락 · 상담"}),e.jsxs("dl",{className:"lp-meta-list",children:[t.consultHours&&e.jsxs(e.Fragment,{children:[e.jsx("dt",{children:"상담시간"}),e.jsx("dd",{children:t.consultHours})]}),t.email&&e.jsxs(e.Fragment,{children:[e.jsx("dt",{children:"이메일"}),e.jsx("dd",{children:e.jsx("a",{href:`mailto:${t.email}`,children:t.email})})]}),t.phone&&e.jsxs(e.Fragment,{children:[e.jsx("dt",{children:"전화"}),e.jsx("dd",{children:t.phone})]}),t.blogUrl&&e.jsxs(e.Fragment,{children:[e.jsx("dt",{children:"블로그"}),e.jsx("dd",{children:e.jsx("a",{href:t.blogUrl,target:"_blank",rel:"noopener noreferrer",children:t.blogUrl})})]})]})]}),e.jsx(b,{})]})}function V({lawyer:t}){var n;return(n=t.practiceAreas)!=null&&n.length?e.jsxs("div",{children:[e.jsx(d,{children:"주요 업무분야"}),e.jsx("ul",{className:"lp-practice-grid",children:t.practiceAreas.map(i=>e.jsx("li",{className:"lp-practice-card",children:i},i))}),e.jsx("style",{children:`
        .lp-practice-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        .lp-practice-card {
          padding: 20px 12px; text-align: center;
          border: 1px solid var(--lp-line); border-radius: 6px;
          font-size: 14.5px; color: var(--lp-ink); background: var(--lp-surface);
          font-weight: 500; letter-spacing: -0.01em;
          transition: border-color 0.15s, color 0.15s, transform 0.15s;
        }
        .lp-practice-card:hover {
          border-color: var(--lp-accent); color: var(--lp-accent);
          transform: translateY(-1px);
        }
        @media (min-width: 640px) {
          .lp-practice-grid { gap: 12px; }
          .lp-practice-card { padding: 24px 16px; font-size: 16px; }
        }
        @media (min-width: 768px) {
          .lp-practice-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .lp-practice-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}),e.jsx(b,{})]}):e.jsx("p",{className:"lp-empty",children:"등록된 업무분야가 없습니다."})}function Y({lawyer:t}){const n=(t.publications||[]).slice().sort((l,r)=>(r.year||0)-(l.year||0)).map(l=>({lead:String(l.year||""),title:`「${l.title}」`,meta:[l.journal,(l.coAuthors||[]).join(", ")].filter(Boolean).join(" · "),url:l.url,external:!!l.url})),i=(t.books||[]).slice().sort((l,r)=>(r.year||0)-(l.year||0)).map(l=>({lead:String(l.year||""),title:l.title,meta:[l.publisher,l.role].filter(Boolean).join(" · "),url:l.url,external:!!l.url}));return e.jsxs("div",{className:"lp-section-stack",children:[e.jsxs("section",{children:[e.jsx(d,{children:"논문"}),e.jsx(k,{items:n,emptyMessage:"등록된 논문이 없습니다."})]}),e.jsxs("section",{children:[e.jsx(d,{children:"저서"}),e.jsx(k,{items:i,emptyMessage:"등록된 저서가 없습니다."})]}),e.jsx(b,{})]})}function G({lawyer:t}){const n=(t.media||[]).slice().sort((i,l)=>(l.date||"").localeCompare(i.date||"")).map(i=>({lead:i.date||"",title:i.title,meta:i.outlet,url:i.url,external:!!i.url}));return e.jsxs("div",{children:[e.jsx(d,{children:"언론활동 · 미디어"}),e.jsx(k,{items:n,emptyMessage:"등록된 미디어 항목이 없습니다."}),e.jsx(b,{})]})}function W({lawyer:t}){const n=(t.columns||[]).slice().sort((i,l)=>(l.date||"").localeCompare(i.date||"")).map(i=>({lead:i.date||"",title:i.title,meta:i.excerpt,url:i.url,external:i.url&&i.url.startsWith("http")}));return e.jsxs("div",{children:[e.jsx(d,{children:"블로그"}),e.jsx(k,{items:n,emptyMessage:"등록된 글이 없습니다."}),e.jsx(b,{})]})}function S(t){const n=`${t.title||""} ${t.host||""} ${t.description||""}`;return/\bAI\b|법률\s*AI|인공지능/i.test(n)}function $({lecture:t}){return e.jsxs("li",{className:"lp-lecture-card",children:[t.thumbnailUrl&&e.jsx("div",{className:"lp-lecture-thumb",children:e.jsx("img",{src:t.thumbnailUrl,alt:"",loading:"lazy",onError:n=>{n.currentTarget.parentElement.style.display="none"}})}),e.jsxs("div",{className:"lp-lecture-body",children:[t.date&&e.jsx("div",{className:"lp-lecture-date",children:t.date}),e.jsx("h3",{className:"lp-lecture-title",children:t.title}),(t.host||t.venue)&&e.jsxs("div",{className:"lp-lecture-meta",children:[t.host&&e.jsx("span",{className:"lp-lecture-host",children:t.host}),t.host&&t.venue&&e.jsx("span",{"aria-hidden":"true",children:" · "}),t.venue&&e.jsx("span",{children:t.venue})]}),t.description&&e.jsx("p",{className:"lp-lecture-desc",children:t.description}),t.materialUrl&&e.jsxs("a",{className:"lp-lecture-material",href:t.materialUrl,target:"_blank",rel:"noopener noreferrer",children:["강의안 ",t.materialName?`(${t.materialName})`:"보기"," →"]})]})]})}function X({lawyer:t}){const n=(t.lectures||[]).slice().sort((a,s)=>(s.date||"").localeCompare(a.date||""));if(n.length===0)return e.jsxs("div",{children:[e.jsx(d,{children:"강연 · 세미나"}),e.jsx("p",{className:"lp-empty",children:"등록된 강연이 없습니다."}),e.jsx(b,{})]});const i=n.filter(S),l=n.filter(a=>!S(a)),r=i.length>0&&l.length>0;return e.jsxs("div",{children:[e.jsx(d,{children:"강연 · 세미나"}),r?e.jsxs(e.Fragment,{children:[e.jsxs("h3",{className:"lp-lecture-group-h",children:["법률 AI 강의 · 특강 (",i.length,")"]}),e.jsx("ul",{className:"lp-lecture-grid",children:i.map((a,s)=>e.jsx($,{lecture:a},a.id||`ai-${s}`))}),e.jsxs("h3",{className:"lp-lecture-group-h",style:{marginTop:36},children:["그 외 강의 (",l.length,")"]}),e.jsx("ul",{className:"lp-lecture-grid",children:l.map((a,s)=>e.jsx($,{lecture:a},a.id||`etc-${s}`))})]}):e.jsx("ul",{className:"lp-lecture-grid",children:n.map((a,s)=>e.jsx($,{lecture:a},a.id||s))}),e.jsx("style",{children:`
        .lp-lecture-group-h {
          font-size: 14px; font-weight: 600;
          color: var(--lp-muted);
          letter-spacing: 0.02em;
          margin: 4px 0 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-lecture-grid {
          list-style: none; padding: 0; margin: 0;
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 720px) {
          .lp-lecture-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
        .lp-lecture-card {
          display: flex; flex-direction: column;
          background: #fff;
          border: 1px solid var(--lp-line);
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .lp-lecture-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
          border-color: var(--lp-accent);
        }
        .lp-lecture-thumb {
          width: 100%; aspect-ratio: 16 / 9;
          background: #f1f3f7;
          overflow: hidden;
        }
        .lp-lecture-thumb img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .lp-lecture-body {
          padding: 16px 18px 18px;
          display: flex; flex-direction: column; gap: 6px;
          flex: 1;
        }
        .lp-lecture-date {
          font-family: var(--font-mono);
          font-size: 12px; color: var(--lp-muted);
          letter-spacing: 0.04em;
        }
        .lp-lecture-title {
          font-size: 16px; font-weight: 600;
          color: var(--lp-ink);
          line-height: 1.4;
          margin: 0;
          word-break: keep-all;
        }
        .lp-lecture-meta {
          font-size: 13px; color: var(--lp-muted);
          line-height: 1.5;
        }
        .lp-lecture-host { color: var(--lp-ink); font-weight: 500; }
        .lp-lecture-desc {
          font-size: 13.5px; color: var(--lp-ink);
          line-height: 1.6;
          margin: 4px 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .lp-lecture-material {
          margin-top: auto;
          padding-top: 8px;
          font-size: 13px;
          color: var(--lp-accent);
          text-decoration: none;
          font-weight: 500;
        }
        .lp-lecture-material:hover { text-decoration: underline; }
        @media (min-width: 1024px) {
          .lp-lecture-title { font-size: 17px; }
        }
      `}),e.jsx(b,{})]})}function Q({lawyer:t}){const n=(t.cases||[]).slice().sort((i,l)=>(l.year||0)-(i.year||0));return n.length===0?e.jsxs("div",{children:[e.jsx(d,{children:"주요 수행사례"}),e.jsx("p",{className:"lp-empty",children:"등록된 사례가 없습니다."}),e.jsx(b,{})]}):e.jsxs("div",{children:[e.jsx(d,{children:"주요 수행사례"}),e.jsx("p",{className:"lp-cases-disclaimer",children:"변호사법 및 광고규정에 따라 의뢰인의 동의 없이 구체적 인적사항을 공개하지 않으며, 사건번호와 결과만 익명·일반화하여 표기합니다."}),e.jsx("ul",{className:"lp-cases",children:n.map((i,l)=>e.jsxs("li",{className:"lp-case",children:[e.jsxs("div",{className:"lp-case-head",children:[i.category&&e.jsx("span",{className:"lp-case-chip",children:i.category}),e.jsx("span",{className:"lp-case-year",children:i.year}),i.outcome&&e.jsx("span",{className:"lp-case-outcome",children:i.outcome})]}),i.caseNumber&&e.jsx("div",{className:"lp-case-num",children:i.caseNumber}),e.jsx("div",{className:"lp-case-desc",children:i.description})]},l))}),e.jsx("style",{children:`
        .lp-cases-disclaimer {
          font-size: 12.5px; color: var(--lp-muted); line-height: 1.6;
          background: var(--lp-bg); padding: 10px 14px;
          border-left: 3px solid var(--lp-accent); border-radius: 2px;
          margin: 0 0 20px;
        }
        @media (min-width: 640px) {
          .lp-cases-disclaimer { font-size: 13px; padding: 12px 16px; margin-bottom: 24px; }
        }
        .lp-cases { list-style: none; padding: 0; margin: 0; }
        .lp-case {
          padding: 18px 0; border-bottom: 1px solid var(--lp-line);
        }
        .lp-case:first-child { padding-top: 4px; }
        .lp-case:last-child { border-bottom: 0; }
        .lp-case-head {
          display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
          margin-bottom: 6px;
        }
        .lp-case-chip {
          background: var(--lp-accent-soft); color: var(--lp-accent);
          padding: 3px 9px; border-radius: 9999px; font-size: 11.5px; font-weight: 600;
        }
        .lp-case-year {
          font-family: var(--font-mono); color: var(--lp-muted); font-size: 12.5px;
        }
        .lp-case-outcome {
          margin-left: auto;
          background: var(--lp-ink); color: #fff;
          padding: 3px 9px; border-radius: 4px; font-size: 11.5px; font-weight: 600;
        }
        .lp-case-num {
          font-family: var(--font-mono); font-size: 12.5px; color: var(--lp-ink-soft);
          margin-bottom: 4px; word-break: break-all;
        }
        .lp-case-desc { font-size: 15px; color: var(--lp-ink); line-height: 1.65; word-break: keep-all; }
        @media (min-width: 640px) {
          .lp-case { padding: 20px 0; }
          .lp-case-desc { font-size: 16px; }
        }
      `}),e.jsx(b,{})]})}function b(){return e.jsx("style",{children:`
      .lp-section-stack > section + section { margin-top: 36px; }
      .lp-section-h2 {
        font-family: var(--font-serif-kr);
        font-size: 19px; color: var(--lp-ink); letter-spacing: -0.015em;
        margin: 0 0 16px; padding-bottom: 10px;
        border-bottom: 1px solid var(--lp-line);
        font-weight: 700;
      }
      @media (min-width: 640px) {
        .lp-section-h2 { font-size: 22px; margin: 0 0 20px; padding-bottom: 12px; }
        .lp-section-stack > section + section { margin-top: 48px; }
      }
      @media (min-width: 1024px) {
        .lp-section-h2 { font-size: 26px; }
        .lp-section-stack > section + section { margin-top: 64px; }
      }
      .lp-intro-body {
        font-size: 15px; line-height: 1.85; color: var(--lp-ink-soft); margin: 0;
        white-space: pre-line; word-break: keep-all;
      }
      @media (min-width: 640px) { .lp-intro-body { font-size: 16px; } }
      .lp-empty {
        font-size: 14px; color: var(--lp-muted);
        padding: 32px 0; text-align: center;
        background: var(--lp-bg);
        border-radius: 6px;
      }
      .lp-meta-list {
        display: grid; grid-template-columns: 84px 1fr; gap: 10px 14px;
        margin: 0; font-size: 14.5px;
      }
      @media (min-width: 640px) {
        .lp-meta-list { grid-template-columns: 100px 1fr; font-size: 15px; }
      }
      .lp-meta-list dt { color: var(--lp-muted); }
      .lp-meta-list dd { margin: 0; color: var(--lp-ink); word-break: break-all; }
      .lp-meta-list a { color: var(--lp-accent); text-decoration: none; }
      .lp-meta-list a:hover { text-decoration: underline; }
    `})}const A=[{id:"profile",label:"프로필",Component:U},{id:"practice",label:"업무분야",Component:V},{id:"papers",label:"논문·저서",Component:Y},{id:"media",label:"미디어",Component:G},{id:"columns",label:"칼럼",Component:W},{id:"lectures",label:"강연",Component:X},{id:"cases",label:"수행사례",Component:Q}],N=A.map(t=>t.id);function Z(){if(typeof window>"u")return N[0];const t=window.location.hash.replace("#","");return N.includes(t)?t:N[0]}function ie(){var L;const{id:t}=P(),[n,i]=x.useState(null),[l,r]=x.useState([]),[a,s]=x.useState(!0),[h,f]=x.useState(""),[m,j]=x.useState(Z);x.useEffect(()=>{let c=!1;return queueMicrotask(()=>{c||(s(!0),C.get(`/lawyers/${t}`).then(p=>{var u;if(c)return null;i((p==null?void 0:p.data)||null);const w=(u=p==null?void 0:p.data)==null?void 0:u.id;return w?C.get(`/lectures?lawyerId=${w}`).catch(()=>({data:[]})):{data:[]}}).then(p=>{if(c||!p)return;const w=(p==null?void 0:p.data)||[];r(w.map(u=>({id:u.id,date:u.date||"",title:u.title||"",host:u.organizer||"",venue:u.venue||"",description:u.description||"",thumbnailUrl:u.thumbnailUrl||"",materialUrl:u.materialUrl||"",materialName:u.materialName||""}))),s(!1)}).catch(p=>{c||(f((p==null?void 0:p.message)||"변호사 정보를 불러오지 못했습니다"),s(!1))}))}),()=>{c=!0}},[t]),x.useEffect(()=>{function c(){const p=window.location.hash.replace("#","");N.includes(p)&&j(p)}return window.addEventListener("hashchange",c),()=>window.removeEventListener("hashchange",c)},[]);function H(c){if(j(c),typeof window<"u"){const p=`${window.location.pathname}#${c}`;window.history.replaceState(null,"",p)}}const o=x.useMemo(()=>{const c=q(n);return c?(c.lectures=l,c):null},[n,l]);if(a)return e.jsx("div",{className:"lp-scope",style:{background:"var(--lp-bg)",minHeight:"60vh",padding:"80px 24px",textAlign:"center"},children:e.jsx("p",{style:{color:"var(--lp-muted)"},children:"불러오는 중…"})});if(h||!o)return e.jsxs("div",{className:"lp-scope",style:{background:"var(--lp-bg)",minHeight:"60vh",padding:"80px 24px",textAlign:"center"},children:[e.jsx("p",{style:{color:"var(--lp-ink)",marginBottom:16},children:h||"변호사를 찾을 수 없습니다."}),e.jsx(y,{to:"/partners",style:{color:"var(--lp-accent)"},children:"← 구성원 목록으로"})]});const I=((L=A.find(c=>c.id===m))==null?void 0:L.Component)||U,z=`/partners/${o.slug||o.id}`,B=`${o.name} ${o.title} — 법무법인 하이로`,M=o.tagline||o.intro||`${o.name} ${o.title}의 학력·경력·논문·수행사례를 소개합니다.`,F=[D({name:o.name,jobTitle:o.title,url:v(z),image:o.photo?v(o.photo):void 0,email:o.email,telephone:o.phone,knowsAbout:o.practiceAreas}),_([{name:"홈",url:v("/")},{name:"구성원",url:v("/partners")},{name:o.name,url:v(z)}])];return e.jsxs("div",{className:"lp-scope",children:[e.jsx(R,{title:B,description:M,path:z,image:o.photo?v(o.photo):void 0,jsonLd:F}),e.jsx("nav",{"aria-label":"경로",className:"lp-breadcrumb",children:e.jsxs("div",{className:"lp-breadcrumb-inner",children:[e.jsx(y,{to:"/",children:"홈"}),e.jsx("span",{"aria-hidden":"true",children:"›"}),e.jsx(y,{to:"/partners",children:"구성원"}),e.jsx("span",{"aria-hidden":"true",children:"›"}),e.jsx("span",{"aria-current":"page",children:o.name})]})}),e.jsx(K,{lawyer:o}),e.jsx(O,{tabs:A,active:m,onChange:H}),e.jsx("main",{className:"lp-main",children:e.jsx("div",{role:"tabpanel",id:`lp-panel-${m}`,"aria-labelledby":`lp-tab-${m}`,tabIndex:0,className:"lp-panel",children:e.jsx(I,{lawyer:o})})}),e.jsx("style",{children:`
        .lp-scope {
          background: var(--lp-bg);
          color: var(--lp-ink);
          /* 고정 헤더(유틸 30 + 메인 64 + 보더) + 모바일 노치 안전영역까지 클리어 */
          padding-top: calc(110px + env(safe-area-inset-top, 0px));
        }
        @media (min-width: 640px) {
          .lp-scope { padding-top: calc(100px + env(safe-area-inset-top, 0px)); }
        }
        .lp-breadcrumb {
          background: var(--lp-bg);
          border-bottom: 1px solid var(--lp-line);
        }
        .lp-breadcrumb-inner {
          max-width: 72rem; margin: 0 auto;
          padding: 10px 20px;
          font-size: 12.5px; color: var(--lp-muted);
          display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
        }
        .lp-breadcrumb-inner a {
          color: var(--lp-muted); text-decoration: none;
        }
        .lp-breadcrumb-inner a:hover { color: var(--lp-accent); }
        .lp-breadcrumb-inner [aria-current="page"] { color: var(--lp-ink); }
        .lp-main {
          background: var(--lp-bg);
          padding: 32px 20px 64px;
        }
        .lp-panel {
          max-width: 56rem; margin: 0 auto;
          outline: none;
        }
        .lp-panel:focus-visible {
          outline: 2px solid var(--lp-accent); outline-offset: 4px;
        }
        @media (min-width: 640px) {
          .lp-breadcrumb-inner { padding: 12px 24px; font-size: 13px; }
          .lp-main { padding: 40px 24px 80px; }
        }
        @media (min-width: 1024px) {
          .lp-main { padding: 64px 24px 120px; }
        }
      `})]})}export{ie as default};
