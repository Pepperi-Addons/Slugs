import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { MenuDataView, PapiClient } from '@pepperi-addons/papi-sdk';
import { IPepOption, PepHttpService, PepSessionService, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { config } from 'src/app/addon.config';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { ISlugData } from '../addon/addon.model';
import { IPepProfile } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { coerceNumberProperty } from '@angular/cdk/coercion';


interface IPageProj {
    key: string, 
    name: string
}
@Injectable({ providedIn: 'root' })
export class AddonService {
    private addonUUID;
    private readonly SLUGS_DATAVIEW_NAME = 'Slugs';

    // This subjects is for load the data views into map for better performance.
    private _dataViewsMap = new Map<string, MenuDataView>();
    get dataViewsMap(): ReadonlyMap<string, MenuDataView> {
        return this._dataViewsMap;
    }
    private _dataViewsMapSubject = new BehaviorSubject<ReadonlyMap<string, MenuDataView>>(this.dataViewsMap);
    get dataViewsMapChange$(): Observable<ReadonlyMap<string, MenuDataView>> {
        return this._dataViewsMapSubject.asObservable();
    }

    private _pages: Array<IPageProj> = null;
    // get pages(): ReadonlyArray<IPageProj> {
    //     return this._pages;
    // }
    private _pagesSubject = new BehaviorSubject<ReadonlyArray<IPageProj>>(this._pages);
    
    get pagesChange$(): Observable<ReadonlyArray<IPageProj>> {
        return this._pagesSubject.asObservable();
    }

    private _headers: Array<IPepOption> = null;
    private _headersSubject = new BehaviorSubject<ReadonlyArray<IPepOption>>(this._headers);
    
    get headersChange$(): Observable<ReadonlyArray<IPepOption>> {
        return this._headersSubject.asObservable();
    }

    private _profiles: Array<IPepProfile> = [];
    // get profiles(): ReadonlyArray<IPepProfile> {
    //     return this._profiles;
    // }
    private _profilesSubject = new BehaviorSubject<ReadonlyArray<IPepProfile>>(this._profiles);
    get profilesChange$(): Observable<ReadonlyArray<IPepProfile>> {
        return this._profilesSubject.asObservable();
    }

    private _defaultProfileId: string = '';
    get defaultProfileId(): string {
        return this._defaultProfileId;
    }

    private _devServer = false;
    get devServer(): boolean {
        return this._devServer;
    }

    constructor(
        public sessionService: PepSessionService,
        public utilitiesService: PepUtilitiesService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        private httpService: PepHttpService,
        private route: ActivatedRoute,
    ) {
        this.addonUUID = config.AddonUUID;
        // this.addonURL = `/addons/data/${this.addonUUID}/Slugs`;
        // const accessToken = this.sessionService.getIdpToken();
        // this.parsedToken = jwt(accessToken);
        // this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
        this._devServer = this.route.snapshot.queryParamMap.get('devServer') === 'true';

        this.loadSlugsDataViewsData();
    }

    private getBaseUrl(addonUUID: string): string {
        // For devServer run server on localhost.
        if(this.devServer) {
            return `http://localhost:4500/api`;
        } else {
            const baseUrl = this.sessionService.getPapiBaseUrl();
            return `${baseUrl}/addons/api/${addonUUID}/api`;
        }
    }

    private clearData() {
        this._profiles = [];
        this._pages = [];
        this._dataViewsMap.clear();
    }
    
    private notifySlugsDataViewsMapChange() {
        this._dataViewsMapSubject.next(this.dataViewsMap);
    }
    
    private notifyPagesChange() {
        this._pagesSubject.next(this._pages);
    }
    
    private notifyHeaderChange() {
        this._headersSubject.next(this._headers);
    }
    
    private notifyProfilesChange() {
        this._profilesSubject.next(this._profiles);
    }

    private upsertDataViewToMap(dataView: MenuDataView) {
        const id = dataView.InternalID?.toString();
        if (id && id.length > 0) {
            this._dataViewsMap.set(id, dataView as MenuDataView);
        }
    }

    private upsertSlugDataView(dataView: MenuDataView) {
        return this.httpService.postPapiApiCall('/meta_data/data_views', dataView).toPromise();
    }

    private showErrorDialog(err: string) {
        // Show error msg
        const errorMsg = this.translate.instant('MESSAGES.DIALOG_ERROR_CONTENT');
        // const errorDetailsMsg = this.translate.instant('MESSAGES.DIALOG_ERROR_DETAILS', { error: dva.error });
        this.dialogService.openDefaultDialog(new PepDialogData({
            title: this.translate.instant('MESSAGES.DIALOG_ERROR_TITLE'),
            content: errorMsg // + ' ' + errorDetailsMsg
        }));
    }

    async getSlugs(query?: string) {
        const baseUrl = this.getBaseUrl(this.addonUUID);
        return this.httpService.getHttpCall(`${baseUrl}/slugs?${query || ''}`).toPromise();
    }

    async loadSlugsDataViewsData() {
        this.clearData();

        const baseUrl = this.getBaseUrl(this.addonUUID);
        const res = await this.httpService.getHttpCall(`${baseUrl}/get_slugs_data_views_data`).toPromise();
        
        try{
            const appHeaderUUID = '9bc8af38-dd67-4d33-beb0-7d6b39a6e98d';
            const isAppHeaderAddonInstalled = await firstValueFrom(this.httpService.getPapiApiCall(`/addons/installed_addons/${appHeaderUUID}`))
            if(isAppHeaderAddonInstalled){
                // TODO - remove the uuid - waiting to mapping on NGINX 
                const headerURL = this.getBaseUrl(`${appHeaderUUID}`);

                const headers = await this.httpService.getHttpCall(`${headerURL}/headers`).toPromise();
                
                if(headers?.length){
                    this._headers =  headers?.filter(header =>  header.Data.Published === true )
                                             .map(header => { return { key: header.Data.Key, value: header.Data.Name }
                    });
                    this.notifyHeaderChange();
                }
            }
        }
        catch(err){

        }

        this._pages = res.pages;

        this.notifyPagesChange();

        this._profiles = res.profiles;
        const repProfile = this._profiles.find(profile => profile.name?.toLowerCase() === 'rep');
        this._defaultProfileId = repProfile?.id || '';
        this.notifyProfilesChange();

        if (res.dataViews.length > 0) {
            res.dataViews.forEach(dataView => {
                this.upsertDataViewToMap(dataView);
            });
            this.notifySlugsDataViewsMapChange();
        } else {
            const profileId: number = coerceNumberProperty(this._defaultProfileId);
            this.createNewSlugsDataView(profileId);
        }
    }

    createNewSlugsDataView(profileId: number) {
        const dataView: MenuDataView = {
            Type: 'Menu',
            Hidden: false,
            Context: {
                Name: this.SLUGS_DATAVIEW_NAME,
                Profile: {
                    InternalID: profileId
                },
                ScreenSize: 'Tablet'
            },
            Fields: []
        }

        return this.saveSlugsDataView(dataView);
    }

    async deleteSlugsDataView(dataView: MenuDataView) {
        // Delete the dataview
        if (dataView) {
            dataView.Hidden = true;
            return this.httpService.postPapiApiCall('/meta_data/data_views', dataView).toPromise().then(res => {
                this._dataViewsMap.delete(dataView.InternalID.toString());
                this.notifySlugsDataViewsMapChange();
            }).catch(err => {
                this.showErrorDialog(err);
            });
        }
    }

    async saveSlugsDataView(dataView: MenuDataView) {
        return this.upsertSlugDataView(dataView).then(dataView => {
            this.upsertDataViewToMap(dataView);
            this.notifySlugsDataViewsMapChange();
        }).catch(err => {
            this.showErrorDialog(err);
        });
    }

    getSlugsDataView(dataViewId) {
        if (this.dataViewsMap.has(dataViewId)) {
            return Promise.resolve([this.dataViewsMap.get(dataViewId)]);
        } else {
            return this.httpService.getPapiApiCall(`/meta_data/data_views?where=InternalID='${dataViewId}'`).toPromise();
        }
    }

    async upsertSlug(slug: ISlugData, isDelete: boolean = false, selectedObj: PepSelectionData = null) {
        let body = {
            slug: slug,
            isDelete: isDelete,
            selectedObj: selectedObj
        };
        
        const baseUrl = this.getBaseUrl(this.addonUUID);
        const res = await this.httpService.postHttpCall(`${baseUrl}/slugs`, body).toPromise();
        if (isDelete) {
            // Addd timeout to wait for the data to be deleted (PFS subscription).
            setTimeout(async () => {
                await this.loadSlugsDataViewsData();
            }, 3000);
        }

        return res;
    }
}
