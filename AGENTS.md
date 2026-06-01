# AGENTS.md — Jouda System Reference

> المرجِع التقني الوحيد لأي Agent أو مطور يعدّل على النظام.
> اقرأه بالكامل قبل أي تعديل — وحدثه بعد كل تغيير جوهري.

---

## 1. هيكل المشاريع

النظام يتكون من **مشروعين Supabase**:

| المشروع | الـ Project ID | الوصف |
|---------|---------------|-------|
| **JoudaApp** | `unsqyovqzsgmxacrqunh` | تطبيق العميل (PWA) + دوال البوت + تزامن المنتجات |
| **JoudaStockManager (Inventory)** | `tfecwguylsxbfknrxrlx` | نظام المخزون (POS) — الفواتير، المنتجات، المحصلين، المستودعات |

---

## 2. دوال Edge Function

كل الدوال موجودة في `supabase/functions/telegram-bot/` وتُنشر معاً.

| الدالة | Slug | JWT | الغرض |
|--------|------|-----|-------|
| **telegram-bot** | `telegram-bot` | ❌ `false` | بوت تيليجرام — يستقبل Webhooks + أوامر + أزرار |
| **submit-order** | `submit-order` | ✅ `true` | استقبال طلبات تطبيق الجوال + إرسال إشعار تيليجرام |
| **sync-products** | `sync-products` | ❌ `false` | مزامنة منتجات المخزون ← JoudaApp كل 10 دقائق |

### ملفات telegram-bot (Clean Architecture — 10 ملفات)

**الطبقة الأساسية (Base Layer):**

| الملف | المحتوى |
|-------|---------|
| `config.ts` | متغيرات البيئة + ثوابت الحالات + دالة `isAdmin()` |
| `db.ts` | `getClients()` — مصدر واحد لعملاء Supabase (jouda + inventory) |
| `telegram.ts` | دوال Telegram API: `sendMessage`, `editMessage`, `answerCallback` |
| `format.ts` | `fmtDate()`, `formatPhone()`, `whatsappButton()`, `paymentLabel()` |
| `workflow.ts` | آلة الحالة (State Machine) لـ `wf_*` و `inv_*` + بناء الأزرار |

**طبقة المعالجات (Handler Layer):**

| الملف | المحتوى |
|-------|---------|
| `commands.ts` | 3 أوامر نصية: `/help`, `/orders`, `/status` |
| `wf-callbacks.ts` | معالج أزرار طلبات التطبيق (`wf_*`): approve, reject, reserve, prepare, deliver, paid, deposit, cancel |
| `inv-callbacks.ts` | معالج أزرار فواتير POS (`inv_*`): reserve, prepare, deliver, paid, deposit, reverse |
| `incoming.ts` | استقبال فواتير POS من المخزون + إرسالها للمجموعة |

**طبقة التوجيه (Router Layer):**

| الملف | المحتوى |
|-------|---------|
| `index.ts` | نقطة الدخول — Auth + Route فقط (لا يحتوي على business logic) |

---

## 3. تدفق البيانات

### المسار A — فاتورة POS (مخزون)

```
نظام POS → Inventory (invoices INSERT)
    → Database Webhook (pg_net, x-webhook-secret)
    → telegram-bot (handleNewInvoice)
    → customer_orders INSERT (status=submitted)
    → إرسال للمجموعة مع inv_* أزرار
```

### المسار B — طلب تطبيق جودة

```
تطبيق الجوال → submit-order (JWT)
    → Inventory (create_quotation RPC) — حجز مخزون
    → JoudaApp (customer_orders INSERT — service_role)
    → إشعار تيليجرام للمدير فقط (مع wf_approve_ زر)
```

### المسار C — اعتماد المدير للطلب

```
مدير يضغط "اعتماد الطلب" (wf_approve_)
    → تحديث status = confirmed
    → إرسال الطلب للمجموعة مع wf_* أزرار (حجز، تجهيز، توصيل...)
```

### المسار D — مزامنة المنتجات

```
pg_cron (كل 10 دقائق) → net.http_post
    → sync-products (WEBHOOK_SECRET)
    → Inventory: products + product_stock_summary
    → JoudaApp: products upsert + sync_logs INSERT
```

