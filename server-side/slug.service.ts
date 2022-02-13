import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { v4 as uuid } from 'uuid';

const TABLE_NAME = 'Slugs';

export class SlugsService {

    papiClient: PapiClient;
    addonUUID: string;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.AddonUUID
        });

        this.addonUUID = client.AddonUUID;
    }

    // getAddons(): Promise<InstalledAddon[]> {
    //     return this.papiClient.addons.installedAddons.find({});
    // }

    getSlugs(query?: string) {
        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).find({});
    }

    createSlug(body){

        // ADD VALIDATION TO THE BODY

        body.Key = uuid();

        return this.papiClient.addons.data.uuid(this.addonUUID).table(TABLE_NAME).upsert(body);
    }
}

export default SlugsService;