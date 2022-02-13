import SlugsService from './slug.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import { servicesVersion } from 'typescript';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function slugs(client: Client, request: Request) {
    
    const service = new SlugsService(client);

    // const res = await service.getAddons()
    // return res
    if(request.method === 'GET'){
        return service.getSlugs(request.query);
    }
    else if(request.method === 'POST'){
        return service.createSlug(request.body);
    }
    else{
        throw new Error(`Method ${request.method} not supportded`);
    }
};


