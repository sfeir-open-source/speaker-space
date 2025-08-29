import { Component } from "@angular/core";

// SUGGESTION: quand t'as des composants pas trop gros comme ça (ça devrait être la norme de faire des petits composants, c'est plus facile à lire/maintenir/comprendre),
// tu peux faire un Single File Component (ça tend à devenir la norme dans Angular)

@Component({
  selector: "app-footer",
  imports: [],
  template: `
<span class="block text-sm text-gray-500 text-center dark:text-gray-400">
  © 2025 Speaker Space
</span>
`,
})
export class FooterComponent {}
