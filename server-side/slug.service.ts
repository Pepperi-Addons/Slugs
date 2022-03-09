import { PapiClient, InstalledAddon, FindOptions, Page, MenuDataView } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { resolve } from 'dns';

const TABLE_NAME = 'Slugs';

export interface ISlugData {
    Key: string;
    Name: string;
    Description: string;
    Slug: string;
    Hidden?: boolean;
    System?: boolean;
}

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
    
    getSystemSlugs(): ISlugData[] {
        return  [{ Name: 'Homepage', Description: 'Default home page', Key: '98765-0' , Slug: 'homepage', System: true },
                { Name: 'Accounts', Description: 'Default accounts page', Key: '98765-1' , Slug: 'accounts', System: true },
                { Name: 'Activities', Description: 'Default activities page', Key: '98765-2' , Slug: 'activities', System: true },
                { Name: 'Users', Description: 'Default users page', Key: '98765-3' , Slug: 'users', System: true },
                { Name: 'Contacts', Description: 'Default contacts page', Key: '98765-4' , Slug: 'contacts', System: true },
                { Name: 'Transactions', Description: 'Default transactions page', Key: '98765-5' , Slug: 'transactions', System: true },
                { Name: 'Details', Description: 'Default details page', Key: '98765-6' , Slug: 'details', System: true },
                { Name: 'List', Description: 'Default list page', Key: '98765-7' , Slug: 'list', System: true },
                { Name: 'Catalogs', Description: 'Default catalogs page', Key: '98765-8' , Slug: 'catalogs', System: true },
                { Name: 'Cart', Description: 'Default cart page', Key: '98765-9' , Slug: 'cart', System: true },
                { Name: 'Complete action', Description: 'Default complete action page', Key: '98765-10' , Slug: 'complete_action', System: true },
                { Name: 'Account details', Description: 'Default account details page', Key: '98765-11' , Slug: 'account_details', System: true}];
    }

    async getSlugs(options: FindOptions | undefined = undefined) {
        let slugList = await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options) as ISlugData[];
        // let sysArray = this.getSystemSlugs().filter( (slug) => {
        //     return options?.where ? slug.Slug == options.where.replace("Slug=","") : slug;
        //   });
        return this.getSystemSlugs().concat(slugList);
    }

    async upsertSlug(body) {

        const slugList = await this.getSlugs({ where : 'Hidden=false'});

        if(body.isDelete) {
            // get list of slugs & filter by slug field
            //const slugList = await this.getSlugs({ where : 'Hidden=false'});
            const deleteType = body.selectedObj.selectionType === 1 && body.selectedObj.rows.length > 0 ? 'include' :
                               body.selectedObj.selectionType === 0 && body.selectedObj.rows.length === 0 ? 'all' : 'exclude';

            for(let i=0; i < slugList.length; i++){
                if(deleteType === 'all' || 
                  (deleteType === 'include' && body.selectedObj.rows.includes(slugList[i].Key)) || 
                  (deleteType === 'exclude' && !body.selectedObj.rows.includes(slugList[i].Key))){
                    
                    if(slugList[i].System == undefined || slugList[i].System == false){
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
                
                const query = `Slug=${slugToUpsert.Slug}`;
                // get list of slugs & filter by slug field
                //const slugList = await this.getSlugs({where: query});
                const tmpList = slugList.filter( (slug) => {
                        return slug.Slug == slugToUpsert.Slug;
                });

                 // check if slug is allready exits
                if(tmpList.length === 0){
                    
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

    getBody(slug): ISlugData {
        return {
            Key: slug.Key || null,
            Name: slug.Name,
            Description: slug.Description,
            Slug: slug.Slug || '',
            Hidden: slug.Hidden || false,
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