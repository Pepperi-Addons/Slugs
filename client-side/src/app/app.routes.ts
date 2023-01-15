import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        children: [
            {
                path: '**',
                loadChildren: () => import('./addon/settings/settings.module').then(m => m.SettingsModule),
            }
            // { path: '**', component: EmptyRouteComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }



