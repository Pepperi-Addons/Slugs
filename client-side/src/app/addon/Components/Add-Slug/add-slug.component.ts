import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AddonService } from 'src/app/services/addon.service';
import { ISlugData } from '../../addon.model';

@Component({
    selector: 'add-slug',
    templateUrl: './add-slug.component.html',
    styleUrls: ['./add-slug.component.scss']
})

@Injectable()
export class AddSlugComponent implements OnInit {
    
    @Input() slug: ISlugData;
    @Input() pageTypes: Array<string> = [];

    public isModified: boolean = false;
    public dlgHeader: string = '';
    public validateMsg: string = '';

    constructor(private addonService: AddonService, 
                private translate: TranslateService ,
                private dialogRef: MatDialogRef<AddSlugComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        
    }

    getEmptySlug(): ISlugData {
        return {
            Key: '',
            Name: '',
            Description: '',
            Slug: ''
        }
    }

    ngOnInit(): void {
        
        this.isModified = this.data?.slug?.Key ? true : false;
        this.dlgHeader = this.isModified ? this.translate.instant("ADD_SLUG.EDIT_SLUG") : this.translate.instant("ADD_SLUG.CREATE_NEW_TITLE");
        
        this.slug = this.data?.slug || { };
    }

    close(event){
        this.dialogRef?.close();
    }

    checkSlugValidation(event){
       
        this.validateMsg = '';
        if( !event || event === ''){
            this.validateMsg = this.translate.instant("VALIDATION.EMPTY_SLUG") ;
        }
        if( this.hasWhiteSpace(event)){
            this.validateMsg = this.translate.instant("VALIDATION.WHITE_SPACES_MSG") ;
        }
        else if( this.hasUpperCase(event)){
            this.validateMsg = this.translate.instant("VALIDATION.UPPER_CASE_MSG") ;
        }
        if(this.validateMsg !== ''){
            return false;
        }

        return true;
    }

    async createSlug(event) {
        if(this.checkSlugValidation(this.data.slug.Slug)){
            const res = await this.addonService.upsertSlug(this.data.slug, false);
            if(res.success){
                this.dialogRef?.close(true);
            }
            else{
                this.validateMsg = res.message;
            }
        }
    }

    hasWhiteSpace(str) {
        return /\s/g.test(str);
    }

    hasUpperCase(str: string = ''){
        return str.toLowerCase() != str;
    }

}