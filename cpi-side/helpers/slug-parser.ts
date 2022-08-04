
import EventEmitter from 'events';
import httpMocks, { RequestMethod } from 'node-mocks-http';
import { Request, Response } from 'express';
import { legecyPages } from '../metadata';
import { DataViewHelper } from './data-view-helper';

export interface SlugParseResult {
    slug: string;
    params: any;
    query: any;
    error: string;
}

class LegacySlugParser {
    slugs: any[] = [];
    router: any
    constructor() {
        this.router = Router()
        this.loadSlugs()
        this.loadRouter();            
    }
    
    async loadSlugs() {
        this.slugs = [...legecyPages]; // NOTE, only legacy pages are supported
    }
    async loadRouter () {
        this.slugs.forEach(slug => {
            this.router.get(slug, async (req, res) => {
                const queryParams = req.query;
                const params = req.params;
                res.json({
                    slug: slug,
                    params: params,
                    query: queryParams
                } as SlugParseResult);
            }
            );
        });
    }

    parse(url: string, ): Promise<SlugParseResult> {
        return new Promise(async (resolve, reject) => {
            // create mock request & response objects using node-mocks-http
            const request = httpMocks.createRequest({
                url: url,
                method: 'GET' as RequestMethod,
            });
            const response = httpMocks.createResponse({
                // needs to be sent for the 'finish' event to be called
                eventEmitter: EventEmitter,
            });

            // when the response emits 'finish' the api is done
            // this is done for response.end() of response.json() or any other function that sends a reponse
            response.on('finish', () => {
                console.log('Finished');
                resolve({
                    ...response._getJSONData(),
                });
            });

            // let the router handle the request
            this.router(request, response, this.finalHandler(request, response));
        });
    }

    private finalHandler(req: Request, res: Response): (err: any) => void {
        return (err) => {
            // the err will be any exception thrown from a router
            if (err) {
                res.json({
                    error: 'Error thrown: ' + err.toString(),
                } as SlugParseResult);
            } else {
                // no err means no routes accepted this
                res.json({
                    error: 'slug not supported for ' + req.path,
                } as SlugParseResult);
            }
        };
    }
}

export default LegacySlugParser;