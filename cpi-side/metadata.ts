export const legacyPages = [
    '/homepage', // homepage

    // account dashboard  - already implemented
    '/accounts/home_page/:id', // account dashboard
    '/accounts/dashboard/:id', // account dashboard duplicate from above
    
    // generic lists   
    '/list/all_activities',
    '/list/accounts',
    '/list/users',
    '/list/contacts',
    '/list/items', // TODO check if this is used 

    // order center
    '/transactions/scope_items/:id', // order center - already implemented
    '/transactions/item_details/:id/:parentId', 
    '/transactions/matrix/:id/:parentId', // TODO need to define this
    // cart
    '/transactions/cart/:id', // cart - already implemented

    // forms
    '/transactions/details/:id', // order details
    '/accounts/details/:id', // account info
    '/activities/details/:id', // general activity - implemented
   
];