import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ObjectsDataRow, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from "../services/addon.service";
// import { GenericListComponent, GenericListDataSource } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { GenericListComponent, IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { ActivatedRoute, Router } from "@angular/router";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { AddSlugComponent, ISlug } from '../addon/Components/Add-Slug/add-slug.component';
import { MatDialogRef } from "@angular/material/dialog";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [AddSlugComponent]
})
export class AddonComponent implements OnInit {

    @ViewChild(GenericListComponent) slugsList: GenericListComponent;
    
    screenSize: PepScreenSizeType;

    constructor(
        public addonService: AddonService,
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public dialogService: PepDialogService
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }

    async ngOnInit() {
        
    }

    dataSource: IPepGenericListDataSource = {
    //slugsDataSource: GenericListDataSource = {
        
        getList: async (state) => {
            let res = await this.addonService.getSlugs();
            
            if (state.searchString != "") {
              //res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
            }
            return res;
        },
        totalCount: 2, // TODO - SET THIS PARAM
        dataView: {
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
                    },
                    {
                        FieldID: "PageType",
                        Type: 'TextBox',
                        Title: this.translate.instant("SLUGS_TAB.PAGE_TYPE"),
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
                      Width: 18
                    },
                    {
                      Width: 17
                    }
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
        }
        
    }

    actions: IPepGenericListActions = {        
        get: async (data: PepSelectionData) => {
            if (data?.selectionType === 0) {
                /*const list = await this.dataSource.getList({ searchString: '', fromIndex: 0, toIndex: 20 });
                if (list?.length === data?.rows.length) {
                    return [];
                } */
            }
            if (data?.rows.length === 1 && data?.selectionType !== 0) {
                return [
                    {
                        title: this.translate.instant("ACTIONS.EDIT"),
                        handler: async (ddd) => {
                            let dataRow = this.slugsList.customList.getItemDataByID(data.rows[0]);
                            this.editSlug(dataRow);
                        }
                    },
                    {
                        title: this.translate.instant("ACTIONS.DELETE"),
                        handler: async (ddd) => {
                            this.showDeleteAssetMSG();
                        }
                    }
                ]
            } else if (data?.rows.length > 1 || data?.selectionType === 0) {
                return [
                    {
                        title: this.translate.instant("ACTIONS.DELETE"),
                        handler: async (ddd) => {
                            this.showDeleteAssetMSG();
                        }
                    }
                ]
            } else return [];
        }
    }

    addNewSlug(slug: ISlug = null){
       
        this.openDialog(AddSlugComponent,(res) => {
            // TODO - CREATE NEW SLUG
        }, {'slug': slug,});

    }

    openDialog(comp: any, callBack, data = {}){
    
        let config = this.dialogService.getDialogConfig({}, 'inline');
            config.disableClose = true;
            config.minWidth = '29rem'; // THE EDIT MODAL WIDTH
    
        let dialogRef: MatDialogRef<any> = this.dialogService.openDialog(comp, data, config);
    
        dialogRef.afterClosed().subscribe((value) => {
            if (value !== undefined && value !== null) {
               callBack(value);
            }
        });
    }

    openDialogMsg(dialogData: PepDialogData, callback?: any) {
    
        this.dialogService.openDefaultDialog(dialogData).afterClosed()
                .subscribe((isDeletePressed) => {
                    if (isDeletePressed) {
                        callback();
                    }
            });
    }
    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
         let dr = this.slugsList.customList.getItemDataByID(fieldClickEvent.id);
         this.editSlug(dr);  
    }

    editSlug(dr: ObjectsDataRow){
        let slug = new ISlug();
         slug.name = dr.Fields[0].FormattedValue;
         slug.description = dr.Fields[1].FormattedValue;
         slug.slugURL = dr.Fields[2].FormattedValue;

         this.addNewSlug(slug);
    }

    showDeleteAssetMSG(callback?: any){
        
        const dialogData = new PepDialogData({
          
          content: this.translate.instant('GRID.CONFIRM_DELETE'),
          showHeader: false,
          actionsType: 'cancel-delete',
          showClose: false,
        });
        this.dialogService.openDefaultDialog(dialogData).afterClosed()
        .subscribe((isDeletePressed) => {
            if (isDeletePressed) {
                let selectedSlugs = this.slugsList.customList.getSelectedItemsData();
                debugger;
            }
    });
        

       //this.openDialogMsg(dialogData,(data) => {
        //debugger;
           //let res = await this.addonService.deleteSlug();
       //})
  }
}
