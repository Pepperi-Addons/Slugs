/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
import { v4 as uuid } from 'uuid';
import { Client, Request } from '@pepperi-addons/debug-server'
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { ISlugData , SlugsService } from './slug.service';

export async function install(client: Client, request: Request): Promise<any> {

    const service = new SlugsService(client);
    const TABLE_NAME = 'Slugs';
    const systemSlugs: ISlugData[] = [{ Name: 'Homepage', Description: 'Default home page', Slug: 'HomePage', System: true, availableInMapping: true },
                { Name: 'Accounts', Description: 'Default accounts page', Slug: 'accounts', System: true, availableInMapping: false},
                { Name: 'Activities', Description: 'Default activities page', Slug: 'activities', System: true, availableInMapping: false},
                { Name: 'Users', Description: 'Default users page', Slug: 'users', System: true, availableInMapping: false},
                { Name: 'Contacts', Description: 'Default contacts page', Slug: 'contacts', System: true, availableInMapping: false},
                { Name: 'Transactions', Description: 'Default transactions page', Slug: 'transactions', System: true, availableInMapping: false},
                { Name: 'Details', Description: 'Default details page', Slug: 'details', System: true, availableInMapping: false},
                { Name: 'List', Description: 'Default list page', Slug: 'list', System: true, availableInMapping: false},
                { Name: 'Catalogs', Description: 'Default catalogs page', Slug: 'catalogs', System: true, availableInMapping: false},
                { Name: 'Cart', Description: 'Default cart page', Slug: 'cart', System: true, availableInMapping: false},
                { Name: 'Complete action', Description: 'Default complete action page', Slug: 'complete_action', System: true, availableInMapping: false},
                { Name: 'Account details', Description: 'Default account details page', Slug: 'account_details', System: true, availableInMapping: false},
                { Name: 'Launch', Description: 'Default landing page', Slug: 'launch_page', System: true, availableInMapping: true}];

    try {

        const papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });
        
        await papiClient.addons.data.schemes.post({
            Name: TABLE_NAME,
            Type: 'indexed_data',
            Fields: {
                Name: {
                    Type: 'String',
                    Indexed: true
                },
                Description: {
                    Type: 'String'
                },
                Slug: {
                    Type: 'String'
                },
                PageType: {
                    Type: 'String'
                },
                IsSystem: {
                    Type: 'Bool'
                }    
            }
        });

        //add the system slugs to ADAL
        systemSlugs.forEach( slug  => {
            slug.Key = uuid();
            papiClient.addons.data.uuid(client.AddonUUID).table(TABLE_NAME).upsert(slug);
        });

        await service.createSlugsRelation();
           
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}