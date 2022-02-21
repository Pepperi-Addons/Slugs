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

    async upsertSlug(body){

        if(body.isDelete){
            
            const query = `?where=Hidden=false`;
            // get list of slugs & filter by slug field
            const slugList = await this.getSlugsList(query);
            const deleteType = body.selectedObj.selectionType === 1 && body.selectedObj.rows.length > 0 ? 'include' :
                               body.selectedObj.selectionType === 0 && body.selectedObj.rows.length === 0 ? 'all' : 'exclude';

            for(let i=0; i < slugList.length; i++){
                if(deleteType === 'all' || 
                  (deleteType === 'include' && body.selectedObj.rows.includes(slugList[i].Key)) || 
                  (deleteType === 'exclude' && !body.selectedObj.rows.includes(slugList[i].Key))){
                    
                    let tmpBody = this.getBody(slugList[i]);
                    tmpBody.Hidden = true;

                    await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(tmpBody);
                }
            }

            return{
                success: true
            }
        }
        else{

            body = this.getBody(body.slug);

            if(body.Name === '' || body.Slug === ''){
                throw new Error(`Name & Slug fields can't be empty.`);  
            }

            // change the slug field to lowercase and remove white spaces
            body.Slug = body.Slug.replace(/\s/g, "").toLowerCase(); 

            // Add new Slug
            if(body.Key === null){
                
                const query = `?where=Slug=${body.Slug}&Hidden=false`;
                // get list of slugs & filter by slug field
                const slugList = await this.getSlugsList(query);

                 // check if slug is allready exits
                if(slugList.length === 0){
                    
                    // add Key if need ( for create new )
                    body.Key = uuid();
                    
                    // create new slug
                    return {
                        success: true,
                        body: await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body)
                    }
                }
                else{
                    return {
                        success: false,
                        message: `Slug ${body.Slug} allready exists`
                    }
                }
            }
            else{
                    // Update slug or Delete from API slug 
                    return {
                        success: true,
                        body: await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body)
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