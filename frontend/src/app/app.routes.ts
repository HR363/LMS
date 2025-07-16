import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { Signup } from '../signup/signup';
import { Login } from './login/login';
import { CourseCategoryComponent } from './course-category/course-category.component';
import { CoursePageComponent } from './course-page/course-page.component';
import { CourseLearningComponent } from './course-learning/course-learning.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ProfileComponent } from './profile/profile.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { CourseCreationComponent } from './course-creation/course-creation.component';
import { CartComponent } from './cart/cart.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { MessagesComponent } from './messages/messages.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { adminAuthGuard, preventAdminGuard } from './services/admin-auth.guard';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'courses', component: CourseCategoryComponent },
  { path: 'course/:id', component: CoursePageComponent },
  { path: 'learn/:id', component: CourseLearningComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'course-creation', component: CourseCreationComponent },
  { path: 'course-creation/:id', component: CourseCreationComponent },
  { path: 'cart', component: CartComponent, canActivate: [preventAdminGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [preventAdminGuard] },
  { path: 'messages', component: MessagesComponent, canActivate: [preventAdminGuard] },
  { path: 'achievements', component: AchievementsComponent },
  {
    path: 'admin-dashboard',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
];
