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
import { IPepOption } from '@pepperi-addons/ngx-lib';
import { GridDataViewField, MenuDataView, Page, Profile } from "@pepperi-addons/papi-sdk";
import { IPepProfileDataViewsCard, IPepProfile, IPepProfileDataViewClickEvent, IPepProfileDataView } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { Slug } from "./addon.model";
import { MatTabChangeEvent } from "@angular/material/tabs";

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
    private pagesMap = new Map<string, string>();
    private dataViewsMap = new Map<string, MenuDataView>();
    defaultProfileId: string = '';
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
        this.loadDataViewsAndProfiles();

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
    private createDefaultSlugsDataView() {
        const profileId: number = this.utilitiesService.coerceNumberProperty(this.defaultProfileId);
        this.createNewSlugsDataViewForProfile(profileId);
    }

    private createNewSlugsDataViewForProfile(profileId: number) {
        if (profileId > 0) {
            this.addonService.createNewSlugsDataView(profileId).then(dataView => {
                this.createNewProfileDataViewCard(dataView);
            });
        }
    }

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

    private loadDataViewsAndProfiles() {
        // Get the available profiles.
        this.addonService.getProfiles().then((profiles: Profile[]) => {
            if (profiles?.length > 0) {
                this.availableProfiles = profiles.map(profile => {
                    return { id: profile.InternalID.toString(), name: profile.Name }
                });

                const repProfile = this.availableProfiles.find(profile => profile.name.toLowerCase() === 'rep');
                this.defaultProfileId = repProfile?.id || '';
            }

            // TODO: Create default for rep profile?
            // if (this.defaultProfileId === '') {
            // }
        });

        // Load the pages id & names.
        this.addonService.getPages().then((pages: Page[]) => {
            // Fill the pages map
            pages.forEach(page => {
                this.pagesMap.set(page.Key, page.Name);
            });

            // Get the slugs dataviews.
            this.addonService.getSlugsDataViews().then((dataViews: MenuDataView[]) => {
                if (dataViews?.length > 0) {
                    this.dataViewsMap.clear();
                    this.profileDataViewsList = [];

                    // Fill the dataViews map
                    dataViews.forEach(dataView => {
                        this.createNewProfileDataViewCard(dataView);
                    });
                } else {
                    this.createDefaultSlugsDataView();
                }
            });
        });
    }
    
    private navigateToManageSlugsDataView(dataViewId: string) {
        this.router.navigate([dataViewId], {
            relativeTo: this.activatedRoute,
            queryParams: {
                'tabIndex': null
            },
            queryParamsHandling: 'merge'
        });
    }
    
    onDataViewEditClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`edit on ${event.dataViewId} was clicked`);
        this.navigateToManageSlugsDataView(event.dataViewId);
    }

    onDataViewDeleteClicked(event: IPepProfileDataViewClickEvent): void {
        console.log(`delete on ${event.dataViewId} was clicked`);
        const dataView = this.dataViewsMap.get(event.dataViewId);
        if (dataView) {
            this.addonService.deleteSlugsDataView(dataView);
        }
    }

    onSaveNewProfileClicked(event: string): void {
        console.log(`save new profile was clicked for id - ${event} `);
        const profileId: number = this.utilitiesService.coerceNumberProperty(event);
        this.createNewSlugsDataViewForProfile(profileId);
    }
}
