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
import { AddonComponent } from './index';
import { PepLinkModule } from '@pepperi-addons/ngx-lib/link';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';

export const routes: Routes = [
    {
        path: '',
        component: AddonComponent
    }
];

@NgModule({
    declarations: [
        AddonComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        DragDropModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        MatIconModule,
        PepTopBarModule,
        PepMenuModule,
        PepDraggableItemsModule,
        PepProfileDataViewsListModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepDialogModule,
        PepLinkModule,
        PepListModule,
        // PepSearchModule,
        PepTextboxModule,
        PepSelectModule,
        MatDialogModule,
        MatTabsModule,
        PepGenericListModule,
        AddSlugModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports:[AddonComponent],
})
export class AddonModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
