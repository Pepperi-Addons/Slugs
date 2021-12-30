import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';

import { AddonService } from "../services/addon.service";
import { GenericListDataSource } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss']
})
export class AddonComponent implements OnInit {
    @Input() hostObject: any;
    
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    
    screenSize: PepScreenSizeType;

    constructor(
        public addonService: AddonService,
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }

    async ngOnInit() {
        const desktopTitle = await this.translate.get('SLUGS').toPromise();
    }

    openDialog() {
        
    }

    slugsDataSource: GenericListDataSource = {
        getList: async (state) => {
            return [
                {
                    Key: 'Name',
                    Name: 'Home Page',
                    Description: 'Ottawa',
                    Slug: '/homepage'
                },
                {
                    Key: 'Description',
                    Name: 'Dashboard',
                    Description: 'Monterrey',
                    Slug: '/dashboard'
                }
            ]
        },

        getDataView: async () => {
            return {
                Context: {
                    Name: '',
                    Profile: { InternalID: 0 },
                    ScreenSize: 'Landscape'
                  },
                  Type: 'Grid',
                  Title: '',
                  Fields: [
                    {
                        FieldID: "Name",
                        Type: 'TextBox',
                        Title: this.translate.instant("SLUGS_TAB.NAME"),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: "Description",
                        Type: 'TextBox',
                        Title: this.translate.instant("SLUGS_TAB.DESCRIPTION"),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: "Slug",
                        Type: 'TextBox',
                        Title: this.translate.instant("SLUGS_TAB.SLUG"),
                        Mandatory: false,
                        ReadOnly: true
                    }
                  ],
                  Columns: [
                    {
                      Width: 25
                    },
                    {
                      Width: 40
                    },
                    {
                      Width: 35
                    }
                  ],
                  FrozenColumnsCount: 0,
                  MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) =>  {
            return objs.length ? [
                {
                    title: this.translate.instant("ACTIONS.EDIT"),
                    handler: async (objs) => {
                        this.router.navigate([objs[0].Key], {
                            relativeTo: this.route,
                            queryParamsHandling: 'merge'
                        });
                    }
                },
                {
                    title: this.translate.instant("ACTIONS.DELETE"),
                    handler: async (objs) => {
                        this.router.navigate([objs[0].Key], {
                            relativeTo: this.route,
                            queryParamsHandling: 'merge'
                        });
                    }
                }
            ] : []
        }
    }

    onCustomizeFieldClick(event){
        debugger;
    }
}
