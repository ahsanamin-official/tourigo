(function(){
  // For automatic daily updates: host a data.json (same shape as #site-data) refreshed by a scheduled job and set DATA_URL.
  var DATA_URL="";
  var $=function(i){return document.getElementById(i)},MS=864e5;
  function fmt(d){return new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
  function daysOld(d){var t=new Date();t.setHours(0,0,0,0);return Math.round((t-new Date(d+"T00:00:00"))/MS)}
  function loadData(){var e=JSON.parse($("site-data").textContent);if(!DATA_URL)return Promise.resolve(e);return fetch(DATA_URL,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return e})}

  // routing: one page per heading
  function route(){
    var h=(location.hash.replace("#/","")||"home"),pages=document.querySelectorAll("section[data-page]"),ok=false;
    pages.forEach(function(s){var on=s.dataset.page===h;if(on)ok=true;s.classList.toggle("show",on)});
    if(!ok){h="home";pages[0].classList.add("show")}
    document.querySelectorAll("#nav a").forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#/"+h)});
    window.scrollTo(0,0);closeMenu&&closeMenu();
  }
  window.addEventListener("hashchange",route);
  var mb=$("menuBtn"),nv=$("nav");
  function MI(o){return '<svg class="ic"><use href="#ic-'+(o?"close":"menu")+'"/></svg><span>'+(o?"Close":"Menu")+'</span>'}
  function closeMenu(){nv.classList.remove("open");mb.setAttribute("aria-expanded","false");mb.innerHTML=MI(0)}
  mb.onclick=function(){var o=nv.classList.toggle("open");mb.setAttribute("aria-expanded",o);mb.innerHTML=MI(o)};
  nv.addEventListener("click",function(e){if(e.target.closest("a"))closeMenu()});

  function render(data){
    var age=daysOld(data.updatedAt),label=fmt(data.updatedAt),b=$("banner"),msg="Data on this site is as of "+label;
    if(age<=0){b.className="";msg+=" (today)"}else if(age<=7){b.className="warn";msg+=" ("+age+" day"+(age>1?"s":"")+" ago). Please re-check critical details."}else{b.className="bad";msg+=" ("+age+" days ago, may be outdated). Verify with official sources."}
    b.textContent=msg;
    $("factsub").textContent="Last full review: "+label+". Each card shows its own check date.";
    $("foot-asof").textContent="Data snapshot date: "+label+".";
    document.querySelectorAll(".asofx").forEach(function(x){x.textContent=label});
    $("dlg-text").textContent="All prices, visa details, advisories and payment availability on this site are as of "+label+(age>0?" ("+age+" day(s) ago)":"")+". They can change without notice; verify before you book.";
    var g=$("facts-grid");g.textContent="";
    data.items.forEach(function(it){
      var c=document.createElement("div");c.className="card";
      var h=document.createElement("h3");h.innerHTML=it.label;
      var v=document.createElement("div");v.className="val";v.textContent=typeof it.value==="number"?"≈ "+it.value:it.value;
      var n=document.createElement("p");n.className="sub";n.style.margin="6px 0 0";n.textContent=it.note;
      var a=document.createElement("div");a.className="asof";a.textContent=(it.asOf?"As of "+fmt(it.asOf):"No verified date")+" · "+it.source;
      var ch=document.createElement("span"),stale=it.asOf&&daysOld(it.asOf)>7;
      if(it.status==="estimate"){ch.className="chip est";ch.textContent="estimate"}else if(stale){ch.className="chip stale";ch.textContent="needs refresh"}
      if(ch.textContent)h.appendChild(ch);
      c.appendChild(h);c.appendChild(v);c.appendChild(n);c.appendChild(a);g.appendChild(c);
    });
    window.__fx=(data.items.filter(function(i){return i.id==="fx"})[0]||{}).value||280;
    try{if(!sessionStorage.getItem("seen"+data.updatedAt)){$("dlg").showModal();sessionStorage.setItem("seen"+data.updatedAt,"1")}}catch(e){try{$("dlg").showModal()}catch(e2){}}
  }
  $("dlg-ok").onclick=function(){$("dlg").close()};

  // season heat chart (illustrative scores 1-5)
  var M="JFMAMJJASOND".split(""),S={"Lahore & plains":[3,4,5,4,2,1,1,2,3,5,4,3],"Northern mountains":[1,1,2,3,4,5,3,3,5,4,2,1],"Coast":[4,5,5,4,3,2,2,2,3,4,5,5]};
  var hh='<span></span>'+M.map(function(m){return"<b>"+m+"</b>"}).join("");
  Object.keys(S).forEach(function(k){hh+="<span>"+k+"</span>"+S[k].map(function(s){return'<i style="--s:'+s+'" title="'+s+'/5"></i>'}).join("")});
  $("heat").innerHTML=hh;

  // donut: share of package price (illustrative)
  var P=[["Accommodation",32,"#2a4bb0"],["Transport",24,"#e59a2f"],["Food & guides",22,"#d4573b"],["Visa, SIM, support",8,"#c0658a"],["Contingency",6,"#3a9bb0"],["Our margin",8,"#8a8fb0"]],off=25,dn="",lg="";
  P.forEach(function(p){dn+='<circle r="15.9155" cx="21" cy="21" fill="none" stroke="'+p[2]+'" stroke-width="7" stroke-dasharray="'+p[1]+' '+(100-p[1])+'" stroke-dashoffset="'+off+'"/>';off-=p[1];lg+='<li style="--c:'+p[2]+'">'+p[0]+" · "+p[1]+"%</li>"});
  $("donut").innerHTML=dn;$("dlegend").innerHTML=lg;

  // calculator (illustrative placeholders)
  var BASE={budget:70,standard:130,comfort:240},OUR=0.12,SETUP=75,FX=0.03,RISK=0.06;
  function usd(n){return R(n)}
  function calc(){
    var d=+$("days").value||0,p=+$("ppl").value||0,s=$("style").value,prem=(+$("prem").value||0)/100,h=+$("hrs").value||0,hv=+$("hrv").value||0;
    var base=BASE[s]*d*p,ours=base*(1+OUR)+SETUP*p,diyT=h*hv,diy=base*(1+prem+FX+RISK)+diyT,sv=diy-ours,mx=Math.max(ours,diy)||1;
    var rows=[["Trip costs at base rates",usd(base),usd(base)],["Price premium / our service fee",usd(base*prem),usd(base*OUR+SETUP*p)],["Currency &amp; ATM losses (3%)",usd(base*FX),"included"],["Disruption allowance (6%)",usd(base*RISK),"handled by us"],["Your planning time",usd(diyT),"none"]];
    $("result").innerHTML='<div class="sans" style="font-size:13px;color:var(--mut)">Estimated total for '+p+' traveller(s), '+d+' days</div>'+
     '<div class="bar" style="width:'+(ours/mx*100)+'%;background:var(--acc)">With us: '+usd(ours)+'</div><div class="bar" style="width:'+(diy/mx*100)+'%;background:var(--acc2)">DIY: '+usd(diy)+'</div>'+
     '<div class="tbl"><table><tr><th>Item</th><th>DIY</th><th>With us</th></tr>'+rows.map(function(r){return"<tr><td>"+r[0]+"</td><td>"+r[1]+"</td><td>"+r[2]+"</td></tr>"}).join("")+"</table></div>"+
     '<div class="verdict">'+(sv>0?"Estimated benefit of booking with us: <b>"+usd(sv)+"</b> (about "+usd(sv/Math.max(p,1))+" per person), mostly from time saved and fewer costly surprises.":"On these inputs, arranging it yourself could be about <b>"+usd(-sv)+"</b> cheaper. Our value then lies in safety, visa support and on-trip help rather than price.")+" Rate used: 1 USD ≈ PKR "+window.__fx+" (unverified).</div>";
  }
  ["days","ppl","style","prem","hrs","hrv"].forEach(function(i){$(i).addEventListener("input",calc)});

  // payment tabs + sample reference
  document.querySelectorAll("[data-tab]").forEach(function(b){b.onclick=function(){
    document.querySelectorAll("[data-tab]").forEach(function(x){x.className=x===b?"":"alt"});
    document.querySelectorAll(".pane").forEach(function(p){p.classList.toggle("show",p.id==="p-"+b.dataset.tab)})}});
  $("mkref").onclick=function(){$("ref").textContent="BK-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-"+Math.random().toString(36).slice(2,6).toUpperCase()};


  // ---- sample price data (USD; illustrative placeholders) ----
  var cur="USD";
  function f(n){return n<10?String(+n.toFixed(2)):String(Math.round(n))}
  function R(lo,hi){var x=window.__fx||280,rg=hi!=null&&hi!==lo,g=function(n){return (Math.round(n*x/50)*50).toLocaleString()};return "PKR "+g(lo)+(rg?"–"+g(hi):"")+" (USD "+f(lo)+(rg?"–"+f(hi):"")+")"}
  var PK=[["City Culture Starter","5 days",450,"First-timers",["Lahore Walled City & Fort","Islamabad and Taxila","3-star hotels, breakfast","Car, driver and guide"]],
   ["Heritage & Sufi Trail","7 days",780,"History and pilgrims",["Lahore, Multan, Uch Sharif","Nankana Sahib visit option","Heritage-style stays","Car, driver and guide"]],
   ["Northern Mountains Classic","10 days",1150,"Scenery and photography",["Islamabad, Hunza, Skardu","Mountain lodges","4x4 with driver","Local registration help, weather flex days"]],
   ["Honeymoon Private","8 days",2400,"Couples",["Private car and guide","5-star and heritage stays","Four-course dinners","Flexible dates"]],
   ["Arrival Essentials (add-on)","Add to any trip",75,"Independent travellers",["Visa and invitation help","SIM and airport pickup","Day-one briefing"]]];
  var HT=[["Budget guesthouse","Cities and northern towns","Family-run guesthouses, hostels",25,45],["Mid-range (3-star)","Most cities","Local business hotels",55,95],["Upscale (4-star)","Islamabad, Lahore, Karachi","International and national chains",110,180],["Luxury (5-star)","Major cities","Large chain flagships (e.g. Pearl-Continental type)",220,420],["Heritage haveli / boutique","Lahore Walled City, Multan","Restored houses, small boutique stays",90,200],["Mountain lodge / fort hotel","Hunza, Skardu, Shigar","Lodges and heritage fort hotels (e.g. Serena type); peak season higher",60,150]];
  var ML=[["1 course","Street or local dhaba: karahi, biryani, naan, chai",2,5],["2 courses","Casual restaurant: main plus dessert or drink",7,14],["4 courses","Hotel or fine dining: starter, main, dessert, tea or coffee",25,50],["Bottled water (1.5 L)","Shops and restaurants",0.4,0.8]];
  var TR=[["Public","Metro Bus / Orange Line (Lahore, Islamabad–Rawalpindi)","Cheap city rides, busy at peak",0.2,0.6,"per ride"],["Public","Intercity coach (e.g. Lahore–Islamabad)","Scheduled and comfortable",8,18,"per seat"],["Public","Pakistan Railways intercity","AC classes, book early",5,40,"per seat"],["Public","Domestic flight (Islamabad–Skardu / Gilgit)","Weather-dependent, can change at short notice",70,160,"one way"],["Online","Ride-hailing apps (e.g. Careem, inDrive, Bykea)","City trips; needs local SIM",1.5,6,"per trip"],["Online","Pre-booked airport transfer","Fixed price, meet and greet",10,25,"per transfer"],["Rental","Car with driver (sedan)","City and motorway",60,110,"per day"],["Rental","SUV / 4x4 with driver","Northern roads",110,190,"per day"],["Rental","Van or coaster for groups","8–20 passengers",150,280,"per day"],["Rental","Self-drive","Rare and not advised for visitors; check licence rules",null,null,"–"]];
  var DAY=[["Budget",[25,12,25,8]],["Standard",[50,25,40,15]],["Comfort",[110,50,55,25]]],DC=["#2a4bb0","#e59a2f","#d4573b","#3a9bb0"],DL=["Stay","Meals","Transport","Activities"];
  function prices(){document.querySelectorAll(".fxv").forEach(function(x){x.textContent=window.__fx||280});
    var g="";PK.forEach(function(p,i){g+='<div class="card pk">'+(PKP[i]?'<div class="pic" data-photo="'+PKP[i]+'" data-art="'+PKA[i]+'"></div>':'')+'<h3>'+p[1]+' · '+p[3]+'</h3><b class="sans" style="font-size:18px">'+p[0]+'</b><div class="price">from '+R(p[2])+'</div><ul>'+p[4].map(function(x){return"<li>"+x+"</li>"}).join("")+'</ul><a class="cta" href="#/payments">Enquire</a></div>'});
    $("pk-grid").innerHTML=g;hydrate();
    var d='';DAY.forEach(function(r){var t=r[1].reduce(function(a,b){return a+b},0);d+='<div class="sans"><b>'+r[0]+'</b> · about '+R(t)+' per day</div><div class="stk">'+r[1].map(function(v,i){return'<i title="'+DL[i]+'" style="width:'+(v/t*100)+'%;background:'+DC[i]+'"></i>'}).join("")+'</div><div style="height:10px"></div>'});
    d+='<div class="key">'+DL.map(function(l,i){return'<span><b style="background:'+DC[i]+'"></b>'+l+'</span>'}).join("")+'</div>';
    $("daily").innerHTML=d;
    $("t-hotel").innerHTML='<tr><th>Type</th><th>Where</th><th>Examples</th><th>Per night</th></tr>'+HT.map(function(r){return"<tr><td><b>"+r[0]+"</b></td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+R(r[3],r[4])+"</td></tr>"}).join("");
    $("t-meal").innerHTML='<tr><th>Meal</th><th>What to expect</th><th>Per person</th></tr>'+ML.map(function(r){return"<tr><td><b>"+r[0]+"</b></td><td>"+r[1]+"</td><td>"+R(r[2],r[3])+"</td></tr>"}).join("");
    $("t-trans").innerHTML='<tr><th>Type</th><th>Option</th><th>Notes</th><th>Sample price</th></tr>'+TR.map(function(r){return"<tr><td><b>"+r[0]+"</b></td><td>"+r[1]+"</td><td>"+r[2]+"</td><td>"+(r[3]==null?"Check rules":R(r[3],r[4])+" "+r[5])+"</td></tr>"}).join("");
    document.querySelectorAll("[data-cur] button").forEach(function(b){b.className=b.dataset.c===cur?"":"alt"});
  }
  document.querySelectorAll("[data-cur] button").forEach(function(b){b.onclick=function(){cur=b.dataset.c;prices()}});
  // theme: system / light / dark (remembered when storage is available)
  var tb=$("themeBtn"),TM=["system","light","dark"],TI={system:"auto",light:"sun",dark:"moon"},tm="system";
  function setTheme(m){tm=m;var r=document.documentElement;if(m==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",m);tb.innerHTML='<svg class="ic"><use href="#ic-'+TI[m]+'"/></svg>';setTimeout(adapt,30);setTimeout(adapt,450);tb.title="Theme: "+m;tb.setAttribute("aria-label","Theme: "+m+". Tap to change.")}
  try{tm=localStorage.getItem("theme")||"system"}catch(e){}
  setTheme(TM.indexOf(tm)>-1?tm:"system");
  tb.onclick=function(){var n=TM[(TM.indexOf(tm)+1)%3];setTheme(n);try{localStorage.setItem("theme",n)}catch(e){}};
  // ---- photos: put files in images/ (name.jpg). Missing files fall back to the illustration. ----
  var IMG={};/*IMGDATA*/
  var PH={"badshahi-mosque":"Badshahi Mosque, Lahore","lahore-fort":"Lahore Fort","hunza-valley":"Hunza Valley","skardu-lakes":"Skardu and its lakes","fairy-meadows":"Fairy Meadows and Nanga Parbat","street-food":"Street food and chai"};
  var PKP=["lahore-fort","badshahi-mosque","hunza-valley","skardu-lakes",null],PKA=["arch","dome","mtn","mtn",null];
  function hydrate(){document.querySelectorAll(".pic[data-photo]:not([data-done])").forEach(function(p){p.dataset.done=1;var k=p.dataset.photo;p.innerHTML='<svg><use href="#i-'+(p.dataset.art||"mtn")+'"/></svg><img src="'+(IMG[k]||"images/"+k+".jpg")+'" alt="'+(PH[k]||k)+'" loading="lazy">';p.querySelector("img").onerror=function(){this.remove()}})}
  var GL=[["badshahi-mosque","dome"],["lahore-fort","arch"],["hunza-valley","mtn"],["skardu-lakes","mtn"],["fairy-meadows","mtn"],["street-food","arch"]];
  $("gal").innerHTML=GL.map(function(g){return'<figure><div class="pic" data-photo="'+g[0]+'" data-art="'+g[1]+'"></div><figcaption>'+PH[g[0]]+'</figcaption></figure>'}).join("");
  // ---- automatic text colour: pick light or dark text from the actual background behind it ----
  var INK="#1e2142",AUTO="header.top,nav a,.tools button,.cta,#banner,footer,.card,.bar,.verdict,.warnbox,dialog,button";
  function px(c){var m=c.match(/[\d.]+/g)||[];return m.map(Number)}
  function L(c){var v=c.slice(0,3).map(function(x){x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*v[0]+.7152*v[1]+.0722*v[2]}
  function bg(el){while(el){var c=px(getComputedStyle(el).backgroundColor);if(c.length>=3&&(c.length<4||c[3]>.5))return c;el=el.parentElement}return[255,255,255]}
  var LI=L(px("rgb(30,33,66)"));
  function adapt(){document.querySelectorAll(AUTO).forEach(function(el){var l=L(bg(el)),cw=1.05/(l+.05),cd=(l+.05)/(LI+.05);el.style.color=cw>=cd?"#fff":INK})}
  var pend=0;function later(){if(pend)return;pend=1;requestAnimationFrame(function(){pend=0;adapt()})}
  new MutationObserver(later).observe(document.body,{childList:true,subtree:true});
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){setTimeout(adapt,450)});
  window.addEventListener("hashchange",later);
  window.__fx=280;route();calc();prices();hydrate();adapt();
  loadData().then(function(d){render(d);calc();prices()});
})();
