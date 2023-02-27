/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/
import { Client, Request } from '@pepperi-addons/debug-server'
import { SlugsService } from './slug.service';

const pnsKeyForSlugs = 'delete_slug_subscription';
const pnsFunctionPathForSlugs = '/api/on_delete_slug';

export async function install(client: Client, request: Request): Promise<any> {
    try {
        const service = new SlugsService(client)
        await service.upsertRelationsAndScheme();
        await service.subscribeSeleteSlug(pnsKeyForSlugs, pnsFunctionPathForSlugs);
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    try {
        const service = new SlugsService(client)
        await service.unsubscribeSeleteSlug(pnsKeyForSlugs, pnsFunctionPathForSlugs);
    } catch (err) {
        throw new Error(`Failed to unsubscribe from PNS. error - ${err}`);
    }
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    try {
        const service = new SlugsService(client)
        await service.upsertRelationsAndScheme();
    } catch (err) {
        throw new Error(`Failed to create ADAL Tables. error - ${err}`);
    }

    return { success: true, resultObject: {} };
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}