---

## 4. قاعدة البيانات (JoudaApp)

### جداول + RLS

| الجدول | RLS | من يقرأ | من يكتب |
|--------|-----|---------|---------|
| `app_settings` | ✅ | service_role فقط | service_role فقط |
| `app_settings_public` (view) | ✅ | anon, authenticated (صيانة فقط) | — |
| `customer_orders` | ✅ | service_role فقط | service_role فقط |
| `order_items` | ✅ | service_role فقط | service_role فقط |
| `products` | ✅ | anon, authenticated (is_active=true) | service_role فقط |
| `sync_logs` | ✅ | service_role فقط | service_role فقط |
| `recipes, articles, banners, faq` | ✅ | عامة | service_role فقط |

### ملاحظات
- `admin_pin` لا يزال موجوداً في `app_settings.admin_pin` لكنه **غير مقروء** للعامة. قيمته الحالية: `0000` (يجب تغييرها لاحقاً).
- `pg_net` extension موجودة في `extensions` schema (نُقلت من `public`).
- لا تستخدم `anon key` في دوال Edge Function للكتابة — دائماً `service_role`.

---

## 5. قواعد العمل (Business Logic)

### حسابات المحصلين
- المبلغ = `subtotal` — `discount` (بدون delivery_fee)
- الفواتير المضمنة: `status = POSTED` فقط، `is_voided = false`
- يُستبعد: `role = admin` أو `name = Manager` من تقارير المحصلين
- الكاش فقط (`payment_method = CASH`)

### تسلسل Workflow لفواتير POS (inv_*)

```
pending → حجز reserve → تجهيز prepare → توصيل deliver → استلام paid → ايداع deposit
                 ↘ عكس reverse (مدير فقط)
```

### تسلسل Workflow لطلبات التطبيق (wf_*)

```
submitted → اعتماد (approve) confirmed → حجز reserved → تجهيز preparing → توصيل delivered → استلام paid → ايداع deposited
           ↘ رفض (reject) cancelled
```

### الحالات الخاصة
- الإيداع والعكس: مدير فقط
- العكس: يرجع المخزون ويلغي القيد المالي
- تحويل التسعيرة لفاتورة: `convert_quotation_to_invoice` RPC (خصم مخزون)

---

## 6. اتفاقيات الكود

### عام
- TypeScript + Deno runtime (Supabase Edge Functions)
- المكتبات: `jsr:@supabase/supabase-js@2`
- parse_mode: `HTML` (تيليجرام)

### رسائل تيليجرام
- اللغة: العربية
- التنسيق: `<b>غامق</b>`, `<code>كود</code>`, `<i>مائل</i>`
- التواريخ: صيغة 12 ساعة ميلادي — `2026-05-22 5:30 م`
- دالة التاريخ: `fmtDate()` في `utils.ts` — تستخدم في كل النصوص
- لا تستخدم `toLocaleString('ar-SA')` أبداً — ينتج تاريخ هجري

### صيغ Callback Data
| النوع | الصيغة | مثال |
|-------|--------|------|
| فواتير POS | `inv_{action}_{invoiceId}` | `inv_reserve_INV-JRF-2026-000056` |
| فريق العمل | `wf_{action}_{orderId}` | `wf_prepare_uuid-here` |
| طلبات قديم | `order_{newStatus}_{orderId}` | `order_confirmed_uuid-here` |

**حدود callback_data**: ماكس 64 حرف. لو زاد الطول → `BUTTON_DATA_INVALID`.

### أزرار الكيبورد
- فواتير POS: كل زر في صف لحاله (6 صفوف)
- طلبات التطبيق (فريق): كل زر في صف لحاله (6 صفوف)
- أزرار الاعتماد: زرّين في صف واحد (اعتماد + رفض)

---

## 7. متغيرات البيئة المطلوبة

### telegram-bot + sync-products

