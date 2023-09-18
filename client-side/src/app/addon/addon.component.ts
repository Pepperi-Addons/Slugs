import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ObjectsDataRow, PepLayoutService, PepScreenSizeType, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from "../services/addon.service";
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { AddSlugComponent } from '../addon/Components/Add-Slug/add-slug.component';
import { MatDialogRef } from "@angular/material/dialog";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { GridDataViewField, MenuDataView, Page, Profile } from "@pepperi-addons/papi-sdk";
import { IPepProfileDataViewsCard, IPepProfile, IPepProfileDataViewClickEvent, IPepProfileDataView, IPepProfileDataViewSaveClickEvent } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { ISlugData } from "./addon.model";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { coerceNumberProperty } from "@angular/cdk/coercion";
import { NavigationService } from "../services/navigation.service";

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
    slugsList: Array<ISlugData> = [];
    systemSlugsList: Array<ISlugData> = [];
    // slugsNumLimit = 50 + this.addonService.systemSlugs.length;
    slugsNumLimit: number;
    screenSize: PepScreenSizeType;
    slugSelectionData: PepSelectionData;
    public pager: IPepGenericListPager;

    // Mapping tab variables
    private pagesMap = new Map<string, string>();
    private dataViewsMap = new Map<string, MenuDataView>();
    defaultProfileId: string = '';
    private _allProfiles: ReadonlyArray<IPepProfile> = [];
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
        private navigationService: NavigationService
      
    ) {
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        
        // Fill the pages map first (1)
        this.addonService.pagesChange$.subscribe(pages => {
            pages?.forEach(page => {
                this.pagesMap.set(page.key, page.name);
            });
        });
        
        // Get the available profiles second (2).
        this.addonService.profilesChange$.subscribe(profiles => {
            this._allProfiles = profiles;

            // After the profiles loaded the defaultProfileId is already loaded too.
            this.defaultProfileId = this.addonService.defaultProfileId;
        });

        // Fill the data views third (3).
        this.addonService.dataViewsMapChange$.subscribe((dataViewsMap: ReadonlyMap<string, MenuDataView>) => {
            this.dataViewsMap = new Map<string, MenuDataView>();
            this.profileDataViewsList = [];

            dataViewsMap.forEach(dv => {
                this.createNewProfileDataViewCard(dv);
            });

            this.availableProfiles = this._allProfiles.filter(p => this.profileDataViewsList.findIndex(pdv => pdv.profileId === p.id) === -1);
        });

        const index = coerceNumberProperty(this.activatedRoute.snapshot.queryParamMap.get('tabIndex'), 0);
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
        this.pager = {
            type: 'pages',
            size: 50,
            index: 0
        };
    }
    
    // -----------------------------------------------------------------------------
    //                              Tabs
    // -----------------------------------------------------------------------------
    onTabChanged(tabChangeEvent: MatTabChangeEvent): void {
        this.setCurrentTabIndex(tabChangeEvent.index);
        this.navigationService.navigateToTab(this.currentTabIndex);
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
                            this.editSlug(this.slugSelectionData.rows[0]);
                        }
                    },
                    {
                        title: this.translate.instant("ACTIONS.DELETE"),
                        handler: async (ddd) => {
                            this.showDeleteSlugMSG();
                        }
                    }
                ]
            } else if (data?.rows.length > 1 || data?.selectionType === 0) {
                return [
                    {
                        title: this.translate.instant("ACTIONS.DELETE"),
                        handler: async (ddd) => {
                            this.showDeleteSlugMSG();
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
                let query = 'order_by=Name';
                this.slugsList = await this.addonService.getSlugs(query);
                
                this.systemSlugsList = this.slugsList.filter(slug => slug.System);
                // Init the slugs limit
                this.slugsNumLimit = 50 + this.systemSlugsList.length;

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

    openSlugDLG(slug: ISlugData = null){
       
        // check limitation of num of slugs when add new one
        if(!slug.hasOwnProperty('Key') && this.slugsList.length >= this.slugsNumLimit){
            const dialogData = new PepDialogData({
                content:  this.translate.instant('ADD_SLUG.SLUG_LIMITAION_MSG') + ' (' + this.slugsNumLimit.toString() + ')',
                showHeader: false,
                actionsType: 'close',
                showClose: false,
            });

            this.dialogService.openDefaultDialog(dialogData);
        } else {
            this.openDialog(AddSlugComponent,(res) => {
                if(res){
                    this.dataSource = this.setDataSource();
                }
            }, {'slug': slug,});
        }

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
            this.editSlug(fieldClickEvent.id, false);  
    }
    
    getAllSlugsUUID(){
        let uuids: Array<string> = [];
        this.slugsList.forEach( slug  => {
            uuids.push(slug.Key);
        });
        return uuids;
    }

    editSlug(key: string = null, needToValidate: boolean = true){
            const slug: ISlugData = this.slugsList.find(slug => slug.Key === key);
            this.openSlugDLG(slug);
    }

    showDeleteSlugMSG(callback?: any){
        var self = this;

        if(this.checkIfSlugsCanBeAmended('delete')){
            const dialogData = new PepDialogData({
                content: this.slugSelectionData.rows.length === 1 ? this.translate.instant('ACTIONS.CONFIRM_DELETE') : this.translate.instant('ACTIONS.CONFIRM_MULTI_DELETE'),
                showHeader: false,
                actionsType: 'cancel-delete',
                showClose: false,
            });

            this.dialogService.openDefaultDialog(dialogData).afterClosed()
            .subscribe(async (isDeletePressed) => {
                if (isDeletePressed) {
                    await this.deleteSlugs();
                }
            });
        }
    }

    async deleteSlugs(){
        await this.addonService.upsertSlug(null, true, this.slugSelectionData);
        this.dataSource = this.setDataSource();
    }

    checkIfSlugsCanBeAmended(oper: string, key: string = null){
        let ret = true;

        const deleteType = this.slugSelectionData.selectionType === 1 && this.slugSelectionData.rows.length > 0 ? 'include' :
                           this.slugSelectionData.selectionType === 0 && this.slugSelectionData.rows.length === 0 ? 'all' : 'exclude';

        if (deleteType === 'all') {
            ret = false;
        }
        else {
            this.systemSlugsList.forEach(sysSlug => {
                if (deleteType === 'include' && this.slugSelectionData.rows.includes(sysSlug.Key)) {
                    ret = false;
                } else if (deleteType === 'exclude' && !this.slugSelectionData.rows.includes(sysSlug.Key)) {
                    ret = false;
                }
                
            });
        }

        if(!ret){
            return this.showSystemSlugMSG(oper);
        }
        else{
            return ret;
        }   
    }

    showSystemSlugMSG(oper: string){
        const dialogData = new PepDialogData({
            content: oper === 'delete' ? this.translate.instant('ACTIONS.CANT_DELETE') : this.translate.instant('ACTIONS.CANT_EDIT'),
            showHeader: false,
            //actionsType: this.slugSelectionData.rows.length === 1 ? 'close' : 'cancel-continue',
            actionsType: 'close',
            showClose: false,
        });

        this.dialogService.openDefaultDialog(dialogData).afterClosed()
        .subscribe(() => {
            return false;
        });
    }

    // -----------------------------------------------------------------------------
    //                              Mappings tab
    // -----------------------------------------------------------------------------
    
    private createNewProfileDataViewCard(dataView: MenuDataView) {
        this.dataViewsMap.set(dataView.InternalID.toString(), dataView);

        const profileDataView: IPepProfileDataViewsCard = {
            title: dataView.Context?.Profile?.Name, // dataView.Title,
            profileId: dataView.Context?.Profile?.InternalID.toString(),
            dataViews: [{
                dataViewId: dataView.InternalID.toString(),
                viewType: dataView.Context?.ScreenSize,
                fields: dataView.Fields?.map(field => {
                    return `${field.FieldID} - ${this.pagesMap.get(field.Title) || ''}: (${field.Title})`;
                })
            }]
        };

        this.profileDataViewsList.push(profileDataView);
    }
    
    onDataViewEditClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`edit on ${event.dataViewId} was clicked`);
        this.navigationService.navigateToDataView(event.dataViewId);
    }

    onDataViewDeleteClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`delete on ${event.dataViewId} was clicked`);
        
        this.dialogService.openDefaultDialog(new PepDialogData({
            title: this.translate.instant('MESSAGES.DIALOG_DELETE_TITLE'),
            content: this.translate.instant('MESSAGES.DELETE_DIALOG_CONTENT'),
            actionsType: 'cancel-delete'
        })).afterClosed().subscribe(isDeleteClicked => {
            if (isDeleteClicked) {
                const dataView = this.dataViewsMap.get(event.dataViewId);
                if (dataView) {
                    this.addonService.deleteSlugsDataView(dataView).then(res => {
                        this.dialogService.openDefaultDialog(new PepDialogData({
                            title: this.translate.instant('MESSAGES.DIALOG_INFO_TITLE'),
                            content: this.translate.instant('MESSAGES.OPERATION_SUCCESS_CONTENT')
                        }));
                    });
                }
            }
        });
    }

    onSaveProfileClicked(event: IPepProfileDataViewSaveClickEvent): void {
        console.log(`save profile was clicked for id - ${event.profileId} `);
        const profileId: number = coerceNumberProperty(event.profileId);

        if (profileId > 0) {
            const dataViewToCopyFrom = this.profileDataViewsList.find(p => p.profileId === event.copyFromProfileId)?.dataViews[0] || null;
            const dataViewToOverride = this.profileDataViewsList.find(p => p.profileId === event.profileId)?.dataViews[0];
            this.addonService.createSlugsDataView(profileId, dataViewToCopyFrom, dataViewToOverride);
        }
    }
}
