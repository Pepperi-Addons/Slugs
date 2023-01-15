import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddSlugComponent } from './add-slug.component';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [
        AddSlugComponent
    ],
    imports: [
        CommonModule,
        PepTopBarModule,
        PepTextboxModule,
        PepButtonModule,
        PepTextareaModule,
        PepSelectModule,
        PepDialogModule,
        TranslateModule.forChild(),
    ],
    exports: [AddSlugComponent]
})
export class AddSlugModule { }