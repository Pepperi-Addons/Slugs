import '@pepperi-addons/cpi-node'
import { DataViewContext, PapiClient } from '@pepperi-addons/papi-sdk';

export async function load(configuration: any) {
    debugger;
    pepperi.events.intercept('OnExecuteCommand', {}, async (data, next, main) => {
        // TODO: Write code here
        data.client?.alert('title test1', 'content test');
        data.client?.alert('title test2', 'content test');
        data.client?.alert('title test3', 'content test');
        
        await next(main);
    });

    console.log('cpi side works!');
    // Put your cpi side code here
}

export const router = Router();

// Get the page by Key
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
    debugger
    const url = req.body.slug;
    validateSlug(url, res);
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
            slug: slugPath,// /list/:listType/:id
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

function getPathParamsForLegacy(legacyPageIndex, slugPath) {
    // TODO:
    const legacyParams = legecyPages[legacyPageIndex].split('/:');

    return {
        listType: 'activities',
        id: '123'
    };
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
async function getUserDefinedSlug(slug) {
    slug = getFirstPathParam(slug);
    const ctx = { Name: 'Slugs' } as DataViewContext;
    const slugsUiObj = await pepperi.UIObject.Create(ctx);
    const dataView = slugsUiObj?.dataView;
    const fields = dataView?.Fields as any[];
    const slugs = fields?.map(field => {
        return {
            url: field.FieldID,
            pageUUID: field.Title
        }
    });

    const slugObj = slugs?.find(x => x.url === slug);
    return slugObj;
}

function getFirstPathParam(slug: string) {
    let firstPathParams = "";
    if (slug.startsWith('/')) {
        firstPathParams = slug.split('/')[1];
    }
    else {
        firstPathParams = slug.split('/')[0];
    }
    return firstPathParams;
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

// Example get function from Dor
// //setup routers for router automation tests
// router.get("/addon-api/get", (req, res) => {
//     console.log("AddonAPI test currently on CPISide - GET with query params");
//     const queryString = req.query.q;
//     if (
//       queryString === "queryParam" &&
//       queryString !== null &&
//       queryString !== undefined
//     ) {
//       res.json({
//         result: "success",
//         params: queryString,
//       });
//     }
//     res.json({ result: "failure" });
// });
// router.post("/slugs")