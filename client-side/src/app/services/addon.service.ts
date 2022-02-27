import { Observable } from 'rxjs';
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


@Injectable({ providedIn: 'root' })
export class AddonService {

    private _systemSlugs = [{ Name: 'Homepage', Description: 'Default home page', Key: '98765' , Slug: '/homepage' }];
    private readonly SLUGS_DATAVIEW_NAME = 'Slugs';

    get systemSlugs() {
        return this._systemSlugs.slice();
    }

    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.session.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging:true
        })
    }

    constructor(
        public session:  PepSessionService,
        public utilitiesService: PepUtilitiesService,
        private httpClient: HttpClient,
        private pepHttp: PepHttpService
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/data/${this.addonUUID}/Slugs`;
        const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
    }

    private upsertSlugDataView(dataView: MenuDataView) {
        return this.pepHttp.postPapiApiCall('/meta_data/data_views', dataView).toPromise();
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

    getPages() {
        return this.pepHttp.getPapiApiCall('/pages').toPromise();
    }
    
    getProfiles() {
        // Get the available profiles
        return this.pepHttp.getPapiApiCall('/profiles').toPromise();
    }

    createNewSlugsDataView(profileId: number) {
        const dataView: MenuDataView = {
            Type: 'Menu',
            Context: {
                Name: this.SLUGS_DATAVIEW_NAME,
                Profile: {
                    InternalID: profileId
                },
                ScreenSize: 'Tablet'
            }
        }

        return this.upsertSlugDataView(dataView);
    }

    deleteSlugsDataView(dataView: MenuDataView) {
        // Hide the dataview
        return new Promise(async (resolve, reject) => {
            if (dataView) {
                dataView.Hidden = true;
                resolve(this.pepHttp.postPapiApiCall('/meta_data/data_views', dataView).toPromise());
            } else {
                reject(null);
            }
        });
    }

    saveSlugsDataView(dataView: MenuDataView) {
        return this.upsertSlugDataView(dataView);
    }

    getSlugsDataView(dataViewId) {
        return this.pepHttp.getPapiApiCall(`/meta_data/data_views?where=InternalID='${dataViewId}'`).toPromise();
    }

    getSlugsDataViews() {
        // Get the dataviews with Context.Name='Slugs' (all slugs dataviews)
        return this.pepHttp.getPapiApiCall(`/meta_data/data_views?where=Context.Name=${this.SLUGS_DATAVIEW_NAME}`).toPromise();
    }

    async upsertSlug(slug: Slug, isDelete: boolean = false, selectedObj: PepSelectionData = null, callback = null){

        return new Promise(async (resolve, reject) => {

            let body = {
                slug: slug,
                isDelete: isDelete,
                selectedObj: selectedObj
            };
        
            // work on prod
            await this.pepHttp.postPapiApiCall(`/addons/api/${this.addonUUID}/api/slugs`, body).subscribe((res) => {
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
        return this.pepHttp.getPapiApiCall(endpoint);
    }

    pepPost(endpoint: string, body: any): Observable<any> {
        return this.pepHttp.postPapiApiCall(endpoint, body);

    }

}
