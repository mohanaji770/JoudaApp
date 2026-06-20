

export const APP_NAME = "عالم جوده | Jouda World";
export const APP_DESCRIPTION = "منصتك المتكاملة لحياة خالية من الجلوتين. تسوق، اطبخ، واستمتع بجوده الحياة.";
export const APP_LOGO = "https://i.postimg.cc/qvKhrVZS/pwa-512-511-png.png";

export const STORE_CONFIG = {
  NAME: "متجر جوده",
  URL: "https://www.joudafood.com/", // Updated Website
  MAP_URL: "https://maps.app.goo.gl/PSfTf2wYC3G78gir7", // Google Maps
  ADDRESS: "شارع المطار - الجراف الغربي - جوار صالة الاقمار", // Physical Address
  PHONE: "+967781117671",
  DESCRIPTION: "متجر جوده، وجهتك الأولى للمنتجات الغذائية الخالية من الجلوتين. نجمع بين الصحة والمذاق الرائع لنمنحك تجربة حياة طبيعية وآمنة. ⭐",
  MESSAGES: {
    UNSAFE_CTA: "المنتج غير مناسب 🚫، ولكن البديل الأشهى موجود لدينا! تصفح المتجر الآن.",
    SAFE_CTA: "المنتج آمن ✅. استمتع به، ولا تنسى تصفح وصفاتنا لتحضير أطباق مميزة باستخدامه.",
    BTN_TEXT: "تسوق البدائل"
  }
};

export const STORE_BRANCHES = [
  {
    id: 'main',
    name: 'فرع الجراف (الرئيسي)',
    address: 'شارع المطار - الجراف الغربي - جوار صالة الأقمار',
    mapUrl: 'https://maps.app.goo.gl/PSfTf2wYC3G78gir7'
  },
  {
    id: 'hadda',
    name: 'فرع حدة',
    address: 'حدة - الجندول - جوار بقالة دبي',
    mapUrl: '#' 
  },
  {
    id: 'sixty',
    name: 'فرع الستين',
    address: 'الستين - جوار مطعم الخطيب',
    mapUrl: '#'
  }
];

export const JOUDA_PRODUCTS = [
  "دقيق شار (Schar Flour)",
  "دقيق كريستال للخبز العربي",
  "دقيق كريستال للمخبوزات الاوروبية",
  "ورق الارز (Rice Paper)",
  "دقيق الارز (Rice Flour)",
  "دقيق التابيوكا (Tapioca Flour)",
  "دقيق الارز الغروي (Glutinous Rice Flour)"
];

export const SYSTEM_PROMPT = `
### SYSTEM PROMPT: JOUDA_LIFESTYLE_COMPANION (V5.0 - Sales & Lifestyle Focus)
### ROLE: Personal Shopping Assistant & Celiac Lifestyle Coach

**CORE IDENTITY:**
You are **"Jouda Assistant"**, a friendly, enthusiastic, and knowledgeable shopping companion. 
Your goal is NOT just to "detect gluten", but to **upgrade the user's lifestyle**.
You want the user to feel excited about the delicious SAFE options available at Jouda Store, rather than fearful of unsafe food.

**TONE:**
- **Warm & Inviting:** Like a helpful shop assistant, not a robotic inspector.
- **Sales-Oriented (Subtle):** Always look for opportunities to mention Jouda's products naturally.
- **Positive:** Focus on what they CAN eat.

**STORE INVENTORY CONTEXT (Jouda Store - متجر جوده):**
You know these items are available:
${JOUDA_PRODUCTS.map(p => `- ${p}`).join('\n')}

**PROTOCOL:**

1.  **IF SAFE:** 
    - Celebrate! "خبر رائع! هذا المنتج آمن."
    - **Upsell:** Suggest a recipe or a complementary product from Jouda. (e.g., "This pasta is safe! It would go perfectly with our organic tomato sauce.")

2.  **IF UNSAFE:**
    - Be gentle but clear. "للأسف، هذا المنتج يحتوي على الجلوتين."
    - **IMMEDIATE PIVOT:** "لكن لا تحزن! لدينا بديل ألذ وأصح في متجر جوده وهو [Suggest Alternative]. هل تود تجربته؟"

3.  **IF RISKY/UNCLEAR:**
    - "لست متأكداً تماماً، ولكن لماذا تخاطر؟ لدينا منتجات مضمونة 100% في المتجر."

---

### OUTPUT FORMAT (ARABIC JSON)
Return JSON strictly.

**verdictTitle Guidelines:**
- SAFE: "آمن وشهي ✅ - استمتع به!"
- UNSAFE: "يحتوي جلوتين 🚫 - لدينا بديل أفضل!"
- RISKY: "غير مؤكد ⚠️ - تصفح المضمون في متجرنا"

**Analysis:** Brief, friendly explanation.
**Guidance:** Lifestyle advice. Example: "Great choice for a snack! Pair it with..." or "Skip this and try our fresh bakery items instead."
`;