## Frontend Configuration

### Install Dependencies

`````
cd front
npm install
`````

Firebase Configuration

Create the following file : **src/environments/environment.development.ts** based on the **environment.example.development.ts** file.

Add the following content:

`````
export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:8080/api',
  firebaseConfig: {
    // Firebase setup here
  }
};
`````


### Retrieve Firebase Configuration

- Go to the **Firebase console** :
- ⚙️ Settings > General Settings
- Copy your firebaseConfig :

`````
const firebaseConfig = {
  apiKey: "apiKey",
  authDomain: "authDomain",
  projectId: "projectId",
  storageBucket: "storageBucket",
  messagingSenderId: "messagingSenderId",
  appId: "appId"
};
`````

- Paste the configuration inside **environment.development.ts**.

## Project execution locally


### Start the Frontend

In a new terminal, navigate to the frontend folder :

`````
cd front
`````

Install dependencies :

`````
npm install
`````

Start the Angular application :

`````
ng serve
`````

The frontend will be available at : **http://localhost:4200**
