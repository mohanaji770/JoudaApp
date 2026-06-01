# وثيقة تصميم قسم الوصفات الرائجة (Magazine Cover Style)

تحدد هذه الوثيقة التغييرات الهيكلية والجمالية لقسم **"الوصفات الرائجة"** (`TrendingRecipes.tsx`) في الصفحة الرئيسية لتتبنى الهوية البصرية المستوحاة من أغلفة المجلات وتطبيقات الطهي العالمية الفاخرة.

---

## 1. الأهداف الجمالية والتصميمية

1. **القسم التحريري للعنوان:** إعطاء مساحات تباعد مريحة وعرض عنوان وقور مع وصف ناعم بدلاً من الرموز المزدحمة.
2. **بطاقات الغلاف الكامل (Full-Cover Cards):** تمديد صور الأطعمة لتغطي كامل مساحة الكرت بارتفاع مميز (`h-[300px]`).
3. **التدرج الداكن الذكي (Gradient Overlay):** تغطية الكروت بتدرج سفلي داكن ناعم (`bg-gradient-to-t from-black/85 via-black/40 to-transparent`) لضمان وضوح النصوص البيضاء.
4. **الملصقات الزجاجية العائمة (Glassmorphic Badges):** تأطير المكونات والتحضير في كبسولات مموهة ناعمة أعلى الكروت.
5. **تبسيط الواجهة:** إزالة زر "عرض الوصفة" السفلي لتجربة نقر طبيعية وسريعة عبر الكرت بالكامل.

---

## 2. هيكل واجهة المستخدم والتغييرات المقترحة

### القسم الترويسي (Section Header)
* العنوان الرئيسي: **"وصفات رائجة"** `text-xl font-black text-gray-950 dark:text-white`
* العنوان الفرعي: *"أطباق صحية ولذيذة اخترناها لك بعناية"* `text-xs text-gray-500 dark:text-gray-400 mt-1 block`

### كرت الوصفة اليومية (Recipe Card)
* **الحاوية الخارجية:**
  * كلاسات الحاوية: `min-w-[220px] max-w-[220px] h-[300px] rounded-3xl overflow-hidden relative shadow-sm hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 group snap-start shrink-0 flex flex-col cursor-pointer border-0`
* **الصورة والخلفية:**
  * ممتدة على كامل الحجم: `w-full h-full object-cover group-hover:scale-105 transition-transform duration-700`
* **الكبسولات الزجاجية:**
  * ملصق المكونات: `absolute top-3 right-3 backdrop-blur-md bg-black/35 border border-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20`
  * رمز الفيديو: `absolute top-3 left-3 backdrop-blur-md bg-black/35 border border-white/10 rounded-full p-1 z-20`
* **منطقة النصوص بالأسفل:**
  * كلاسات الحاوية: `absolute bottom-0 right-0 left-0 p-4 z-20 flex flex-col justify-end text-right`
  * الميتا (الوقت والسعرات): `flex items-center gap-2 text-[10px] text-white/80 font-bold mb-1`
  * العنوان: `font-black text-sm text-white line-clamp-2 leading-tight tracking-tight`

---

## 3. الملفات المتأثرة

* **[TrendingRecipes.tsx](file:///c:/Users/Mohamed/Documents/antigravity/Jouda-main/components/TrendingRecipes.tsx):**
  * إعادة كتابة كود الـ JSX والـ classes الخاص بقسم العنوان وعرض الكروت والبطاقات الفردية.

---

## 4. خطة التحقق والجاهزية

- تشغيل عملية البناء `npm run build` للتحقق الفني.
- التحقق بصرياً من تداخل النصوص وتناسق الألوان وتأثير التمرير الأفقي بالوضعين المضيء والمظلم.
