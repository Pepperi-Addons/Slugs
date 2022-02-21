import { Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { ISlug } from '../addon/Components/Add-Slug/add-slug.component';
import { config } from 'addon.config';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';


@Injectable({ providedIn: 'root' })
export class AddonService {

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
        private httpClient: HttpClient,
        private pepHttp: PepHttpService
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/data/${this.addonUUID}/Slugs`;
        const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
    }

    getSlugs(query?: string) {
        // query = '?where=Slug="avner666"';
        if (query) { 
            this.addonURL = this.addonURL + query;
        }    
        return this.papiClient.get(encodeURI(this.addonURL)); 
    }

   
    
    async upsertSlug(slug: ISlug, isDelete: boolean = false, selectedObj: PepSelectionData = null, callback = null){

        return new Promise(async (resolve, reject) => {

            let body = {
                slug: slug,
                isDelete: isDelete,
                selectedObj: selectedObj
            };
        
            // work on prod
            //let distAddons = await this.pepHttp.postHttpCall(`/addons/data/${this.addonUUID}/Slugs`, body).subscribe((res) => {
            // work on locallhost
            await this.pepHttp.postHttpCall('http://localhost:4500/api/slugs', body).subscribe((res) => {

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
