import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ObjectsDataRow, PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from "../services/addon.service";
// import { GenericListComponent, GenericListDataSource } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { GenericListComponent, IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepDialogActionButton, PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { AddSlugComponent } from '../addon/Components/Add-Slug/add-slug.component';
import { MatDialogRef } from "@angular/material/dialog";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { GridDataViewField } from "@pepperi-addons/papi-sdk";
import { IPepProfileDataViewsCard, IPepProfile, IPepProfileDataView, IPepProfileDataViewClickEvent } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { sys } from "typescript";
import { Slug } from "./addon.model";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { filter } from 'rxjs/operators';

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [AddSlugComponent]
})
export class AddonComponent implements OnInit {
    currentTabIndex: number = 0;

    // Slugs tab variables
    dataSource: IPepGenericListDataSource = null;
    slugsList: Array<any>;
    screenSize: PepScreenSizeType;
    slugSelectionData: PepSelectionData;
    public pager: IPepGenericListPager;

    // Mapping tab variables
    defaultProfile: IPepProfileDataViewsCard;
    availableProfiles: Array<IPepProfile> = [];
    profileDataViewsList: Array<IPepProfileDataViewsCard> = [];

    constructor(
        public addonService: AddonService,
        public router: Router,
        public activatedRoute: ActivatedRoute,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public utilitiesService: PepUtilitiesService,
        private genericListService: PepGenericListService,
       
    ) {
        
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        
        const index = this.utilitiesService.coerceNumberProperty(this.activatedRoute.snapshot.queryParamMap.get('tabIndex'), 0);
        this.setCurrentTabIndex(index);
    }

    private setCurrentTabIndex(index: number) {
        this.currentTabIndex = index;

        // Load the datasource only if not loaded already and the current tab is the first tab.
        if (this.currentTabIndex === 0 && this.dataSource === null) {
            this.dataSource = this.setDataSource();
        }
    }

    ngOnInit() {
        this.setProfiles();

        this.pager = {
            type: 'pages',
            size: 10,
            index: 0
        };
    }
    
    // -----------------------------------------------------------------------------
    //                              Tabs
    // -----------------------------------------------------------------------------
    onTabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.setCurrentTabIndex(tabChangeEvent.index);
        
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: { tabIndex: this.currentTabIndex }, 
            queryParamsHandling: 'merge', // remove to replace all query params by provided
        });
    }
    
    // -----------------------------------------------------------------------------
    //                              Slugs tab
    // -----------------------------------------------------------------------------

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

    openSlugDLG(slug: Slug = null){
       
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

    editSlug(keys: Array<string>){

        if(this.checkIfSlugsCanBeAmended('edit')){
            let dr: ObjectsDataRow = this.genericListService.getItemById(keys[0]);
            let slug = new Slug();
            
                slug.Name = dr.Fields[0].FormattedValue;
                slug.Description = dr.Fields[1].FormattedValue;
                slug.Slug = dr.Fields[2].FormattedValue;
                slug.Key = dr.UID;

            this.openSlugDLG(slug);
        }
    }

    showDeleteAssetMSG(callback?: any){
        var self = this;

        if(this.checkIfSlugsCanBeAmended('delete')){
            const dialogData = new PepDialogData({
                content: this.slugSelectionData.rows.length === 1 ? this.translate.instant('ACTIONS.CONFIRM_DELETE') : this.translate.instant('ACTIONS.CONFIRM_MULTI_DELETE'),
                showHeader: false,
                actionsType: 'cancel-delete',
                showClose: false,
            });

            this.dialogService.openDefaultDialog(dialogData).afterClosed()
            .subscribe((isDeletePressed) => {
                if (isDeletePressed) {
                    this.deleteSlugs();

                }
            });
        }
    }

    deleteSlugs(){
        this.addonService.upsertSlug(null, true, this.slugSelectionData, (res) => {
            this.dataSource = this.setDataSource();
        });
    }

    checkIfSlugsCanBeAmended(oper: string){
        let ret = true;

        const deleteType = this.slugSelectionData.selectionType === 1 && this.slugSelectionData.rows.length > 0 ? 'include' :
                           this.slugSelectionData.selectionType === 0 && this.slugSelectionData.rows.length === 0 ? 'all' : 'exclude';

        if( deleteType === 'all'){
            ret = false;
        }
        else{
            this.addonService.systemSlugs.forEach( sysSlug  => {
                
                if(deleteType === 'include' && this.slugSelectionData.rows.includes(sysSlug.Key)){
                    ret = false;
                }
                else if(deleteType === 'exclude' && !this.slugSelectionData.rows.includes(sysSlug.Key)){
                    ret = false;
                }
                
            });
        }

        if(!ret){
                const dialogData = new PepDialogData({
                    content: oper === 'delete' ? this.translate.instant('ACTIONS.CANT_DELETE') : this.translate.instant('ACTIONS.CANT_EDIT'),
                    showHeader: false,
                    //actionsType: this.slugSelectionData.rows.length === 1 ? 'close' : 'cancel-continue',
                    actionsType: 'close',
                    showClose: false,
                });
    
                this.dialogService.openDefaultDialog(dialogData).afterClosed()
                .subscribe(() => {
                    return ret;
                });
        }
        else{
            return ret;
        }
        
    }

    // -----------------------------------------------------------------------------
    //                              Mappings tab
    // -----------------------------------------------------------------------------
    // TODO: Implement this
    private setProfiles() {
        const repDataViews: IPepProfileDataView[] = [{
            dataViewId: '1',
            fields: ['field1', 'field2'],
            viewType: 'Landscape'
        }];

        this.defaultProfile = {
            profileId: '123',
            title: 'Rep 1',
            dataViews: repDataViews
        };

        const buyerDataViews: IPepProfileDataView[] = [{
            dataViewId: '2',
            fields: [],
            viewType: 'Landscape'
        }];

        const profile2 = {
            profileId: '345',
            title: 'Buyer 1',
            dataViews: buyerDataViews
        };

        this.profileDataViewsList = [this.defaultProfile, profile2];

        this.availableProfiles = [{
            id: '123',
            name: 'Rep'
        }, {
            id: '1234',
            name: 'Rep Agent'
        }, {
            id: '345',
            name: 'Buyer'
        }, {
            id: '678',
            name: 'Admin'
        }]
    }
    
    private navigateToManageSlugsDataview(dataviewId: string) {
        this.router.navigate([dataviewId], {
            relativeTo: this.activatedRoute,
            queryParams: {
                'tabIndex': null
            },
            queryParamsHandling: 'merge'
        });
    }
    
    onDataViewEditClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`edit on ${event.dataViewId} was clicked`);
        this.navigateToManageSlugsDataview(event.dataViewId);
    }

    onDataViewDeleteClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`delete on ${event.dataViewId} was clicked`);
    }

    onSaveNewProfileClicked(event: string): void {
        console.log(`save new profile was clicked for id - ${event} `);
    }
}
