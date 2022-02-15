import SlugsService from './slug.service'
import { Client, Request } from '@pepperi-addons/debug-server'
import { servicesVersion } from 'typescript';

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function slugs(client: Client, request: Request) {
    
    const service = new SlugsService(client);

    if(request.method === 'GET'){
        return service.getSlugs(request.query);
    }
    else if(request.method === 'POST'){
        request.query = `where=Slug=${request.body.Slug}`;
        const slug = await service.getSlugs(request.query);
        if(slug.length == 0){
            return service.createSlug(request);
        }
        else{
            throw new Error(`Slug ${request.body.Slug} allready exists`);
        }
    }
    else{
        throw new Error(`Method ${request.method} not supportded`);
    }
};


