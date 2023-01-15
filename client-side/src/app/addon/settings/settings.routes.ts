import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        children: [
            {
                path: ':dataview_id',
                loadChildren: () => import('../form/manage-slugs.module').then(m => m.ManageSlugsModule)
            },
            {
                path: '**',
                loadChildren: () => import('../../addon/addon.module').then(m => m.AddonModule)
            },
            // { path: '**', component: EmptyRouteComponent }
        ]
    }
];
@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



