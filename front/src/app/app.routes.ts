import { Routes } from "@angular/router";
import { TestConnectionBackFrontComponent } from "./common/test-connection-back-front/test-connection-back-front.component";
import { NotFoundPageComponent } from "./features/not-found-page/not-found-page.component";
import { LoginComponent } from "./features/login/login.component";
import { LogoutHomePageComponent } from "./features/logout-home-page/logout-home-page-component";

// SUGGESTION: n'hésite pas à lazy loader les différentes routes (https://v19.angular.dev/guide/routing/common-router-tasks#lazy-loading)
// c'est pas un gros effort, ça permet de gagner un peu en performance
// autre avantage (comme j'ai vu que t'as une PR pour la partie admin) tu peux éviter de charger les parties du code qui sont pour la section admin pour les utilisateurs
export const routes: Routes = [
  { path: "", component: LogoutHomePageComponent },
  { path: "system-info", component: TestConnectionBackFrontComponent },
  { path: "login", component: LoginComponent },
  { path: "not-found", component: NotFoundPageComponent },
  { path: "**", redirectTo: "/not-found" },
];
