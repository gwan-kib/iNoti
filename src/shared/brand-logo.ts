import logoUrl from '../../assets/inoti-logo.png?inline';

// Inline the local artwork in page-owned documents without exposing extension resources.
export function createBrandLogo(document: Document): HTMLImageElement {
  const logo = document.createElement('img');
  logo.className = 'brand-logo';
  logo.src = logoUrl;
  logo.alt = '';
  return logo;
}
