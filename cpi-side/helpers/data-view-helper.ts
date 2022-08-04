import { DataViewContext } from '@pepperi-addons/papi-sdk';
export class DataViewHelper {
    static async  getSlugDataView() {
        const ctx = { Name: 'Slugs' } as DataViewContext;
        const slugsUiObj = await pepperi.UIObject.Create(ctx);
        return slugsUiObj?.dataView;
    }

    static async getUserDefinedSlugs() {
        const dataView = await DataViewHelper.getSlugDataView();
        const fields = dataView?.Fields as any[];
        const slugs = fields?.map(field => field.FieldID);
        return slugs;
    }

    static async getUserDefinedSlug(slug) {
        const dataView = await DataViewHelper.getSlugDataView();
        const fields = dataView?.Fields as any[];
        const slugs = fields?.map(field => {
            return {
                url: field.FieldID,
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
}