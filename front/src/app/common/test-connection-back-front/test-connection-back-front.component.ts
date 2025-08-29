import { Component, inject, OnInit } from "@angular/core";
import { TestConnectionBackFrontService } from "./services/testConnectionBackFront.service";
import { CommonModule } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { catchError, map, of } from "rxjs";

@Component({
  selector: "app-test-connection-back-front",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./test-connection-back-front.component.html",
  styleUrl: "./test-connection-back-front.component.scss",
})
export class TestConnectionBackFrontComponent {
  // TODO: évite d'utiliser ngOnInit(), depuis environ la v16 d'Angular, t'as plus besoin, mettre dans le constructeur ou directement affecter la property c'est mieux
  // TODO: passe par le inject() pour ne plus avoir besoin du tout du constructor() dans la majorité des cas
  // TODO: évite au maximum de faire des .subscribe() car tu crées des fuites mémoire
  // au choix :
  // - quand comme ici tu fais uniquement un GET qui n'a pas vraiment de raison d'être partagé entre plusieurs composant, tu peux passer par https://v19.angular.dev/guide/signals/resource# (c'est marqué expérimentale en v19 mais c'est pas grave elle finira stable sans que ça casse)
  // - simplement passer par un AsyncPipe https://v19.angular.dev/api/common/AsyncPipe#examples (ça marche depuis la v4 de mémoire cette façon de faire)
  // - transforme en Signal avec toSignal() https://v19.angular.dev/api/core/rxjs-interop/toSignal (j'ai transformé le code sur cette version pour te montrer)
  //
  firestoreMessage = toSignal(
    inject(TestConnectionBackFrontService).testFirestore().pipe(
      map((response) => response.message), // si la récupération se passe bien on affecte à this.firestoreMessage le message
      catchError((error) => { // si elle se passe mal on met un message d'erreur
        console.error("Firestore connection error :", error);
        return of("Firestore connection error");
      }),
    ),
  );
}
