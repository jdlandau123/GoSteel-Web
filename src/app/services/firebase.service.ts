import { Injectable, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  query,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
} from "firebase/firestore";
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { LoadingService } from './loading.service';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  firebaseApp: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  firebaseAnalytics: any;
  db: any;
  auth: any;
  user: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  isLoggedIn = signal(false);

  constructor(private _router: Router, private _loadingService: LoadingService) {
    this.firebaseApp.subscribe(app => {
      if (app) {
        this.firebaseAnalytics = getAnalytics(app);
        this.db = getFirestore(app);
      }
    });

    this.firebaseApp.next(initializeApp(environment.firebaseConfig));
    this.auth = getAuth();

    onAuthStateChanged(this.auth, user => {
      this.user.next(user);
      this.isLoggedIn.set(user !== null);
    });

    effect(() => { // keep this? seems like it might be extra steps
      if (this.isLoggedIn()) this._router.navigateByUrl('/orders');
      else this._router.navigateByUrl('/login');
    })
  }

  // auth
  createUser(credentials: {email: string, password: string}) {
    createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password).then(userCredential => {
        const user = userCredential.user;
        this.user.next(user);
    }).catch(error => {
        console.log(error.message);
    });
  }

  logIn(credentials: {email: string, password: string}) {
    signInWithEmailAndPassword(this.auth, credentials.email, credentials.password).then(userCredential => {
      const user = userCredential.user;
      this.user.next(user);
      this.isLoggedIn.set(true);
      this._router.navigateByUrl('/orders');
    }).catch(error => {
      console.log(error.message);
    });
  }

  logOut() {
    signOut(this.auth).then(() => {
      this.user.next(null);
      this.isLoggedIn.set(false);
    }).catch(error => {
      console.log(error.message);
    });
  }

  // database
  query<T>(collectionName: string, whereClause: any = null, order: QueryOrderByConstraint = null) {
    // where should be a firebase where object
    // order should be a firebase orderBy object
    this._loadingService.isLoading.set(true);

    let q;
    const col = collection(this.db, collectionName);

    if (whereClause && order) q = query(col, whereClause, order);
    else if (whereClause && !order) q = query(col, whereClause);
    else if (!whereClause && order) q = query(col, order);
    else q = query(col);

    return from(getDocs(q)).pipe(
      tap(() => this._loadingService.isLoading.set(false)),
      map(d => d.docs.map(i => ({id: i.id, ...i.data()}) as T))
    );
  }

  async getItem(collectionName: string, itemId: string) {
    const docRef = doc(this.db, collectionName, itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      console.log("No such document!");
    }
  }

  async createItem(collectionName: string, object: any) {
    return await addDoc(collection(this.db, collectionName), object);
  }

  async updateItem(collectionName: string, itemId: string, updates: any) {
    const docRef = doc(this.db, collectionName, itemId);
    return await updateDoc(docRef, updates);
  }

  async deleteItem(collectionName: string, itemId: string) {
    return await deleteDoc(doc(this.db, collectionName, itemId));
  }

}
