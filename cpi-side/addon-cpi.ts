import '@pepperi-addons/cpi-node'
import { DataViewContext, PapiClient } from '@pepperi-addons/papi-sdk';

export const router = Router();

const legecyPages = [
    'homepage', 
    'accounts/home_page/:id',
    'details/:objectType/:id',
    'details/:objectType/:id/:apiName/:value', 
    'list/:listType',
    'list/:listType/:id',
    'catalogs/:transactionTypeName/:accountDestUID/:accountOriginUID',
    'transactions/scope_items/:id',
    'transactions/item_details/:id/:parentId',
    'transactions/child_details/:id/:parentId',
    'transactions/cart/:id',
    'cart/:InternalID/:id',
    'transactions/details/:id',
    'transactions/details/:id/:apiName/:value',
    'complete_action',
    'account_details/:id'
    // 'activities', 
    // 'users', 
    // 'contacts', 
    // 'transactions', 
    // 'details', 
    // 'list', 
    // 'catalogs', 
    // 'cart', 
    // 'complete_action', 
    // 'account_details'
];

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
    debugger;
    const url = req.body.slug;
    // validateSlug(url, res);
    let slugPath = url.split('?')[0]; // before query params
    // slug is the path 
    const queryParams = queryParams2Object(url.split('?')[1])
    // NOTE: path params are supported only for legacy pages   
    const legacyPageIndex = getLegacyPageIndex(slugPath);

    let resObj = {}
    // If this slug is legacy.
    if (legacyPageIndex >= 0) {
        const pathParams = getPathParamsForLegacy(legacyPageIndex, slugPath);

        resObj = {
            success: true,
            slug: slugPath,
            isLegacy: true,
            pathParams: pathParams,
            pageParams: queryParams,
        };
    } else { 
        const slugObj = await getUserDefinedSlug(slugPath)
        
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
    
    const slugDataView = await getSlugDataView();
        
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

function removeFirstCharIfNeeded(str) {
    if (str.length > 0 && str.startsWith('/')) {
        return str.substring(1);
    } else {
        return str;
    }
}

function getPathParamsForLegacy(legacyPageIndex: number, slugPath: string) {
    const res = {};
    let legecyPagePath = removeFirstCharIfNeeded(legecyPages[legacyPageIndex]);
    slugPath = removeFirstCharIfNeeded(slugPath);
    
    const legacyParams = legecyPagePath.split('/:');
    const slugsPathParams = slugPath.split('/');

    if (legacyParams.length === slugsPathParams.length) {
        for (let index = 1; index < legacyParams.length; index++) {
            const legacyParam = legacyParams[index];
            const slugsPathParam = slugsPathParams[index];
            
            res[legacyParam] = slugsPathParam;
        }
    }

    return res;
}

function validateSlug(slug: string, res) {
    // slug should start with /
    if (!slug.startsWith('/')) {
        res.json({
            success: false,
            message: 'Invalid slug'
        });
        return false;
    }
    else {
        return true;
    }
}

function getFirstPathParam(slug: string) {
    slug = removeFirstCharIfNeeded(slug);
    return slug.split('/')[0];
}

function getLegacyPageIndex(slug) {
    for (let index = 0; index < legecyPages.length; index++) {
        const legacyPage = legecyPages[index];
        
        if (slug.includes(legacyPage)) {
            return index;
        }
    }

    return -1;
}

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

async function getSlugDataView() {
    const ctx = { Name: 'Slugs' } as DataViewContext;
    const slugsUiObj = await pepperi.UIObject.Create(ctx);
    return slugsUiObj?.dataView;
}

async function getUserDefinedSlug(slug) {
    const dataView = await getSlugDataView();
    const fields = dataView?.Fields as any[];
    const slugs = fields?.map(field => {
        return {
            url: field.FieldID,
            pageUUID: field.Title
        }
    });

    slug = getFirstPathParam(slug);
    const slugObj = slugs?.find(x => x.url === slug);
    return slugObj;
}

export async function load(configuration: any) {
    pepperi.events.intercept('OnExecuteCommand', {}, async (data, next, main) => {
        // Handle SLUG_ command
        const SLUG_PREFIX = 'SLUG_';
        const commandKey = data['CommandKey'] || '';
        if (commandKey.startsWith(SLUG_PREFIX)) {
            const { DataObject, FieldID, UIObject, UIPage, client, CommandKey, ...rest } = data;
            const queryParams = '?' + Object.keys(rest).map(key => `${key}=${rest[key]}`).join('&');

            data.client?.navigateTo({
                url: commandKey.substring(SLUG_PREFIX.length) + (queryParams.length > 1 ? queryParams : '')
            });
        }

        // Test alert
        // data.client?.alert('title test1', 'content test');
        // data.client?.alert('title test2', 'content test');
        // data.client?.alert('title test3', 'content test');
        
        await next(main);
    });

    console.log('cpi side works!');
    // Put your cpi side code here
}