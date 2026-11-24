import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Finance',
    loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'add',
    title: 'Add expense',
    loadComponent: () => import('./features/expense-entry/expense-entry.page').then((m) => m.ExpenseEntryPage),
  },
  {
    path: 'settings',
    title: 'Settings',
    loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];
