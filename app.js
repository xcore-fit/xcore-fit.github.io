const CONFIG={
  endpoint:'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId:'233915bf-25f6-4119-9362-701fe3212185',
  sku:'BISHT-ROYAL',
  receiverSku:'MULTI-COLLAGEN', // routing identifier used by the existing receiver
  orderSku:'BISHT-ROYAL',
  product:'بشت التميز الملكي',
  offers:{
    1:{label:'بشت واحد',price:296,backendOffer:1},
    2:{label:'2 بشت — واحد لك والثاني لشخص عزيز عليك',price:458,backendOffer:2}
  }
};

(function initSnap(){
  if(!CONFIG.snapPixelId)return;
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
  window.snaptr('init',CONFIG.snapPixelId);
  window.snaptr('track','PAGE_VIEW',{item_ids:[CONFIG.sku],item_category:'BISHT'});
})();

const form=document.getElementById('order-form');
const total=document.getElementById('summary-total');
const offerSummary=document.getElementById('summary-offer');
const status=document.getElementById('form-message');
const sticky=document.getElementById('sticky-cta');
const checkoutSection=document.getElementById('checkout');
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
  window.snaptr('track','START_CHECKOUT',{price:o.price,currency:'SAR',item_ids:[CONFIG.sku],item_category:'BISHT',number_items:o.code});
}
form.addEventListener('change',()=>{updateSummary();trackCheckout()});
const phoneField=form.elements.phone;
const phoneErrorEl=document.getElementById('phone-error');
if(phoneField){
  phoneField.addEventListener('input',()=>{
    phoneField.removeAttribute('aria-invalid');
    if(phoneErrorEl)phoneErrorEl.textContent='';
    if(status.textContent.includes('رقم الهاتف'))status.textContent='';
  });
}
form.addEventListener('focusin',trackCheckout,{once:true});
updateSummary();

