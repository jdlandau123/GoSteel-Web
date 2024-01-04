import { Injectable } from '@angular/core';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  firebaseApp: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  firebaseAnalytics: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  auth: any;
  user: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor() {
    this.firebaseApp.subscribe(app => {
      this.firebaseAnalytics.next(getAnalytics(app));
    });

    this.firebaseApp.next(initializeApp(environment.firebaseConfig));
    this.auth = getAuth();
  }

  createUser(credentials: {email: string, password: string}) {
    createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password).then(userCredential => {
        const user = userCredential.user;
        this.user.next(user);
    }).catch(error => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error.message);
    });
  }

  logIn(credentials: {email: string, password: string}) {
    signInWithEmailAndPassword(this.auth, credentials.email, credentials.password).then(userCredential => {
      const user = userCredential.user;
      console.log(user);
      this.user.next(user);
    }).catch(error => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(error.message);
    });
  }

  logOut() {
    signOut(this.auth).then(() => {
      this.user.next(null);
    }).catch(error => {
      console.log(error.message);
    });
  }

}
