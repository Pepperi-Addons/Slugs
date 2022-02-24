import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit } from "@angular/core";
import { AddonService } from '../../services/addon.service';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IPepDraggableItem } from '@pepperi-addons/ngx-lib/draggable-items';
import { CdkDragDrop, CdkDragEnd, CdkDragStart, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { IPepOption } from '@pepperi-addons/ngx-lib';
import { IPepButtonClickEvent } from '@pepperi-addons/ngx-lib/button';
import { Page } from '@pepperi-addons/papi-sdk';
import { Slug } from '../addon.model';

interface IMappedSlug {
    slug: string;
    pageKey?: string;
}

@Component({
    templateUrl: './manage-slugs.component.html',
    styleUrls: ['./manage-slugs.component.scss']
})
export class ManageSlugs implements OnInit {
    title: string = '';
    dataviewId: string;
    availableSlugs: Array<IPepDraggableItem> = [];
    mappedSlugs: Array<IMappedSlug> = [];
    pagesOptions: IPepOption[] = [];

    constructor(
        public addonService: AddonService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        public router: Router,
        public activatedRoute: ActivatedRoute
    ) {
        this.dataviewId = this.activatedRoute.snapshot.params["dataview_id"];
    }

    // TODO: Implement this
    private loadAvailableSlugs(): void {

        // this.availableSlugs = [
        //     { title: '/homepage', data: '/homepage' },
        //     { title: '/dashboard', data: '/dashboard' },
        //     { title: '/sales', data: '/sales' },
        //     { title: '/promotions', data: '/promotions' },
        //     { title: '/checkout', data: '/checkout' },
        //     { title: '/test', data: '/test', disabled: true },
        // ];

        this.addonService.getSlugs().then((slugs: Slug[]) => {
            this.availableSlugs = slugs.map(slug => {
                return { title: slug.Slug, data: slug.Slug }
            });
        });
    }

    // TODO: Get the dataview by id.
    private loadSlugsDataview(): void {

    }

    // TODO: load the pages id & names.
    private loadPagesOptions(): void {
        this.addonService.getPages().then((pages: Page[]) => {
            this.pagesOptions = pages.map(page => {
                return { key: page.Key, value: page.Name }
            });
            
            // [
            //     { key: '1', value: 'test page 1'},
            //     { key: '2', value: 'test page 2'}
            // ]
        })
    }

    private setAvailableSlugPermission(slug: string, disable: boolean) {
        // Find the item in the available slugs
        const item = this.availableSlugs.find(as => as.data === slug);
        
        // If exist disable or enable it.
        if (item) {
            item.disabled = disable;
        }
    }

    private addNewSlug(draggableItem: IPepDraggableItem, index: number) {
        this.setAvailableSlugPermission(draggableItem.data, true);

        // Add new mappedSlug to the mappedSlugs.
        const mappedSlug = { slug: draggableItem.data };
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
    
    ngOnInit() {
        this.loadAvailableSlugs();
        this.loadSlugsDataview();
        this.loadPagesOptions();
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
        this.dialogService.openDefaultDialog(new PepDialogData({
            title: this.translate.instant('MANAGE_SLUG.SAVED_DIALOG_TITLE'),
            content: this.translate.instant('MANAGE_SLUG.SAVED_DIALOG_CONTENT')
        })).afterClosed().subscribe(value => {
            // TODO: Save the current dataview.

            this.goBack();
        });
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
