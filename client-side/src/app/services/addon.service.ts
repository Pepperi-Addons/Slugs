import { Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { ISlug } from '../addon/Components/Add-Slug/add-slug.component';
import { config } from 'addon.config';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';


@Injectable({ providedIn: 'root' })
export class AddonService {

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
        const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
    }

    getSlugs(query?: string) {
        let url = `/addons/api/${this.addonUUID}/api/slugs`;
       //query = '?order_by="UID"';
       if (query) { 
            url = url + query;
        }
        // https://papi.pepperi.com/V1.0/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'
        return this.papiClient.get(encodeURI(url));
        //return this.pepGet(encodeURI(url)).toPromise();
    }


    
    // getSlugs(query?: string) {
    // //     let url = `/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'`;
    // //     //let url = `/addons/files/${this.addonUUID}`
    // //    //query = '?order_by="UID"';
    // //    if (query) {
    // //         url = url + query;
    // //    }
    // //     return this.papiClient.get(encodeURI(url));

    // return this.papiClient.addons.data.uuid(this.addonUUID).table('Slugs')
    // }

    async deleteSlug(slug: ISlug, query?: string){
        return new Promise(async (resolve, reject) => {
            let body = {
                    Key: slug.name,
                    Description: slug.description,
                    Hidden: true
            };
    
            //let res = await this.addonService.papiClient.addons.api.uuid(this.addonUUID).file('api').func('create_asset').post(undefined, body);
           await this.httpClient.post('http://localhost:4500/api/delet_slug', body, {
            headers: {
                'Authorization': 'Bearer ' + this.accessToken
            }
           }).subscribe((res) => {
                resolve(res);
            });
        });
            //this.addonService.papiClient.post(encodeURI(url),body);
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
