import { inject, Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment.development";
import { HttpClient } from "@angular/common/http";

interface FirestoreConnexionInfo {
  message: string;
}

@Injectable({
  providedIn: "root",
})
export class TestConnectionBackFrontService {
  // SUGGESTION: avec une syntaxe plus moderne

  testFirestore() {
    return inject(HttpClient).get<FirestoreConnexionInfo>(
      `${environment.apiUrl}/firestore/connection-info`,
    );
  }
}
