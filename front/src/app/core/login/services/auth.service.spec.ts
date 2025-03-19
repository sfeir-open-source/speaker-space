// import { AuthService } from './auth.service';
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { TestBed } from '@angular/core/testing';
// import {
//   Auth,
//   fetchSignInMethodsForEmail,
//   GoogleAuthProvider, isSignInWithEmailLink,
//   sendSignInLinkToEmail, signInWithEmailLink,
//   signInWithPopup, signOut, setPersistence,
//   onAuthStateChanged
// } from '@angular/fire/auth';
// import { Router } from '@angular/router';
// import { MatDialog } from '@angular/material/dialog';
// import { of } from 'rxjs';
// import { environment } from '../../../../environments/environment.development';
// import { HttpClient } from '@angular/common/http';
//
// // Mock complet pour Firebase Auth
// jest.mock('@angular/fire/auth', () => ({
//   signInWithPopup: jest.fn(),
//   sendSignInLinkToEmail: jest.fn(),
//   isSignInWithEmailLink: jest.fn(),
//   signInWithEmailLink: jest.fn(),
//   fetchSignInMethodsForEmail: jest.fn(),
//   GoogleAuthProvider: jest.fn().mockImplementation(() => ({})),
//   GithubAuthProvider: jest.fn().mockImplementation(() => ({})),
//   onAuthStateChanged: jest.fn().mockImplementation((auth, callback) => {
//     callback(null);
//     return jest.fn();
//   }),
//   setPersistence: jest.fn(),
//   signOut: jest.fn(),
//   browserLocalPersistence: 'browser'
// }));
//
// describe('AuthService', () => {
//   let service: AuthService;
//   let mockAuth: any;
//   let mockRouter: any;
//   let mockDialog: any;
//   let mockHttp: any;
//   let windowAlertSpy: jest.SpyInstance;
//
//   beforeEach(() => {
//     // Réinitialiser les mocks
//     jest.clearAllMocks();
//
//     // Mock pour window.alert
//     windowAlertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
//
//     // Créer les mocks
//     mockAuth = {
//       currentUser: null
//     };
//
//     mockRouter = {
//       navigate: jest.fn()
//     };
//
//     mockDialog = {
//       open: jest.fn().mockReturnValue({
//         afterClosed: () => of(true)
//       })
//     };
//
//     mockHttp = {
//       post: jest.fn().mockReturnValue(of({}))
//     };
//
//     // Configurer le module de test
//     TestBed.configureTestingModule({
//       imports: [HttpClientTestingModule],
//       providers: [
//         { provide: Auth, useValue: mockAuth },
//         { provide: Router, useValue: mockRouter },
//         { provide: MatDialog, useValue: mockDialog },
//         { provide: HttpClient, useValue: mockHttp }
//       ]
//     });
//
//     // Créer le service manuellement pour éviter les problèmes d'injection
//     service = new AuthService();
//
//     // Remplacer les propriétés injectées par nos mocks
//     service.auth = mockAuth;
//     (service as any).router = mockRouter;
//     service.dialog = mockDialog;
//     (service as any).http = mockHttp;
//
//     // Simuler l'appel à onAuthStateChanged qui est fait dans le constructeur
//     const authStateCallback = (onAuthStateChanged as jest.Mock).mock.calls[0][1];
//     authStateCallback(null);
//
//     // Espionner la méthode checkEmailLink pour éviter son exécution
//     jest.spyOn(service, 'checkEmailLink').mockImplementation(() => {});
//
//     // Simuler le comportement de window.location
//     Object.defineProperty(window, 'location', {
//       value: {
//         href: 'http://localhost:4200',
//         origin: 'http://localhost:4200',
//         search: ''
//       },
//       writable: true
//     });
//
//     // Simuler sessionStorage
//     const mockSessionStorage = {
//       getItem: jest.fn(),
//       setItem: jest.fn(),
//       removeItem: jest.fn()
//     };
//     Object.defineProperty(window, 'sessionStorage', {
//       value: mockSessionStorage
//     });
//
//     // Simuler window.history
//     Object.defineProperty(window, 'history', {
//       value: {
//         replaceState: jest.fn()
//       },
//       writable: true
//     });
//   });
//
//   afterEach(() => {
//     windowAlertSpy.mockRestore();
//   });
//
//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });
//
//   describe('loginWithGoogle', () => {
//     it('should call loginWithProvider with google', async () => {
//       // Espionner la méthode loginWithProvider
//       const spy = jest.spyOn(service as any, 'loginWithProvider').mockResolvedValue({});
//
//       await service.loginWithGoogle();
//
//       expect(spy).toHaveBeenCalledWith('google');
//     });
//
//     it('should sign in with Google and save user data', async () => {
//       const mockUser = {
//         uid: '123',
//         email: 'test@example.com',
//         displayName: 'Test User',
//         photoURL: 'https://example.com/photo.jpg',
//         getIdToken: jest.fn().mockResolvedValue('mock-token')
//       };
//
//       (signInWithPopup as jest.Mock).mockResolvedValue({
//         user: mockUser
//       });
//
//       // Espionner les méthodes privées
//       jest.spyOn(service as any, 'sendTokenToBackend').mockResolvedValue({});
//       jest.spyOn(service as any, 'saveUserToBackend').mockResolvedValue({});
//
//       const result = await (service as any).loginWithProvider('google');
//
//       expect(GoogleAuthProvider).toHaveBeenCalled();
//       expect(signInWithPopup).toHaveBeenCalled();
//
//       // Vérifier uniquement les propriétés qui nous intéressent
//       expect(service.user$.value?.uid).toBe('123');
//       expect(service.user$.value?.email).toBe('test@example.com');
//       expect(service.user$.value?.displayName).toBe('Test User');
//       expect(service.user$.value?.photoURL).toBe('https://example.com/photo.jpg');
//
//       expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
//       expect(result).toBe(mockUser);
//     });
//
//     it('should handle authentication error', async () => {
//       (signInWithPopup as jest.Mock).mockRejectedValue({
//         code: 'auth/account-exists-with-different-credential',
//         customData: { email: 'test@example.com' }
//       });
//
//       // Espionner la méthode showAuthErrorDialog
//       jest.spyOn(service as any, 'showAuthErrorDialog');
//
//       const result = await (service as any).loginWithProvider('google');
//
//       expect(result).toBeNull();
//       expect(service.dialog.open).toHaveBeenCalled();
//     });
//   });
//
//   describe('loginWithEmail', () => {
//     it('should call loginWithProvider with email and email address', async () => {
//       // Espionner la méthode loginWithProvider
//       const spy = jest.spyOn(service as any, 'loginWithProvider').mockResolvedValue({});
//
//       await service.loginWithEmail('test@example.com');
//
//       expect(spy).toHaveBeenCalledWith('email', 'test@example.com');
//     });
//
//     it('should send email link', async () => {
//       (fetchSignInMethodsForEmail as jest.Mock).mockResolvedValue([]);
//       (sendSignInLinkToEmail as jest.Mock).mockResolvedValue(undefined);
//
//       await (service as any).sendEmailLink('test@example.com');
//
//       expect(sendSignInLinkToEmail).toHaveBeenCalled();
//
//       // Vérifier les arguments de l'appel
//       const callArgs = (sendSignInLinkToEmail as jest.Mock).mock.calls[0];
//       expect(callArgs[0]).toBe(mockAuth);
//       expect(callArgs[1]).toBe('test@example.com');
//       expect(callArgs[2].url).toContain('test%40example.com');
//       expect(callArgs[2].handleCodeInApp).toBe(true);
//
//       expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
//         'emailForSignIn',
//         'test@example.com'
//       );
//
//       expect(service.dialog.open).toHaveBeenCalled();
//     });
//
//     it('should show error dialog if email already used with different method', async () => {
//       (fetchSignInMethodsForEmail as jest.Mock).mockResolvedValue(['google.com']);
//
//       // Espionner la méthode showAuthErrorDialog
//       jest.spyOn(service as any, 'showAuthErrorDialog');
//
//       await (service as any).sendEmailLink('test@example.com');
//
//       expect(sendSignInLinkToEmail).not.toHaveBeenCalled();
//       expect(service.dialog.open).toHaveBeenCalled();
//     });
//   });
//
//   describe('confirmSignIn', () => {
//     it('should confirm sign in with email link', async () => {
//       const mockUser = {
//         uid: '123',
//         email: 'test@example.com',
//         displayName: 'Test User',
//         photoURL: null,
//         getIdToken: jest.fn().mockResolvedValue('mock-token')
//       };
//
//       (isSignInWithEmailLink as jest.Mock).mockReturnValue(true);
//       (setPersistence as jest.Mock).mockResolvedValue(undefined);
//       (signInWithEmailLink as jest.Mock).mockResolvedValue({
//         user: mockUser
//       });
//
//       // Espionner les méthodes privées
//       jest.spyOn(service as any, 'sendTokenToBackend').mockResolvedValue({});
//       jest.spyOn(service as any, 'saveUserToBackend').mockResolvedValue({});
//
//       await service.confirmSignIn('test@example.com', 'http://example.com?oobCode=123');
//
//       expect(signInWithEmailLink).toHaveBeenCalledWith(
//         mockAuth,
//         'test@example.com',
//         'http://example.com?oobCode=123'
//       );
//
//       expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('emailForSignIn');
//
//       // Vérifier uniquement les propriétés qui nous intéressent
//       expect(service.user$.value?.uid).toBe('123');
//       expect(service.user$.value?.email).toBe('test@example.com');
//       expect(service.user$.value?.displayName).toBe('Test User');
//       expect(service.user$.value?.photoURL).toBeNull();
//
//       expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
//     });
//
//
//     it('should return null if not a sign-in link', async () => {
//       (isSignInWithEmailLink as jest.Mock).mockReturnValue(false);
//
//       const result = await service.confirmSignIn('test@example.com', 'http://example.com');
//
//       expect(result).toBeNull();
//       expect(signInWithEmailLink).not.toHaveBeenCalled();
//     });
//
//     it('should handle errors during confirmation', async () => {
//       (isSignInWithEmailLink as jest.Mock).mockReturnValue(true);
//       (setPersistence as jest.Mock).mockResolvedValue(undefined);
//       (signInWithEmailLink as jest.Mock).mockRejectedValue(new Error('Invalid link'));
//
//       const result = await service.confirmSignIn('test@example.com', 'http://example.com');
//
//       expect(result).toBeNull();
//       expect(window.alert).toHaveBeenCalledWith('Invalid email or expired Link');
//     });
//   });
//
//   describe('logout', () => {
//     it('should sign out and clear user data', async () => {
//       (signOut as jest.Mock).mockResolvedValue(undefined);
//
//       await service.logout();
//
//       expect(signOut).toHaveBeenCalledWith(mockAuth);
//       expect(mockHttp.post).toHaveBeenCalledWith(
//         `${environment.apiUrl}/auth/logout`,
//         {},
//         { withCredentials: true }
//       );
//       expect(window.history.replaceState).toHaveBeenCalled();
//       expect(service.user$.value).toBeNull();
//       expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
//     });
//   });
// });
