import { Injectable } from '@angular/core';
import * as $ from 'jquery';
import Promise from "ts-promise";
import * as Constants from './constants';
import * as pnp from '../../node_modules/sp-pnp-js/dist/pnp.min';

declare var _spPageContextInfo: any;
declare var SP: any;

@Injectable({
    providedIn: 'root'
})

export class Utils {
    public LoadedScripts = [];

    getUrlParameters(name: string, url?: string ) {
        var regexS, regex, results;
        if (!url) url = location.href;
        name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
        regexS = '[\\?&]' + name + '=([^&#]*)';
        regex = new RegExp(regexS);
        results = regex.exec(url);
        return results === null ? null : decodeURIComponent(results[1]);
    }

    // public uploadFile(ctx: SP.ClientContext, folderName: string, fileName: any, file: any): any {
    //     return new Promise((resolve, reject) => {
    //         // you can adjust this number to control what size files are uploaded in chunks
    //         if (file.size <= 10485760) {
    //             pnp.sp.web.getFolderByServerRelativeUrl(folderName)
    //                 .files
    //                 .add(file.name, file, true).then(data => {
    //                     resolve(data)
    //                 }, err => {
    //                     reject(err)
    //                 });
    //         } else {
    //             // large upload
    //             pnp.sp.web.getFolderByServerRelativeUrl(folderName).files.addChunked(file.name, file, data => {

    //             }, true).then(data => {
    //                 resolve(data)
    //             }, err => { reject(err) });
    //         }
    //     });
    // }

    public clientLog(data) {
        if (typeof console === "undefined") {
            return;
        }
        if (arguments.length > 0) {
            console.log(arguments);
        }
    }

    public loadScript(scriptName: string) {
        let classContext = this;
        return new Promise((resolve, reject) => {
            let scriptbase = _spPageContextInfo.siteAbsoluteUrl + "/_layouts/15/";
            scriptName = scriptName.toLowerCase();
            if ($("script[src*='" + scriptName + "']").length === 0 && $.inArray(scriptName, this.LoadedScripts) === -1) {
                $.getScript(scriptbase + scriptName, () => {
                    classContext.LoadedScripts.push(scriptName);
                    return resolve(scriptName);
                });
            }
            else {
                return resolve(scriptName);
            }
        });
    }

    public tryParseJSON(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return false;
        }
    }

    getAttachments(item) {
        return new Promise((resolve, reject) => {
            item.attachmentFiles.get().then(files => {
                resolve({
                    id: item.id,
                    files: files
                });
            }, error => {
                reject(error);
            });
        });
    }

    setAttachmentByItemID(item, files) {
        return new Promise((resolve, reject) => {
            this.buildFileArray(files).then((filesInfo: any) => {
                item.attachmentFiles.addMultiple(filesInfo).then((r: any) => {
                    this.getAttachments(item).then(files => {
                        resolve(files);
                    });
                }, error => {
                    reject(error);
                });
            })
        })
    }

    deletAttachments(item, files: string[]) {
        return new Promise((resolve, reject) => {
            item.attachmentFiles.deleteMultiple(files.toString()).then(r => {
                resolve(r)
            }, error => {
                reject(error);
            });
        });
    }

    deletAttachment(item, files: string) {
        return new Promise((resolve, reject) => {
            item.attachmentFiles.deleteMultiple(files).then(r => {
                resolve(true)
            }, error => {
                reject(error);
            });
        });
    }

    buildFileArray(files) {
        return new Promise((resolve, reject) => {
            var fileInfos = [];
            var counter = 0;
            for (var i = 0; i < files.length; i++) {
                var toUpload = files[i];
                var r = new FileReader();
                r.onloadend = function (e: any) {
                    counter++;
                    var fileContent = e.target.result;
                    fileInfos.push({
                        name: files[counter - 1].name,
                        content: fileContent
                    })
                    if (files.length == counter) {
                        resolve(fileInfos);
                    }
                }
                r.readAsArrayBuffer(toUpload);
            }
        });
    }

}