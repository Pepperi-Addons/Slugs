import { DataViewContext } from '@pepperi-addons/papi-sdk';
export class DataViewHelper {
    static async  getSlugDataView() {
        const ctx = { Name: 'Slugs' } as DataViewContext;
        const slugsUiObj = await pepperi.UIObject.Create(ctx);
        return slugsUiObj?.dataView;
    }

    // we will override the legacy slug if the user defined a slug with the same name 
    static async shouldOverrideLegacySlug(slug) {
        slug = DataViewHelper.removeFirstCharIfNeeded(slug);
        const slugs = await DataViewHelper.getUserDefinedSlugs();
        const shouldOverride = slugs?.includes(slug);
        let res;
        if (shouldOverride && await this.canOverrideLegacySlug(slug)) {
           res = await DataViewHelper.getUserDefinedSlug(slug);
        } else {
            res = undefined
        }
        return res;
    }


    static async getUserDefinedSlugs() {
        const dataView = await DataViewHelper.getSlugDataView();
        const fields = dataView?.Fields as any[];
        const slugs = fields?.map(field => field.FieldID.toLowerCase());
        return slugs;
    }

    static async getUserDefinedSlug(slug) {
        const dataView = await DataViewHelper.getSlugDataView();
        const fields = dataView?.Fields as any[];
        const slugs = fields?.map(field => {
            return {
                url: field.FieldID.toLowerCase(),
                pageUUID: field.Title
            }
        });
    
        slug = DataViewHelper.getFirstPathParam(slug);
        const slugObj = slugs?.find(x => x.url === slug);
        return slugObj;
    }

    static getFirstPathParam(slug: string) {
        slug = DataViewHelper.removeFirstCharIfNeeded(slug);
        return slug.split('/')[0];
    }
    static removeFirstCharIfNeeded(str) {
        if (str.length > 0 && str.startsWith('/')) {
            return str.substring(1);
        } else {
            return str;
        }
    }

    // this function manipulates only the homepage slug behavior
    // we can override the homepage slug only if configurations 1.0 is installed (supported by open sync)
    static async canOverrideLegacySlug(slug: string) {
        if (slug.toLowerCase() !== 'homepage'){
            return true;
        }
        // check if configurations 1.0 is installed by checking if it's schema exists
        let isConfigurations1_0Installed = false;
        try {
            await pepperi.addons.data.schemes.uuid('84c999c3-84b7-454e-9a86-71b7abc96554').name('synced_configuration_objects').get();
            // if the schema is not found an error will be thrown and the catch block will be executed
            isConfigurations1_0Installed = true
        } catch (error) {
            console.log(`Configurations 1.0 is not installed, the error is: ${error}`)
            isConfigurations1_0Installed = false;
        }
        return isConfigurations1_0Installed;
    }
}