function normalizeSaudiPhone(v){
  let value=String(v||'').trim()
    .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[\s()\-\u200e\u200f\u061c]/g,'');
  if(value.startsWith('+966'))value='0'+value.slice(4);
  else if(value.startsWith('00966'))value='0'+value.slice(5);
  else if(value.startsWith('966'))value='0'+value.slice(3);
  else if(/^5\d{8}$/.test(value))value='0'+value;
  return /^05\d{8}$/.test(value)?value:null;
}
function utmObject(o){
  const q=Object.fromEntries(new URLSearchParams(window.location.search));
  return {
    utm_source:q.utm_source||'xcorefit-bisht',
    utm_medium:q.utm_medium||'landing',
    utm_campaign:q.utm_campaign||'bisht-royal',
    utm_term:q.utm_term||(o.code===1?'1-bisht':'2-bisht'),
    utm_content:q.utm_content||'xcore-fit.github.io'
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
  const phoneInput=form.elements.phone;
  const phoneError=document.getElementById('phone-error');
  const phone=normalizeSaudiPhone(fd.get('phone'));
  const address=String(fd.get('address')||'').trim();
  const o=currentOffer();
  if(name.length<2){status.textContent='يرجى كتابة الاسم الكامل.';return}
  if(!phone){
    status.textContent='';
    if(phoneError) phoneError.textContent='رقم الهاتف غير صحيح';
    phoneInput.setAttribute('aria-invalid','true');
    phoneInput.focus();
    return;
  }
  if(phoneError) phoneError.textContent='';
  phoneInput.removeAttribute('aria-invalid');
  if(address.length<2){status.textContent='يرجى كتابة المدينة.';return}
  const btn=form.querySelector('.submit-btn');
  btn.disabled=true;btn.textContent='جارٍ إرسال طلبك…';
  const tx='BISHT-'+Date.now()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();

  /* The existing receiver validates a known backend offer code.
     Actual bisht product/price are stored in UTM fields and surfaced in the dedicated BISHT ORDERS sheet. */
  const payload={
    transactionId:tx,
    product:CONFIG.product,
    name,
    phone,
    address,
    offerCode:o.backendOffer,
    offer:o.label,
    // Keep the displayed/selected offer price authoritative for the receiver.
    // Multiple explicit aliases are intentional: the legacy receiver may read
    // one of these names when writing the order into Google Sheets.
    price:o.price,
    unitPrice:o.price,
    totalPrice:o.price,
    orderTotal:o.price,
    amount:o.price,
    sellingPrice:o.price,
    offerPrice:o.price,
    country:'SA',
    sku:CONFIG.orderSku,
    receiverSku:CONFIG.receiverSku,
    productSku:CONFIG.sku,
    currency:'SAR',
    pageUrl:window.location.href,
    source:'XCORE FIT Bisht Landing Page',
    utm:utmObject(o)
  };

  try{
    const body=JSON.stringify(payload);
    let queued=false;

    /* sendBeacon queues the order immediately and avoids making the customer
       wait for Google Apps Script to finish responding. This is especially
       useful inside Snapchat's in-app browser. */
    if(navigator.sendBeacon){
      try{
        queued=navigator.sendBeacon(
          CONFIG.endpoint,
          new Blob([body],{type:'text/plain;charset=utf-8'})
        );
      }catch(_){}
    }

    if(!queued){
      if(navigator.onLine===false)throw new Error('offline');
      /* Fallback for browsers where sendBeacon is unavailable/rejected. */
      fetch(CONFIG.endpoint,{
        method:'POST',
        mode:'no-cors',
        keepalive:true,
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body
      }).catch(()=>{});
    }

    if(window.snaptr){
      window.snaptr('track','PURCHASE',{
        price:o.price,currency:'SAR',transaction_id:tx,item_ids:[CONFIG.sku],item_category:'BISHT',number_items:o.code
      });
    }

    btn.disabled=true;
    btn.textContent='تم استلام طلبك ✓';
    status.textContent='تم استلام طلبك. سنتواصل معك للتأكيد قبل الشحن.';
    if(sticky)sticky.classList.add('is-hidden');

    /* Show the confirmation immediately after the order has been queued. */
    showSuccessConfirmation(o);
  }catch(err){
    btn.disabled=false;
    btn.textContent='تأكيد الطلب — الدفع عند الاستلام';
    status.textContent='تعذر إرسال الطلب الآن. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
    status.scrollIntoView({behavior:'smooth',block:'center'});
  }
});

if(sticky&&checkoutSection){
  const updateStickyVisibility=()=>{
    const rect=checkoutSection.getBoundingClientRect();
    const viewport=window.visualViewport?window.visualViewport.height:window.innerHeight;
    const checkoutIsActive=rect.top<=viewport*0.92 && rect.bottom>=80;
    sticky.classList.toggle('is-hidden',checkoutIsActive);
  };

  window.addEventListener('scroll',updateStickyVisibility,{passive:true});
  window.addEventListener('resize',updateStickyVisibility,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',updateStickyVisibility,{passive:true});
    window.visualViewport.addEventListener('scroll',updateStickyVisibility,{passive:true});
  }
  requestAnimationFrame(updateStickyVisibility);
}


/* Reliable CTA-to-checkout navigation.
   Snapchat's in-app browser can resolve a first anchor click before deferred
   sections finish their layout. Use an immediate absolute scroll and re-check
   the target after layout settles so the first tap always lands at the start
   of the complete order area. */
function scrollToOrderStart(){
  const target=document.getElementById('order');
  if(!target)return;
  const top=Math.max(0,window.pageYOffset+target.getBoundingClientRect().top-8);
  window.scrollTo({top,left:0,behavior:'auto'});
}
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href="#order"]');
  if(!link)return;
  event.preventDefault();
  scrollToOrderStart();
  requestAnimationFrame(()=>requestAnimationFrame(scrollToOrderStart));
  setTimeout(scrollToOrderStart,180);
  setTimeout(scrollToOrderStart,480);
},{capture:true});
