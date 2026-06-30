<div align="center">
  <img width="1200" height="475" alt="JoudaApp Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>💎 JoudaApp</h1>
  <p><b>A Premium AI-Powered E-Commerce & Knowledge Platform for Jouda Products</b></p>

  <p>
    <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-5.1.6-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google" alt="Gemini" />
  </p>
</div>

---

## 📝 About the Project | عن المشروع

**JoudaApp** is a modern, customer-centric Progressive Web Application (PWA) designed to provide an interactive shopping and educational experience for Jouda products. It leverages Artificial Intelligence to offer personalized recipes, product information, and smart suggestions.

**تطبيق جوده** هو تطبيق ويب متطور (PWA) موجه للعملاء، تم تصميمه لتوفير تجربة تسوق وتعليم تفاعلية لمنتجات شركة "جوده". يستخدم التطبيق الذكاء الاصطناعي لتقديم وصفات مخصصة، معلومات دقيقة عن المنتجات، واقتراحات ذكية.

---

## ✨ Key Features | المميزات الرئيسية

### 🛒 E-Commerce & Shopping
- **Smart Product Catalog:** Browse a rich catalog of Jouda products with high-quality images and details.
- **AI-Powered Scanner:** Scan products to get instant details and smart tips.
- **Dynamic Cart System:** Real-time order management with local storage persistence.
- **PWA Ready:** Install the app on your mobile home screen for a native-like experience.

### 🍳 Recipes & Content
- **AI Recipes:** Discover recipes based on Jouda products using Google Gemini AI.
- **Recipe of the Day:** Daily featured culinary inspiration.
- **Stories & Blog:** Interactive social-style stories and informative blog sections about nutrition and cooking.

### 🧠 Intelligent Interaction
- **Knowledge Hub:** An AI-driven center for tips, FAQs, and product knowledge.
- **Medical & Nutrition Info:** Specialized cards for health-related product information.
- **Personalized Onboarding:** A smooth introduction to the app's capabilities.

---

## 🛠 Tech Stack | التقنيات المستخدمة

- **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend/Database:** [Supabase](https://supabase.com/)
- **AI Engine:** [Google Gemini API](https://ai.google.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started | البدء بالعمل

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/mohanaji770/JoudaApp.git
   cd JoudaApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TOMTOM_API_KEY=your_tomtom_search_api_key
   ```

   Gemini is configured only on the Supabase Edge Function side as `GEMINI_API_KEY`; do not add a `VITE_GEMINI_API_KEY` to frontend environments.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📦 Deployment | النشر

The project is optimized for deployment on platforms like **Vercel** or **Netlify**. Ensure that environment variables are correctly configured in the production settings of your chosen platform.

---

## 🤝 Contribution | المساهمة

We welcome contributions! Please feel free to submit a Pull Request or open an issue.

نرحب بجميع المساهمات! لا تتردد في تقديم Pull Request أو فتح Issue لأي اقتراح أو مشكلة.

---

<div align="center">
  <p>Built with ❤️ for the Jouda Community</p>
</div>
