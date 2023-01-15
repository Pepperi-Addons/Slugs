import { Component, OnInit } from '@angular/core';
import {  TranslateService } from '@ngx-translate/core';
import { PepCustomizationService } from '@pepperi-addons/ngx-lib';

@Component({
    selector: 'addon-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        public translate: TranslateService,
        public customizationService: PepCustomizationService
    ) {
    }

    ngOnInit() {
        // this.customizationService.setThemeVariables();
    }
}
