import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { TranslateModule } from '@ngx-translate/core';

import { ManageSlugsComponent } from './manage-slugs.component';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSideBarModule } from '@pepperi-addons/ngx-lib/side-bar';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDateModule } from '@pepperi-addons/ngx-lib/date';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PepIconModule } from '@pepperi-addons/ngx-lib/icon';

export const routes: Routes = [
    {
        path: '',
        component: ManageSlugsComponent
    }
];

@NgModule({
    declarations: [
        ManageSlugsComponent        
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        DragDropModule,
        MatIconModule,
        PepNgxLibModule,
        PepTopBarModule,
        PepSideBarModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepIconModule,
        PepTextboxModule,
        PepTextareaModule,
        PepDraggableItemsModule,
        PepSelectModule,
        PepMenuModule,
        PepDateModule,
        PepCheckboxModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports:[
        ManageSlugsComponent
    ],
    
})
export class ManageSlugsModule {
    
}
