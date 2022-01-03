import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export class ISlug {
    name: string = '';
    description: string = '';
    pageType: string = '';
    slugURL: string = '';
}

@Component({
    selector: 'add-slug',
    templateUrl: './add-slug.component.html',
    styleUrls: ['./add-slug.component.scss']
})

@Injectable()
export class AddSlugComponent implements OnInit {
    
    @Input() slug: ISlug = new ISlug();
    @Input() pageTypes: Array<string> = [];

    public isModified: boolean = false;

    constructor(private dialogRef: MatDialogRef<AddSlugComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
       
    }
    ngOnInit(): void {
        this.isModified = this.data?.slug != null ? true : false;
        this.slug = this.data?.slug || new ISlug();
    }

    close(event){
        this.dialogRef?.close();
    }

    createSlug(event){
        this.dialogRef?.close(this.data.slug);
    }

}