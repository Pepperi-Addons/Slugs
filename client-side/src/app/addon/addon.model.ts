export interface IMappedSlug {
    slug: string;
    pageKey?: string;
}
export class Slug {
    Key: string;
    Name: string;
    Description: string;
    Slug: string;
    Hidden: boolean;
    ModificationDateTime: string;
    CreationDateTime: string;

    constructor(name='', description='', slug='', key=null, hidden = false , modificationDateTime = new Date().toISOString(), creationDateTime = new Date().toISOString()){
        this.Key = key;
        this.Name = name;
        this.Description = description;
        this.Slug = slug;
        this.Hidden = hidden;
        this.ModificationDateTime = modificationDateTime;
        this.CreationDateTime = creationDateTime;
    }
}
