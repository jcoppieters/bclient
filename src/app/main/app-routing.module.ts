import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('../login/login.module').then(m => m.LoginPageModule)
  },{
    path: 'module/:id', canActivate: [AuthGuard], 
    loadChildren: () => import('../modules/module.module').then(m => m.ModulePageModule)
  },{
    path: 'module', pathMatch: "full", redirectTo: "/module/clients"
  },{ 
    path: '', pathMatch: "full", redirectTo: "/login"
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
