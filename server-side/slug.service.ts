import { PapiClient, InstalledAddon, FindOptions, Page, MenuDataView } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { resolve } from 'dns';

const TABLE_NAME = 'Slugs';

export class SlugsService {

    options : FindOptions | undefined;
    papiClient: PapiClient;
    addonUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.AddonUUID
        });

        this.addonUUID = client.AddonUUID;
    }

    async getSlugs(options: FindOptions | undefined = undefined) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options);
    }

    async upsertSlug(body) {
        if(body.isDelete) {
            const query = `?where=Hidden=false`;
            // get list of slugs & filter by slug field
            const slugList = await this.getSlugsList(query);
            const deleteType = body.selectedObj.selectionType === 1 && body.selectedObj.rows.length > 0 ? 'include' :
                               body.selectedObj.selectionType === 0 && body.selectedObj.rows.length === 0 ? 'all' : 'exclude';

            for(let i=0; i < slugList.length; i++){
                if(deleteType === 'all' || 
                  (deleteType === 'include' && body.selectedObj.rows.includes(slugList[i].Key)) || 
                  (deleteType === 'exclude' && !body.selectedObj.rows.includes(slugList[i].Key))){
                    
                    if(slugList[i].Key.indexOf('98765-') == -1){
                        let tmpBody = this.getBody(slugList[i]);
                        tmpBody.Hidden = true;

                        await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(tmpBody);
                    }
                    else {
                        throw new Error(`System slug ${slugList[i].Slug} can't be deleted`);
                    }
                }
            }

            return {
                success: true
            }
        }
        else {
            const slugToUpsert = this.getBody(body.slug);

            if(slugToUpsert.Name === '' || slugToUpsert.Slug === ''){
                throw new Error(`Name & Slug fields can't be empty.`);  
            }

            // change the slug field to lowercase and remove white spaces
            slugToUpsert.Slug = slugToUpsert.Slug.replace(/\s/g, "").toLowerCase(); 

            // Add new Slug 
            if(slugToUpsert.Key === null){
                
                const query = `?where=Slug=${slugToUpsert.Slug}&Hidden=false`;
                // get list of slugs & filter by slug field
                const slugList = await this.getSlugsList(query);

                 // check if slug is allready exits
                if(slugList.length === 0){
                    
                    // add Key if need ( for create new )
                    slugToUpsert.Key = uuid();
                    
                    // create new slug
                    return {
                        success: true,
                        body: await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(slugToUpsert)
                    }
                }
                else{
                    return {
                        success: false,
                        message: `Slug ${slugToUpsert.Slug} already exists`
                    }
                }
            }
            else {
                // Update slug or Delete from API slug 
                return {
                    success: true,
                    body: await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(slugToUpsert)
                }
            } 
        }
    }

    getSlugsList(query: string = '') {
        let addonURL = `/addons/data/${this.addonUUID}/Slugs` + query;
                
        return this.papiClient.get(encodeURI(addonURL)); 
    }

    getBody(slug) {
        return  {
            Name: slug.Name,
            Description: slug.Description,
            Slug: slug.Slug || '',
            Hidden: slug.Hidden || false,
            Key: slug.Key || null
        };
    }

    async getSlugsDataViewsData() {
        const dataPromises: Promise<any>[] = [];

        // Get the slugs dataviews
        // const dataViews = await this.papiClient.metaData.dataViews.find({
        //     where: `Context.Name='Slugs'`
        // });
        dataPromises.push(this.papiClient.metaData.dataViews.find({
            where: `Context.Name='Slugs'`
        }));

        // Get the profiles
        // const profiles = await this.papiClient.profiles.find();
        dataPromises.push(this.papiClient.profiles.find());

        // Get the pages
        // const pages: Page[] = await this.papiClient.pages.find();
        dataPromises.push(this.papiClient.pages.find());
        
        // wait for results and return them as object.
        const arr = await Promise.all(dataPromises).then(res => res);
        
        return {
            dataViews: arr[0],
            profiles: arr[1].map(profile => { return { id: profile.InternalID.toString(), name: profile.Name } }),
            pages: arr[2].map(page => { return { key: page.Key, name: page.Name } }), // Return projection of key & name
        }
    }
}

export default SlugsService;