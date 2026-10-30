
const SPREADSHEET_ID = '1z06hEE83QGVQbKH19_GNf9XB4JP2hOv1nCnBLbG_ooI';

const SHEET_NAME = 'Feuil1';
const XCORE_SHEET_NAME = 'X-CORE';
const VYRQON_SHEET_NAME = 'VYRQON';

const XCORE_SKU = 'XCORE-POWER-FIT';
const BISHT_SKU = 'BISHT-ROYAL';
const BISHT_SHEET_NAME = 'BISHT ORDERS';
const VYRQON_SKU = 'VYRQON-RGB-CAR-LIGHTS';
const UAE_SHILAJIT_SKU = 'SHILAJIT';

const PRODUCTS = {
  'MULTI-COLLAGEN': {
    product: 'Multi Collagen Peptides',
    packages: {
      1: { label: '1 عبوة — تكفيك شهر', price: 189, quantity: 1 },
      2: { label: '2 عبوة — تكفيك شهرين', price: 249, quantity: 2 },
      3: { label: '3 عبوات — تكفيك 3 أشهر', price: 290, quantity: 3 }
    }
  },

  'COSMA-COLLAGEN': {
    product: 'Cosma Collagen',
    packages: {
      1: { label: 'باقة البداية — 1 عبوة / 30 حصة', price: 185, quantity: 1 },
      2: { label: 'باقة التوفير — 2 عبوة / 60 حصة', price: 249, quantity: 2 },
      3: { label: 'الباقة الذهبية — 3 عبوات / 90 حصة', price: 290, quantity: 3 }
    }
  },

  'RENIVA': {
    product: 'RENIVA® Instant Hair Thickener',
    packages: {
      1: { label: 'باقة البداية — 1 عبوة · شهران', price: 169, quantity: 1 },
      2: { label: 'باقة النتيجة الأفضل — 2 عبوة · 4 أشهر', price: 199, quantity: 2 },
      3: { label: 'باقة العناية الكاملة — 3 عبوات · 6 أشهر', price: 219, quantity: 3 }
    }
  },

  // المنتج السعودي القديم: أُبقيت أسعاره كما هي.
  'GOOGEER-SHILAJIT-100G': {
    product: 'Googeer Himalayan Shilajit',
    packages: {
      1: { label: 'عبوة واحدة', price: 198, quantity: 1 },
      2: { label: 'عبوتان', price: 288, quantity: 2 },
      3: { label: '3 عبوات', price: 324, quantity: 3 }
    }
  },

  // GOOGEEER UAE فقط.
  'SHILAJIT': {
    product: 'Googeer Himalayan Shilajit — GOOGEEER UAE',
    packages: {
      1: { label: 'عبوة واحدة', price: 194, quantity: 1 },
      2: { label: 'عبوتان', price: 249, quantity: 2 },
      3: { label: '3 عبوات', price: 279, quantity: 3 }
    }
  },

  'LUMBAR-GEL-20G': {
    product: 'Lumbar Spine Cooling Gel (20g)',
    packages: {
      1: { label: 'عبوة واحدة — 20g', price: 173, quantity: 1 },
      2: { label: 'عبوتان — 40g', price: 198, quantity: 2 },
      3: { label: '3 عبوات — 60g', price: 218, quantity: 3 }
    }
  },

  'BISHT-ROYAL': {
    product: 'بشت التميز الملكي',
    packages: {
      1: { label: 'بشت واحد', price: 296, quantity: 1 },
      2: { label: '2 بشت — واحد لك والثاني لشخص عزيز عليك', price: 458, quantity: 2 }
    }
  },

  'XCORE-POWER-FIT': {
    product: 'مشد القوة من X-CORE',
    packages: {
      1: { label: 'قطعة واحدة — مشد القوة X-CORE', price: 279, quantity: 1 },
      2: { label: 'قطعتان — مشد القوة X-CORE', price: 439, quantity: 2 }
    }
  },

  'VYRQON-RGB-CAR-LIGHTS': {
    product: 'VYRQON RGB Car Interior Lights',
    packages: {
      1: { label: 'قطعتان — 178 ريال', price: 178, quantity: 2 },
      2: { label: '4 قطع — 199 ريال', price: 199, quantity: 4 },
      3: { label: '6 قطع — 219 ريال', price: 219, quantity: 6 }
    }
  }
};

