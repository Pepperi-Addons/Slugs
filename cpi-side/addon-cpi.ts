import '@pepperi-addons/cpi-node'
import { DataViewHelper } from './helpers/data-view-helper';
import {LegacySlugParser} from './helpers/slug-parser';
export const router = Router();

// Get the slug by Key
// router.get("/slugs/:key", async (req, res) => {
//     let page = {};
    
//     try {
//         console.log("CPISide - GET slug with query params (slug key)");
//         // pages = await pepperi.api.adal.getList({ 
//         //     addon: '4ba5d6f9-6642-4817-af67-c79b68c96977',
//         //     table: 'Slugs'
//         // }).then(obj => obj.objects);
        
//         page = await pepperi.api.adal.get({ 
//             addon: '4ba5d6f9-6642-4817-af67-c79b68c96977',
//             table: 'Slugs',
//             key: req.params.key
//         }).then(obj => obj.object);

//     } catch(exception) {
//         // Handle exception.
//     }

//     res.json({ result: page });
// });

router.post('/get_page', async (req, res) => {
    // debugger;
    const url = req.body.slug;
    // validateSlug(url, res);
    let slugPath = url.split('?')[0]; // before query params
    
    // NOTE: path params are supported only for legacy pages   
    const parsedSlug = await new LegacySlugParser().parse(url);

    let resObj = {}
    // If this slug is legacy.
    if (parsedSlug.slug) {
        resObj = {
            success: true,
            slug: slugPath,
            isLegacy: true,
            pathParams: parsedSlug.params,
            pageParams: parsedSlug.query,
        };
    } else { 
        const slugObj = await DataViewHelper.getUserDefinedSlug(slugPath);    
        const queryParams = queryParams2Object(url.split('?')[1]);    
        if (slugObj) {
            resObj = {
                success: true,
                slug: slugObj.url,
                isLegacy: false,
                pageKey: slugObj.pageUUID,
                pageParams: queryParams,
            };
        } else {
            resObj = {
                success: false,
                message: 'Page not found'
            };
        }
    }
    
    res.json(resObj);

});

router.get('/get_slugs_dataview', async (req, res) => {
    let resObj = {}
    
    const slugDataView = await DataViewHelper.getSlugDataView();
        
    if (slugDataView) {
        resObj = {
            success: true,
            slugDataView: slugDataView
        };
    } else {
        resObj = {
            success: false,
            message: 'Slugs dataview not found'
        };
    }
    
    res.json(resObj);
});

function queryParams2Object(queryParams: string) {
    if (!queryParams) {
        return {};
    }

    const params = queryParams.split('&');
    const result = {};
    params.forEach((param) => {
        const [key, value] = param.split('=');
        result[key] = value;
    });
    return result;
}

export async function load(configuration: any) {
    pepperi.events.intercept('OnExecuteCommand', {}, async (data, next, main) => {
        // Handle SLUG_ command
        const SLUG_PREFIX = 'SLUG_';
        const commandKey = data['CommandKey'] || '';
        if (commandKey.startsWith(SLUG_PREFIX)) {
            const { DataObject, FieldID, UIObject, UIPage, client, CommandKey, timers, clientLoop, clientFactory, callback, ...rest } = data;
            const queryParams = '?' + Object.keys(rest).map(key => `${key}=${rest[key]}`).join('&');

            await data.client?.navigateTo({
                url: commandKey.substring(SLUG_PREFIX.length) + (queryParams.length > 1 ? queryParams : '')
            });
        }

        // Test alert
        // data.client?.alert('title test1', 'content test');
        // data.client?.alert('title test2', 'content test');
        // data.client?.alert('title test3', 'content test');
        
        await next(main);
    });

}
router.post('/test_legacy_parser', async (req, res) => {
    debugger;
    const body = req.body;
    const slug = body.slug;
    const slugParser = new LegacySlugParser();
    
    const params = await slugParser.parse(slug);    
    res.json({
        success: true,
        ...params

    });
});
