import SlugsService from './slug.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import { servicesVersion } from 'typescript';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function slugs(client: Client, request: Request) {
    
    const service = new SlugsService(client);

    if (request.method === 'GET') {
        return service.getSlugs(request.query);
    }
    else if (request.method === 'POST') {
        try {
            return service.upsertSlug(request.body);
            
        } catch (err) {
            throw new Error(`Failed with error - ${err}`);
        }
    }
    else {
        throw new Error(`Method ${request.method} not supportded`);
    }
}

export async function get_slugs_data_views_data(client: Client, request: Request): Promise<any> {
    try {
        const service = new SlugsService(client);
        return service.getSlugsDataViewsData();
    } catch(err) {
        throw new Error(`Failed to get slugs data views data. error - ${err}`);
    }
}