| المتغير | الغرض |
|---------|-------|
| `TELEGRAM_BOT_TOKEN` | توكن بوت تيليجرام |
| `TELEGRAM_ADMIN_CHAT_ID` | أرقام المديرين (مفصولة بفاصلة) |
| `TELEGRAM_GROUP_CHAT_ID` | أرقام المجموعات (مفصولة بفاصلة) |
| `SUPABASE_URL` | رابط JoudaApp |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح service_role لـ JoudaApp |
| `INVENTORY_SUPABASE_URL` | رابط مشروع المخزون |
| `INVENTORY_SERVICE_ROLE_KEY` | مفتاح service_role للمخزون |
| `SYSTEM_USER_UUID` | UUID المستخدم الآلي للنظام |
| `WEBHOOK_SECRET` | كلمة سر للـ Webhook (لغير تيليجرام) |

### submit-order (إضافية)

| المتغير | الغرض |
|---------|-------|
| `SUPABASE_ANON_KEY` | لقراءة وضع الصيانة |
| `ONLINE_WAREHOUSE_ID` | معرف المستودع للطلبات الآونلاين |

### تلقائي (لا تحتاج إضافة)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

---

## 8. الأمان

### نموذج التوثيق
- **تيليجرام**: يرسل `update_id` — يمرر تلقائياً (ما يقدر يرسل JWT)
- **Webhooks + Cron**: يتحقق من `x-webhook-secret` header
- **submit-order**: يستخدم JWT (العميل يرسله)

### نظام RLS
- كل جداول البيانات الحساسة مقيدة بـ `service_role`
- `anon key` يقرأ فقط المنتجات النشطة والمحتويات العامة
- `admin_pin` محمي — لا يظهر للعامة

### القيود
- لا مفاتيح API مخزنة في الكود (كلها `Deno.env.get()`)
- CORS حالياً `*` — يفضل تقييده لاحقاً
- المفاتيح السرية مشتركة بين كل الدوال (بيئة Supabase واحدة)

---

## 9. النشر (Deployment)

| المكون | طريقة النشر |
|--------|------------|
| **الواجهة (React PWA)** | GitHub → Vercel (تلقائي) |
| **Edge Functions** | Supabase Dashboard (يدوي — نسخ/لصق) |
| **Database Migrations** | Supabase Dashboard (SQL Editor) |
| **متغيرات البيئة** | Supabase → Settings → Functions → Secrets |

### خطوات نشر Edge Function
1. ادخل على Supabase Dashboard → Edge Functions
2. اختار الدالة
3. استبدل/أضف محتويات الملفات
4. اضغط Deploy

---

## 10. المشاكل السابقة (لا تكررها)

| المشكلة | السبب | الحل |
|---------|-------|------|
| `admin_pin` ظاهر للعامة | RLS كان `USING(true)` على الجدول | تقييد إلى service_role + view |
| `pg_net` في public schema | تثبيت افتراضي خاطئ | Drop + Create في extensions |
| `BUTTON_DATA_INVALID` | callback_data > 64 حرف | تقصير الصيغة |
| زر يختفي مع زر (inv_*) | الأزرار في نفس الصف | كل زر في صف لحاله |
| "الخطوة غير متاحة" (inv_*) | validNext يستخدم `reserved` و workflow_status `reserve` | توحيد الأسماء |
| sync-products كود submit-order | نشر خاطئ للدالة | كتابة كود المزامنة الصحيح |
| sync-products `description` column | العمود موجود في JoudaApp مو Inventory | إزالته من الاستعلام |
| تواريخ هجرية | `toLocaleString('ar-SA')` | استخدام `fmtDate()` |
| إشعارات لكل الشاتات | إرسال للمجموعة + المدير | تصفية adminIds فقط |
| RLS يمنع submit-order | anon key بعد تقييد RLS | تبديل إلى service_role |
| `WEBHOOK_SECRET` يمنع cron | cron ما يرسل السر | تحديث cron job بإضافة header |

---

## 11. الإجراءات المعلقة

- [ ] تغيير `admin_pin` من القيمة الافتراضية `0000`
- [ ] تدقيق أمان مشروع Inventory (RLS، API keys، webhook)
- [ ] تحديث cron job في JoudaApp لإرسال `x-webhook-secret`
- [ ] تقييد CORS إلى Domain التطبيق
- [ ] إشعارات واتساب مباشرة (خطة مستقبلية)

---

## تحديث الملف

بعد أي تغيير جوهري في النظام، حدّث هذا الملف. آخر تحديث: 2026-05-24.
