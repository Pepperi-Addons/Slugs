import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ObjectsDataRow, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from "../services/addon.service";
// import { GenericListComponent, GenericListDataSource } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { GenericListComponent, IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { ActivatedRoute, Router } from "@angular/router";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { AddSlugComponent, ISlug } from '../addon/Components/Add-Slug/add-slug.component';
import { MatDialogRef } from "@angular/material/dialog";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { GridDataViewField } from "@pepperi-addons/papi-sdk";

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [AddSlugComponent]
})
export class AddonComponent implements OnInit {
   
    dataSource: IPepGenericListDataSource;
    slugsList: Array<any>;
    screenSize: PepScreenSizeType;
    slugSelectionData: PepSelectionData;
    public pager: IPepGenericListPager;

    constructor(
        public addonService: AddonService,
        public router: Router,
        public route: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        private genericListService: PepGenericListService,
       
    ) {
        this.dataSource = this.setDataSource();
        
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }

    async ngOnInit() {
        this.pager = {
            type: 'pages',
            size: 10,
            index: 0
        };
    }

    actions: IPepGenericListActions = {        
        get: async (data: PepSelectionData) => {
            this.slugSelectionData = data;
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
                            this.editSlug(this.slugSelectionData.rows);
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
            } 
            else {
            return [];
            }
        }
    }

    setDataSource() {
        return {
        
            init: async (state) => {
                this.slugsList = await this.addonService.getSlugs();
                
                if (state.searchString != "") {
                  //res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
                }
                return {
                    items: this.slugsList,
                    totalCount: this.slugsList.length,
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
                                Type: 'Link',
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
                             }//,
                            // {
                            //     FieldID: "PageType",
                            //     Type: 'TextBox',
                            //     Title: this.translate.instant("SLUGS_TAB.PAGE_TYPE"),
                            //     Mandatory: false,
                            //     ReadOnly: true
                            // }
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
                            }//,
                            // {
                            //   Width: 17
                            // }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                }
                } as IPepGenericListInitData;//res;
            }  
        }
    }
    openSlugDLG(slug: ISlug = null){
       
        this.openDialog(AddSlugComponent,(res) => {
            if(res){
                this.dataSource = this.setDataSource();
            }
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
         //let dr = this.slugsList.customList.getItemDataByID(fieldClickEvent.id);
         this.editSlug([fieldClickEvent.id]);  
    }
    
    getAllSlugsUUID(){
        let uuids: Array<string> = [];
        this.slugsList.forEach( slug  => {
            uuids.push(slug.Key);
        });
        return uuids;
    }

    getSelectedSlug(){
        
        let dr: ObjectsDataRow = this.genericListService.getItemById(this.slugSelectionData.rows[0]);
        let slug = new ISlug();
        
            slug.Name = dr.Fields[0].FormattedValue;
            slug.Description = dr.Fields[1].FormattedValue;
            slug.Slug = dr.Fields[2].FormattedValue;
            slug.Key = dr.UID;
        
        return slug;
    }

    editSlug(keys: Array<string>){
         this.openSlugDLG(this.getSelectedSlug());
    }

    showDeleteAssetMSG(callback?: any){
        var self = this;
        const dialogData = new PepDialogData({
          
          content: this.translate.instant('ACTIONS.CONFIRM_DELETE'),
          showHeader: false,
          actionsType: 'cancel-delete',
          showClose: false,
        });
        this.dialogService.openDefaultDialog(dialogData).afterClosed()
        .subscribe((isDeletePressed) => {
            if (isDeletePressed) {
                
                //let slugs =  self.getSlugByID(self.slugSelectionData);
 
                this.addonService.upsertSlug(null, true, self.slugSelectionData, (res) => {
                    this.dataSource = this.setDataSource();
                });
  

            }
    });
  }
}
