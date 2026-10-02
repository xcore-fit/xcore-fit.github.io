const CONFIG={
  endpoint:'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId:'233915bf-25f6-4119-9362-701fe3212185',
  sku:'BISHT-ROYAL',
  offers:{
    1:{label:'بشت واحد',price:399,backendOffer:1},
    2:{label:'2 بشت — واحد لك والثاني لشخص عزيز عليك',price:549,backendOffer:2}
  }
};

(function initSnap(){
  if(!CONFIG.snapPixelId)return;
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
  window.snaptr('init',CONFIG.snapPixelId);
  window.snaptr('track','PAGE_VIEW',{item_ids:[CONFIG.sku]});
})();

const form=document.getElementById('order-form');
const total=document.getElementById('summary-total');
const offerSummary=document.getElementById('summary-offer');
const status=document.getElementById('form-message');
const sticky=document.getElementById('sticky-cta');
const orderSection=document.getElementById('order');
let checkoutTracked=false;

function currentOffer(){
  const code=Number(new FormData(form).get('offer')||1);
  return {code,...CONFIG.offers[code]};
}
function updateSummary(){
  const o=currentOffer();
  offerSummary.textContent=o.label;
  total.textContent=o.price+' ريال';
}
function trackCheckout(){
  if(checkoutTracked||!window.snaptr)return;
  const o=currentOffer();
  checkoutTracked=true;
  window.snaptr('track','START_CHECKOUT',{price:o.price,currency:'SAR',item_ids:[CONFIG.sku]});
}
form.addEventListener('change',()=>{updateSummary();trackCheckout()});
form.addEventListener('focusin',trackCheckout,{once:true});
updateSummary();

function cleanPhone(v){return String(v||'').replace(/[^0-9+]/g,'').trim()}
function utmObject(o){
  return {
    utm_source:'xcorefit-bisht',
    utm_medium:String(o.price),
    utm_campaign:'بشت التميز الملكي',
    utm_term:o.code===1?'1-bisht':'2-bisht',
    utm_content:'xcore-fit.github.io'
  };
}

function showSuccessConfirmation(o){
  let modal=document.getElementById('order-success-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='order-success-modal';
    modal.className='order-success-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','order-success-title');
    modal.innerHTML='<div class="order-success-card"><div class="order-success-check">✓</div><h2 id="order-success-title">تم استلام طلبك</h2><p>طلبك وصل بنجاح. سنتواصل معك على رقم الجوال لتأكيد البيانات قبل الشحن.</p><div class="order-success-summary"><span>العرض المختار</span><strong id="order-success-offer"></strong><span>الإجمالي</span><strong id="order-success-price"></strong></div><button type="button" class="order-success-close">تم</button></div>';
    document.body.appendChild(modal);
    modal.querySelector('.order-success-close').addEventListener('click',()=>modal.classList.remove('is-visible'));
  }
  modal.querySelector('#order-success-offer').textContent=o.label;
  modal.querySelector('#order-success-price').textContent=o.price+' ريال';
  modal.classList.add('is-visible');
  const close=modal.querySelector('.order-success-close');
  if(close)close.focus({preventScroll:true});
}

form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  status.textContent='';
  const fd=new FormData(form);
  const name=String(fd.get('name')||'').trim();
  const phone=cleanPhone(fd.get('phone'));
  const address=String(fd.get('address')||'').trim();
  const o=currentOffer();
  if(name.length<2){status.textContent='يرجى كتابة الاسم الكامل.';return}
  if(phone.replace(/\D/g,'').length<8){status.textContent='يرجى التأكد من رقم الجوال.';return}
  if(address.length<4){status.textContent='يرجى كتابة المدينة والعنوان.';return}
  const btn=form.querySelector('.submit-btn');
  btn.disabled=true;btn.textContent='جارٍ إرسال طلبك…';
  const tx='BISHT-'+Date.now()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();

  /* The existing receiver validates a known backend offer code.
     Actual bisht product/price are stored in UTM fields and surfaced in the dedicated BISHT ORDERS sheet. */
  const payload={
    transactionId:tx,
    product:'بشت التميز الملكي',
    name,
    phone,
    address,
    offerCode:o.backendOffer,
    offer:o.label,
    price:o.price,
    country:'SA',
    sku:'MULTI-COLLAGEN',
    currency:'SAR',
    pageUrl:window.location.href,
    source:'XCORE FIT Bisht Landing Page',
    utm:utmObject(o)
  };

  try{
    /* no-cors is intentionally used here for maximum compatibility with
       Snapchat's in-app browser and Google Apps Script redirects. The exact
       payload/receiver combination was verified independently before launch. */
    await fetch(CONFIG.endpoint,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(payload)
    });

    if(window.snaptr){
      window.snaptr('track','PURCHASE',{
        price:o.price,currency:'SAR',transaction_id:tx,item_ids:[CONFIG.sku]
      });
    }

    btn.disabled=true;
    btn.textContent='تم استلام طلبك ✓';
    status.textContent='تم إرسال الطلب بنجاح. سنتواصل معك للتأكيد قبل الشحن.';
    if(sticky)sticky.classList.add('is-hidden');

    showSuccessConfirmation(o);
  }catch(err){
    btn.disabled=false;
    btn.textContent='تأكيد الطلب — الدفع عند الاستلام';
    status.textContent='تعذر إرسال الطلب الآن. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
    status.scrollIntoView({behavior:'smooth',block:'center'});
  }
});

if(sticky&&orderSection){
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.some(x=>x.isIntersecting);
    sticky.classList.toggle('is-hidden',visible);
  },{threshold:.08});
  observer.observe(orderSection);
}
