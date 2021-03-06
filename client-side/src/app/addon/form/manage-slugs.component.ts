import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from "@angular/core";
import { AddonService } from '../../services/addon.service';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IPepDraggableItem } from '@pepperi-addons/ngx-lib/draggable-items';
import { CdkDragDrop, CdkDragEnd, CdkDragStart, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { IPepOption, PepLoaderService } from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { MenuDataView, MenuDataViewField, Page } from '@pepperi-addons/papi-sdk';
import { IMappedSlug, ISlugData } from '../addon.model';

@Component({
    templateUrl: './manage-slugs.component.html',
    styleUrls: ['./manage-slugs.component.scss']
})
export class ManageSlugs implements OnInit {
    title: string = '';
    dataView: MenuDataView;
    availableSlugs: Array<IPepDraggableItem> = [];
    mappedSlugs: Array<IMappedSlug> = [];
    pagesOptions: IPepOption[] = [];
    isFinishLoading = false;

    constructor(
        private loaderService: PepLoaderService,
        public addonService: AddonService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute
    ) {
        // Load the pages id & names.
        this.addonService.pagesChange$.subscribe(pages => {
            this.pagesOptions = pages?.map(page => {
                return { key: page.key, value: page.name }
            });
        });
    }

    private setAvailableSlugPermission(slug: string, disable: boolean) {
        // Find the item in the available slugs
        const item = this.availableSlugs.find(as => as.data.key === slug);
        
        // If exist disable or enable it.
        if (item) {
            item.disabled = disable;
        }
    }

    private addNewSlug(draggableItem: IPepDraggableItem, index: number) {
        this.setAvailableSlugPermission(draggableItem.data.key, true);

        // Add new mappedSlug to the mappedSlugs.
        const mappedSlug = { slug: draggableItem.data.key };
        this.mappedSlugs.splice(index, 0, mappedSlug);
    }

    private changeCursorOnDragStart() {
        document.body.classList.add('inheritCursors');
        document.body.style.cursor = 'grabbing';
    }

    private changeCursorOnDragEnd() {
        document.body.classList.remove('inheritCursors');
        document.body.style.cursor = 'unset';
    }
    
    private async loadData() {
        // Load the dataview by id and set all the mappedSlugs array.
        this.loaderService.show();
        this.mappedSlugs = [];
        const dataViewId = this.activatedRoute.snapshot.params["dataview_id"];

        await this.addonService.getSlugs().then((slugs: ISlugData[]) => {
            // TODO: Product ask to add this, when needed remove it.
            slugs = slugs.filter(slug => !slug.System || slug.availableInMapping == true);

            this.availableSlugs = slugs.map(slug => {
                return { title: slug.Slug, data: {key: slug.Slug } }
            }).sort((slug1, slug2) => {
                if (slug1.title < slug2.title) { return -1; }
                if (slug1.title > slug2.title) { return 1; }
                return 0;
            });
        });

        const dataViews: MenuDataView[] = await this.addonService.getSlugsDataView(dataViewId);
        if (dataViews?.length === 1) {
            this.dataView = dataViews[0];

            for (let index = 0; index < this.dataView.Fields?.length; index++) {
                const field = this.dataView.Fields[index];
                this.mappedSlugs.push({
                    slug: field.FieldID,
                    pageKey: field.Title
                });
                this.setAvailableSlugPermission(field.FieldID, true);
            }
        } else {
            // TODO: Show error data view is not exist.
            this.goBack();
        }

        this.isFinishLoading = true;
        this.loaderService.hide();
    }

    private saveSlugsDataView(fields: MenuDataViewField[]) {
        this.dataView.Fields = fields;
        this.addonService.saveSlugsDataView(this.dataView).then(res => {
            this.dialogService.openDefaultDialog(new PepDialogData({
                title: this.translate.instant('MESSAGES.DIALOG_INFO_TITLE'),
                content: this.translate.instant('MESSAGES.MAPPED_SLUGS_SAVED_DIALOG_CONTENT')
            })).afterClosed().subscribe(value => {
                this.goBack();
            });
        });
    }

    ngOnInit() {
        this.loadData();
    }

    goBack() {
        this.router.navigate(['..'], {
            relativeTo: this.activatedRoute,
            queryParams: { tabIndex: 1 },
            queryParamsHandling: 'merge'
        });
    }

    backClicked() {
        this.goBack();
    }

    saveClicked() {
        // Save the current dataview.
        const fields: MenuDataViewField[] = [];
        let showMsgNotChoosePage = false;

        for (let index = 0; index < this.mappedSlugs.length; index++) {
            const mappedSlug = this.mappedSlugs[index];
            
            // Add the mapped slug only if the page is selected.            
            if (mappedSlug.pageKey) {
                fields.push({
                    FieldID: mappedSlug.slug,
                    Title: mappedSlug.pageKey
                });
            } else {
                showMsgNotChoosePage = true;
            }
        }

        // Show message to the user there are slugs with no pages if u continue and save we delete those slugs from the list.        
        if (showMsgNotChoosePage) {
            this.dialogService.openDefaultDialog(new PepDialogData({
                title: this.translate.instant('MESSAGES.DIALOG_INFO_TITLE'),
                content: this.translate.instant('MESSAGES.MAPPED_SLUGS_UNMAPPED_ENTRIES_CONTENT'),
                actionsType: 'cancel-ok'
            })).afterClosed().subscribe((okPressed) => {
                if (okPressed) {
                    this.saveSlugsDataView(fields);
                }
            });
        } else {
            this.saveSlugsDataView(fields);
        }
    }

    onDragStart(event: CdkDragStart) {
        this.changeCursorOnDragStart();
    }

    onDragEnd(event: CdkDragEnd) {
        this.changeCursorOnDragEnd();
    }
    
    onDropSlug(event: CdkDragDrop<IPepDraggableItem[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (event.container.id === 'emptyDropArea') {
            this.addNewSlug(event.previousContainer.data[event.previousIndex], this.mappedSlugs.length);
        } else {
            this.addNewSlug(event.previousContainer.data[event.previousIndex], event.currentIndex);
        }
    }

    onPageChanged(event: string, mappedSlug: IMappedSlug) {
        const index = this.mappedSlugs.findIndex( ms => ms.slug === mappedSlug.slug);
        this.mappedSlugs[index].pageKey = event;
    }

    onDeleteMappedSlug(event: IPepButtonClickEvent, mappedSlug: IMappedSlug) {
        const index = this.mappedSlugs.findIndex( ms => ms.slug === mappedSlug.slug);
        if (index > -1) {
            this.mappedSlugs.splice(index, 1);

            this.setAvailableSlugPermission(mappedSlug.slug, false);
        }
    }
}
