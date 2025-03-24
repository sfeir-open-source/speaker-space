# Speaker-Space


## Project Description

**Speaker Space** is a full-stack application designed to provide a centralized space for speakers to access all information related to their conferences, resources, contacts, and tasks to accomplish — with an integrated reminder system.


## Stack

- **Backend :** Java 21, Spring Boot

- **Frontend :** Angular 19, TailwindCSS

- **Cloud :** Google App Engine (instance F1)

- **Database :** Firestore

- **Authentication :** Firebase


## Prerequisites

- Java 21

- Node.js 20+

- Angular CLI 19

- npm

- Google Cloud Platform account with access to App Engine, Firestore, and Firebase


## Project Setup

Clone the Repository

`````
git clone https://github.com/Speaker-Space/speaker-space.git

cd speaker-space
`````


## Backend Configuration

Create a **.env** file at the root of the project based on the **.env.sample file**.
Create a **app.yaml** file in the **main/appengine** package based on the **app.example.yaml** file.

Download Firestore JSON Key :

- Go to your **Google Cloud Console**.
- Access your Firestore service account.
- Click on “...” in the Actions column.
- Select “Manage keys” > “Add key” > “JSON”.
- Download the **.json** file.
- Place it in the directory: **src/main/resources/firestore-key.json**

Download Firebase JSON Key:

- Go to the **Firebase console** of your project.
- In project settings: ⚙️ Settings > Service accounts
- Click on “Generate new private key”.
- Place the file in : **src/main/resources/firebase-service.json**


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
    // Configuration Firebase ici
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

### Start the Backend

In a terminal, navigate to the backend folder :

`````
cd back
`````

Run the Spring Boot application :

`````
./mvnw spring-boot:run
`````

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
