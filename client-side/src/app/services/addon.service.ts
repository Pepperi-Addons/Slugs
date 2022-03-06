import { BehaviorSubject, Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { MenuDataView, PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { PepHttpService, PepSessionService, PepUtilitiesService } from '@pepperi-addons/ngx-lib';
import { config } from 'addon.config';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { Slug } from '../addon/addon.model';
import { IPepProfile } from '@pepperi-addons/ngx-lib/profile-data-views-list';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

interface IPageProj {
    key: string, 
    name: string
}
@Injectable({ providedIn: 'root' })
export class AddonService {

    private readonly SLUGS_DATAVIEW_NAME = 'Slugs';
    
    private _systemSlugs = [{ Name: 'Homepage', Description: 'Default home page', Key: '98765-0' , Slug: '/homepage' },
                            { Name: 'Accounts', Description: 'Default accounts page', Key: '98765-1' , Slug: '/accounts' },
                            { Name: 'Activities', Description: 'Default activities page', Key: '98765-2' , Slug: '/activities' },
                            { Name: 'Users', Description: 'Default users page', Key: '98765-3' , Slug: '/users' },
                            { Name: 'Contacts', Description: 'Default contacts page', Key: '98765-4' , Slug: '/contacts' },
                            { Name: 'Transactions', Description: 'Default transactions page', Key: '98765-5' , Slug: '/transactions' },
                            { Name: 'Details', Description: 'Default details page', Key: '98765-6' , Slug: '/details' },
                            { Name: 'List', Description: 'Default list page', Key: '98765-7' , Slug: '/list' },
                            { Name: 'Catalogs', Description: 'Default catalogs page', Key: '98765-8' , Slug: '/catalogs' },
                            { Name: 'Complete action', Description: 'Default complete action page', Key: '98765-9' , Slug: '/complete_action' },
                            { Name: 'Account details', Description: 'Default account details page', Key: '98765-10' , Slug: '/account_details' }

    ];

    get systemSlugs() {
        return this._systemSlugs.reverse().slice();
    }

    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;

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

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.sessionService.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging:true
        })
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
        this.addonURL = `/addons/data/${this.addonUUID}/Slugs`;
        const accessToken = this.sessionService.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
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
        // query = '?where=Slug="avner666"';
        if (query) { 
            this.addonURL = this.addonURL + query;
        }

        const userSlugs = await this.papiClient.get(encodeURI(this.addonURL));

        //add default homepage slug to the list 
        this.systemSlugs.forEach((sysSlug: Slug)  => {
            let slug = new Slug(sysSlug.Name, sysSlug.Description, sysSlug.Slug, sysSlug.Key, false);
            userSlugs.unshift(slug);

            return userSlugs;
        });
        
        return Promise.resolve(userSlugs);
    }

    loadSlugsDataViewsData() {
        this.clearData();

        const baseUrl = this.getBaseUrl(this.addonUUID);
        this.httpService.getHttpCall(`${baseUrl}/get_slugs_data_views_data`).toPromise().then(res => {
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
                const profileId: number = this.utilitiesService.coerceNumberProperty(this._defaultProfileId);
                this.createNewSlugsDataView(profileId);
            }
        });
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

    // getSlugsDataViews() {
    //     // Get the dataviews with Context.Name='Slugs' (all slugs dataviews)
    //     return this.httpService.getPapiApiCall(`/meta_data/data_views?where=Context.Name=${this.SLUGS_DATAVIEW_NAME}`).toPromise();
    // }

    async upsertSlug(slug: Slug, isDelete: boolean = false, selectedObj: PepSelectionData = null, callback = null){

        return new Promise(async (resolve, reject) => {

            let body = {
                slug: slug,
                isDelete: isDelete,
                selectedObj: selectedObj
            };
        
            // work on prod
            await this.httpService.postPapiApiCall(`/addons/api/${this.addonUUID}/api/slugs`, body).subscribe((res) => {
            //await this.pepHttp.postHttpCall(`/addons/data/${this.addonUUID}/slugs`, body).subscribe((res) => {
            // work on locallhost
            //await this.pepHttp.postHttpCall('http://localhost:4500/api/slugs', body).subscribe((res) => {

                if(callback){
                    callback(res);
                }
            });       
                  
        });
    }

    async get(endpoint: string): Promise<any> {
        return await this.papiClient.get(endpoint);
    }

    async post(endpoint: string, body: any): Promise<any> {
        return await this.papiClient.post(endpoint, body);
    }

    pepGet(endpoint: string): Observable<any> {
        return this.httpService.getPapiApiCall(endpoint);
    }

    pepPost(endpoint: string, body: any): Observable<any> {
        return this.httpService.postPapiApiCall(endpoint, body);

    }

}
