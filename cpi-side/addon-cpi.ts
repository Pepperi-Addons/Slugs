import '@pepperi-addons/cpi-node'

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
router.get("/slugs/:key", async (req, res) => {
    let page = {};
    
    try {
        console.log("CPISide - GET page with query params (page key)");
        // pages = await pepperi.api.adal.getList({ 
        //     addon: '4ba5d6f9-6642-4817-af67-c79b68c96977',
        //     table: 'Slugs'
        // }).then(obj => obj.objects);
        
        page = await pepperi.api.adal.get({ 
            addon: '4ba5d6f9-6642-4817-af67-c79b68c96977',
            table: 'Slugs',
            key: req.params.key
        }).then(obj => obj.object);

    } catch(exception) {
        // Handle exception.
    }

    res.json({ result: page });
});

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