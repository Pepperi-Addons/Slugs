import { PapiClient, InstalledAddon, FindOptions } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';

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
                    
                    if(slugList[i].Key !== '98765'){
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

            if(slugToUpsert.Key === '98765'){
                throw new Error(`System slug ${slugToUpsert.Slug} can't be deleted`);
            }
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

    getSlugsList(query: string = ''){
        let addonURL = `/addons/data/${this.addonUUID}/Slugs` + query;
                
        return this.papiClient.get(encodeURI(addonURL)); 
    }

    getBody(slug){
        return  {
            Name: slug.Name,
            Description: slug.Description,
            Slug: slug.Slug || '',
            Hidden: slug.Hidden || false,
            Key: slug.Key || null
        };
    }
}

export default SlugsService;