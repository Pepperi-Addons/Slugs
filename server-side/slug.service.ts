import { PapiClient, InstalledAddon, FindOptions, Page, DataView, Relation } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';
import { resolve } from 'dns';

const TABLE_NAME = 'Slugs';

export interface ISlugData {
    Key?: string;
    Name: string;
    Description: string;
    Slug: string;
    Hidden?: boolean;
    System?: boolean;
    availableInMapping?: boolean;
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
            actionUUID: client.ActionUUID
        });

        this.addonUUID = client.AddonUUID;
    }

    async getSlugs(options: FindOptions | undefined = undefined) {
        return await this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find(options) as ISlugData[];
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

            // get list of slugs & filter by slug field
            let tmpList = slugList.filter( (slug) => {
                return slug.Slug == slugToUpsert.Slug;
            });

            // check if slug is allready exits
            if(tmpList.length === 0){
                    
                const numOfSystemSlugs = slugList.filter( (slug) => {
                                return slug.System && slug.System == true;
                        }).length;

                    // Limit the num of slugs to 50 (not included the system slugs)
                    if( slugList.length >= 50 + numOfSystemSlugs){
                        return {
                            success: false,
                            message: 'The number of slugs limit has been reached'
                        }
                    }
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

                // get list of slugs filter by key field
                let tmpList = slugList.filter( (slug) => {
                    return slug.Key == slugToUpsert.Key;
                })[0];
                
                if(tmpList?.System != undefined && tmpList.System == true && tmpList.Slug !== slugToUpsert.Slug){
                    return{ 
                        success: false,
                        message: 'Change of system slug Slug is not allowed'
                    }
                }
                
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

    private getBody(slug): ISlugData {
        return {
            Key: slug.Key || null,
            Name: slug.Name,
            Description: slug.Description,
            Slug: slug.Slug || '',
            Hidden: slug.Hidden || false,
        };
    }

    async createSlugsRelation() {
        // Check if relation exist 
        let uiFieldBankRelation = await this.getRelations("UIFieldBank");

        if(!uiFieldBankRelation || uiFieldBankRelation?.length === 0) {            
            // Create new
            const uiBankFieldsRelation: Relation = {
                RelationName: "UIFieldBank",
                Name:"SlugsDataView",
                Description:"Get the slugs dataview",
                Type: "AddonAPI",
                SubType: "NG11",
                AddonUUID: this.client.AddonUUID,
                AddonRelativeURL: "/api/slugs_dataview",
                AddtionalDataTableName: "Slug"        
            };

            uiFieldBankRelation =  await this.papiClient.post('/addons/data/relations', uiBankFieldsRelation);
        } 
        
        return uiFieldBankRelation;
    }

    getRelations(relationName: string): Promise<any> {
        return this.papiClient.get(`/addons/data/relations?where=RelationName=${relationName}`);
    }

    private getSlugsDataViews(): Promise<DataView[]> {
        const res = this.papiClient.metaData.dataViews.find({
            where: `Context.Name='Slugs'`
        });

        return res;
    }
    
    async getSlugsDataViewsData() {
        const dataPromises: Promise<any>[] = [];

        // Get the slugs dataviews
        // const dataViews = await this.papiClient.metaData.dataViews.find({
        //     where: `Context.Name='Slugs'`
        // });
        dataPromises.push(this.getSlugsDataViews());

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

    async getMappedSlugs() {
        const mappedSlugs: any[] = [];
        const dataViews = await this.getSlugsDataViews();

        if (dataViews?.length === 1) {
            const dataView = dataViews[0];

            if (dataView && dataView.Fields) {
                for (let index = 0; index < dataView.Fields.length; index++) {
                    const field = dataView.Fields[index];
                    mappedSlugs.push({
                        slug: field.FieldID,
                        pageKey: field.Title
                    });
                }
            }
        }

        return mappedSlugs;
    }
}

export default SlugsService;