const REQUIRED_HEADERS = [
  'OrderDate', 'country', 'name', 'phone', 'address', 'url',
  'sku', 'Product', 'quantity', 'price', 'currency', 'notes',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
  'utm_content', 'national_address', 'transaction_id', 'duration',
  'source', 'city', 'snap_click_id'
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'Order API',
    status: 'online',
    timestamp: new Date().toISOString(),
    supportedProducts: Object.keys(PRODUCTS)
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lock.waitLock(15000);
    lockAcquired = true;

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('لم يتم استلام بيانات POST');
    }

    const order = JSON.parse(e.postData.contents);

    const normalizeSku = function(value) {
      return String(value || '').trim().toUpperCase();
    };

    const productSku = normalizeSku(order.productSku);
    const orderSku = normalizeSku(order.orderSku);
    const submittedSku = normalizeSku(order.sku);

    let sku;

    if (
      productSku === VYRQON_SKU ||
      orderSku === VYRQON_SKU ||
      submittedSku === VYRQON_SKU
    ) {
      sku = VYRQON_SKU;
    } else if (
      productSku === XCORE_SKU ||
      orderSku === XCORE_SKU ||
      submittedSku === XCORE_SKU
    ) {
      sku = XCORE_SKU;
    } else {
      sku = submittedSku || productSku || orderSku;
    }

    if (!sku) throw new Error('SKU مفقود');

    const productConfig = PRODUCTS[sku];
    if (!productConfig) {
      throw new Error('المنتج غير صالح: ' + sku);
    }

    const offerCode = Number(order.offerCode);
    const selected = productConfig.packages[offerCode];

    if (!selected) throw new Error('العرض غير صالح');

    const transactionId = String(
      order.transactionId ||
      order.transaction_id ||
      order.clientOrderId ||
      ''
    ).trim();

    if (!transactionId) {
      throw new Error('transaction_id مفقود');
    }

    ['name', 'phone'].forEach(function(key) {
      if (!String(order[key] || '').trim()) {
        throw new Error('بيانات الطلب ناقصة: ' + key);
      }
    });

    const submittedAddress = String(order.address || '').trim();

    if (sku !== VYRQON_SKU && !submittedAddress) {
      throw new Error('بيانات الطلب ناقصة: address');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);

    let targetSheetName = SHEET_NAME;

    if (sku === BISHT_SKU) {
      targetSheetName = BISHT_SHEET_NAME;
    } else if (sku === XCORE_SKU) {
      targetSheetName = XCORE_SHEET_NAME;
    } else if (sku === VYRQON_SKU) {
      targetSheetName = VYRQON_SHEET_NAME;
    }

    let sheet = spreadsheet.getSheetByName(targetSheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(targetSheetName);
    }

    ensureHeaders(sheet);

    const headers = getHeaders(sheet);
    const transactionColumn = headers.indexOf('transaction_id') + 1;

    // منع تسجيل معرّف الطلب نفسه مرتين في الورقة المستهدفة.
    if (transactionColumn > 0 && sheet.getLastRow() > 1) {
      const values = sheet.getRange(
        2,
        transactionColumn,
        sheet.getLastRow() - 1,
        1
      ).getDisplayValues().flat().map(function(value) {
        return String(value).trim();
      });

      if (values.includes(transactionId)) {
        return jsonResponse({
          ok: true,
          duplicate: true,
          transactionId: transactionId,
          sku: sku,
          product: productConfig.product,
          offerCode: offerCode,
          quantity: selected.quantity,
          price: selected.price,
          currency: sku === UAE_SHILAJIT_SKU
            ? 'AED'
            : (order.currency || 'SAR'),
          sheet: targetSheetName
        });
      }
    }

    function safe(value) {
      const text = String(value == null ? '' : value).trim();
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    }

    const utm = order.utm || {};

    const snapClickId = safe(
      utm.sc_click_id ||
      utm.snap_click_id ||
      order.sc_click_id ||
      order.snapClickId ||
      order.snap_click_id ||
      ''
    );

    const address = safe(submittedAddress);

    // إعدادات افتراضية حسب المنتج؛ لا تغيّر إعدادات بقية المنتجات.
    const defaultCountry = sku === UAE_SHILAJIT_SKU ? 'AE' : 'SA';
    const defaultCurrency = sku === UAE_SHILAJIT_SKU ? 'AED' : 'SAR';

    const country = sku === UAE_SHILAJIT_SKU
      ? 'AE'
      : (order.country || defaultCountry);

    const currency = sku === UAE_SHILAJIT_SKU
      ? 'AED'
      : (order.currency || defaultCurrency);

    const rowData = {
      OrderDate: new Date(),
      country: safe(country),
      name: safe(order.name),
      phone: safe(order.phone),
      address: address,
      url: safe(order.pageUrl || order.url || ''),
      sku: safe(sku),
      Product: safe(productConfig.product),
      quantity: selected.quantity,
      price: selected.price,
      currency: safe(currency),
      notes: safe('الدفع عند الاستلام — ' + selected.label),
      utm_source: safe(utm.utm_source || order.utm_source || ''),
      utm_medium: safe(utm.utm_medium || order.utm_medium || ''),
      utm_campaign: safe(utm.utm_campaign || order.utm_campaign || ''),
      utm_term: safe(utm.utm_term || order.utm_term || ''),
      utm_content: safe(utm.utm_content || order.utm_content || ''),
      national_address: safe(order.national_address || address),
      transaction_id: safe(transactionId),
      duration: safe(order.duration || ''),
      source: safe(order.source || ''),
      city: safe(order.city || ''),
      snap_click_id: snapClickId
    };

    const finalHeaders = getHeaders(sheet);

    const row = finalHeaders.map(function(header) {
      return Object.prototype.hasOwnProperty.call(rowData, header)
        ? rowData[header]
        : '';
    });

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return jsonResponse({
      ok: true,
      duplicate: false,
      transactionId: transactionId,
      sku: sku,
      product: productConfig.product,
      offerCode: offerCode,
      quantity: selected.quantity,
      price: selected.price,
      currency: currency,
      country: country,
      sheet: targetSheetName
    });

  } catch (error) {
    console.error(error);

    return jsonResponse({
      ok: false,
      error: String(error.message || error)
    });

  } finally {
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (error) {
        console.error(error);
      }
    }
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(
      1,
      1,
      1,
      REQUIRED_HEADERS.length
    ).setValues([REQUIRED_HEADERS]);

    sheet.setFrozenRows(1);
    return;
  }

  const headers = getHeaders(sheet);

  const missing = REQUIRED_HEADERS.filter(function(header) {
    return !headers.includes(header);
  });

  if (missing.length > 0) {
    sheet.getRange(
      1,
      headers.length + 1,
      1,
      missing.length
    ).setValues([missing]);
  }

  sheet.setFrozenRows(1);
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return [];

  return sheet.getRange(
    1,
    1,
    1,
    lastColumn
  ).getValues()[0].map(function(value) {
    return String(value).trim();
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}