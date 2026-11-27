import type { DietStatus, HalalStatus } from '../../types/models';

export function dietSuggestions(ingredients: string): { diet: DietStatus; halal: HalalStatus } {
  const text = ingredients.normalize('NFKC').toLocaleLowerCase('de').replaceAll('*', '');
  // Strip allergen trace notices. They do not describe recipe ingredients.
  const recipe = text.split(/\bkann\s+(?:auch\s+)?spuren\b/)[0];
  const meat = /\b(?:schwein(?:efleisch|eschmalz|egelatine)?|speck|schmalz|fleisch|fisch|anchovis|sardellen|hühnerfleisch|rindfleisch|(?:schweine|rinder|fisch)?gelatine|karmin|cochenille|e\s*-?\s*120)\b/u.test(recipe);
  const animal = /\b(?:(?:voll|mager|kuh|ziegen|schafs)?milch(?:pulver|fett|eiweiß|zucker)?|(?:süß)?molke(?:npulver|nerzeugnis)?|sahne|butter(?:fett|milch|reinfett)?|laktose|kasein|casein|vollei|hühnerei|eiklar|eigelb|honig|bienenwachs|schellack|e\s*-?\s*(?:901|904))\b/u.test(recipe);
  const disputed = /\b(?:lab|enzym\w*|aroma|aromen|e\s*-?\s*471)\b/u.test(recipe);
  const simplePlantList = recipe
    .replace(/\d+(?:[.,]\d+)?\s*%/g, '')
    .split(/[,;\n]+/)
    .map(part => part.trim().replace(/[.!]$/, ''))
    .filter(Boolean);
  const plantOnly = simplePlantList.length > 0 && simplePlantList.every(part =>
    /^(?:ananas|ananasscheiben|apfel|äpfel|apfelscheiben|mango|mangostücke|bananen?|erdbeeren?|himbeeren?|zucker|wasser|salz|zitronensaft|apfelsaft|pektin|agar-agar|maisstärke)$/u.test(part)
  );
  const porkOrAlcohol = /\b(?:schwein(?:efleisch|eschmalz|egelatine)?|speck|ethanol|alkohol|rotwein|weißwein|rum|wodka|bier)\b/u.test(recipe.replace(/\bohne\s+alkohol\b/g, ''));
  return {
    diet: meat ? 'notVegetarian' : animal && !disputed ? 'vegetarian' : plantOnly ? 'vegan' : 'unknown',
    halal: porkOrAlcohol ? 'notHalal' : plantOnly ? 'halal' : 'unknown',
  };
}

export const dietLabels: Record<DietStatus, string> = {
  unknown: 'Offen', vegan: 'Vegan', vegetarian: 'Vegetarisch (Veggie)', notVegetarian: 'Nicht vegetarisch',
};

export const halalLabels: Record<HalalStatus, string> = {
  unknown: 'Offen', halal: 'Halal', notHalal: 'Nicht halal',
};
