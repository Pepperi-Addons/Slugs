import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsRoutingModule } from './settings.routes';
import { SettingsComponent } from './settings.component';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { NavigationService } from '../../services/navigation.service';
import { config } from '../../addon.config';
import { AddonService } from 'src/app/services/addon.service';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { IsUrlPipe } from '@pepperi-addons/ngx-lib/link';

@NgModule({
    declarations: [
        SettingsComponent
    ],
    imports: [
        CommonModule,
        PepNgxLibModule,
        PepDialogModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        SettingsRoutingModule,
    ],
    providers: [
        TranslateStore,
        NavigationService,
        AddonService,
        IsUrlPipe
    ]
})
export class SettingsModule {
    constructor(
        translate: TranslateService,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }
}
