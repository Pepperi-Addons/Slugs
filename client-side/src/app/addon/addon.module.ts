import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';

import { PepNgxLibModule, PepFileService, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose, pepIconArrowDownAlt, pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { PepProfileDataViewsListModule } from '@pepperi-addons/ngx-lib/profile-data-views-list';
// import { PepListModule } from '@pepperi-addons/ngx-lib/list';
// import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { AddSlugModule } from '../addon/Components/Add-Slug/add-slug.module';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonService } from '../services/addon.service';
import { AddonComponent } from './index';
import { ManageSlugs } from './form/manage-slugs.component';

const pepIcons = [
    pepIconSystemClose,
    pepIconArrowDownAlt,
    pepIconSystemBin
];

export const routes: Routes = [
    {
        path: '',
        component: AddonComponent
    }
];

@NgModule({
    declarations: [
        AddonComponent,
        ManageSlugs
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        DragDropModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepSizeDetectorModule,
        MatIconModule,
        PepIconModule,
        PepTopBarModule,
        PepMenuModule,
        PepDraggableItemsModule,
        PepProfileDataViewsListModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepDialogModule,
        // PepListModule,
        // PepSearchModule,
        PepTextboxModule,
        PepSelectModule,
        MatDialogModule,
        MatTabsModule,
        PepGenericListModule,
        AddSlugModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports:[AddonComponent],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        AddonService
    ]
})
export class AddonModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
