import { Injector, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PepAddonService } from '@pepperi-addons/ngx-lib';

import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';
import { PepIconRegistry, PepIconModule, pepIconSystemClose, pepIconArrowDownAlt, pepIconSystemBin, pepIconNumberPlus, pepIconSystemEdit, pepIconSystemMenu, pepIconArrowLeft, pepIconArrowRight, pepIconSystemFullScreen, pepIconSystemSearch, pepIconSystemMove } from '@pepperi-addons/ngx-lib/icon';

import { AppRoutingModule } from './app.routes';
import { AppComponent } from './app.component';
import { config } from './addon.config';
import { SettingsComponent, SettingsModule } from './addon/settings';



const pepIcons = [
    pepIconSystemClose,
    pepIconArrowDownAlt,
    pepIconSystemBin,
    pepIconNumberPlus,
    pepIconSystemEdit,
    pepIconSystemMenu,
    pepIconArrowLeft,
    pepIconArrowRight,
    pepIconSystemFullScreen,
    pepIconSystemSearch,
    pepIconSystemMove
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        PepIconModule,
        SettingsModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        })
    ],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
    ],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService
        ) {
            this.pepAddonService.setDefaultTranslateLang(translate);
            this.pepIconRegistry.registerIcons(pepIcons);
    }

    ngDoBootstrap() {
        this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, SettingsComponent, this.injector);
    }
}