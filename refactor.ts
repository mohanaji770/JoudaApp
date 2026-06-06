import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const moves = [
  // Pages -> pages/
  { from: 'components/JoudaPage.tsx', to: 'pages/JoudaPage.tsx' },
  { from: 'components/ProductsPage.tsx', to: 'pages/ProductsPage.tsx' },
  { from: 'components/RecipesPage.tsx', to: 'pages/RecipesPage.tsx' },
  { from: 'components/KnowledgeHub.tsx', to: 'pages/KnowledgeHub.tsx' },
  { from: 'components/AdminDashboard.tsx', to: 'pages/AdminDashboard.tsx' },
  
  // Modals -> components/modals/
  { from: 'components/ArticleModal.tsx', to: 'components/modals/ArticleModal.tsx' },
  { from: 'components/BakeryModal.tsx', to: 'components/modals/BakeryModal.tsx' },
  { from: 'components/ProductDetailsModal.tsx', to: 'components/modals/ProductDetailsModal.tsx' },
  { from: 'components/ProductRecipesModal.tsx', to: 'components/modals/ProductRecipesModal.tsx' },
  { from: 'components/ProductRequestModal.tsx', to: 'components/modals/ProductRequestModal.tsx' },
  { from: 'components/ReceiptModal.tsx', to: 'components/modals/ReceiptModal.tsx' },
  { from: 'components/RecipesModal.tsx', to: 'components/modals/RecipesModal.tsx' },
  { from: 'components/ShareModal.tsx', to: 'components/modals/ShareModal.tsx' },
  { from: 'components/SuccessOrderModal.tsx', to: 'components/modals/SuccessOrderModal.tsx' },
  
  // Layout -> components/layout/
  { from: 'components/Layout.tsx', to: 'components/layout/Layout.tsx' },
  { from: 'components/Header.tsx', to: 'components/layout/Header.tsx' },
  { from: 'components/Sidebar.tsx', to: 'components/layout/Sidebar.tsx' },
  { from: 'components/BottomNav.tsx', to: 'components/layout/BottomNav.tsx' },
  { from: 'components/OfflineIndicator.tsx', to: 'components/layout/OfflineIndicator.tsx' },
  { from: 'components/ErrorBoundary.tsx', to: 'components/layout/ErrorBoundary.tsx' },
  
  // UI -> components/ui/
  { from: 'components/Onboarding.tsx', to: 'components/ui/Onboarding.tsx' },
  { from: 'components/InstallPrompt.tsx', to: 'components/ui/InstallPrompt.tsx' },
  { from: 'components/PresentationMode.tsx', to: 'components/ui/PresentationMode.tsx' },
  { from: 'components/Scanner.tsx', to: 'components/ui/Scanner.tsx' },
  { from: 'components/MedicalCard.tsx', to: 'components/ui/MedicalCard.tsx' },
  { from: 'components/ResultCard.tsx', to: 'components/ui/ResultCard.tsx' },
  
  // Home Domain -> components/home/
  { from: 'components/BakeryBanner.tsx', to: 'components/home/BakeryBanner.tsx' },
  { from: 'components/StoreBanner.tsx', to: 'components/home/StoreBanner.tsx' },
  { from: 'components/PromoBanner.tsx', to: 'components/home/PromoBanner.tsx' },
  { from: 'components/StoriesBar.tsx', to: 'components/home/StoriesBar.tsx' },
  
  // Blog/Recipes Domain -> components/blog/
  { from: 'components/RecipeOfTheDay.tsx', to: 'components/blog/RecipeOfTheDay.tsx' },
  { from: 'components/TrendingRecipes.tsx', to: 'components/blog/TrendingRecipes.tsx' },
  { from: 'components/BlogSection.tsx', to: 'components/blog/BlogSection.tsx' },
  { from: 'components/QuickTips.tsx', to: 'components/blog/QuickTips.tsx' },
  { from: 'components/HistoryList.tsx', to: 'components/blog/HistoryList.tsx' },
];

async function main() {
  for (const move of moves) {
    const sourceFile = project.getSourceFile(move.from);
    if (sourceFile) {
      console.log(`Moving ${move.from} to ${move.to}...`);
      sourceFile.moveToDirectory(move.to.substring(0, move.to.lastIndexOf('/')));
    } else {
      console.error(`Could not find ${move.from}`);
    }
  }

  console.log('Saving all changes...');
  await project.save();
  console.log('Done!');
}

main().catch(console.error);
