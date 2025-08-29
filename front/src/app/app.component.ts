import { Component } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { NavbarComponent } from "./common/components/navbar/navbar.component";
import { FooterComponent } from "./common/components/footer/footer.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: "./app.component.html",
  standalone: true,
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "frontend";
  showNavbar = true;

  constructor(private router: Router) {
    // TODO: chaque fois que tu as un .subscribe() il FAUT que tu penses "unsubscribe", sinon y'aura des fuites mémoires, et ton app va cramer la RAM de l'utilisateur
    // Y'a plusieurs options :
    // - unsubscribe explicite https://rxjs.dev/guide/subscription#subscription (et du coup il te faut un onDestroy() sur ton composant)
    // - unsubscribe implicite via un takeUntilDestroy() https://v19.angular.dev/api/core/rxjs-interop/takeUntilDestroyed => dès que le composant est destroy, takeUntilDestroyed va automatiquement unsubscribe
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const hiddenRoutes = ["/not-found", "/login"];
        this.showNavbar = !hiddenRoutes.includes(this.router.url);
      }
    });
  }
}
