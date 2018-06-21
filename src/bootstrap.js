'use strict';

require('dotenv').config({ silent: true });

const Rx = require('rxjs');
const jsonfile = require('jsonfile');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const sitemapper = new (require('sitemapper'));
const Utilities = require('./Utilities/Utilities');

if (! fs.existsSync(process.env.PWD + process.env.FOLDER_DATA)) fs.mkdirSync(process.env.PWD + process.env.FOLDER_DATA);
if (! fs.existsSync(process.env.PWD + process.env.FOLDER_CSV)) fs.mkdirSync(process.env.PWD + process.env.FOLDER_CSV);

// GET SITEMAPS
Rx.Observable.defer(() => sitemapper.fetch(process.env.SITEMAP_LINK))
.map(res => res.sites.map(page => page.replace(/https?:[\/]{2}\S*?\/(\S*)/, '/$1')))
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)(process.env.PWD + process.env.FOLDER_DATA + '/sitemap.json', res, {spaces: 2}))
.flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)(process.env.PWD + process.env.FOLDER_DATA + '/sitemap.json', { encoding: 'utf8' }))
.flatMap(sitemap => Utilities.getAnalytics(), Utilities.compareRowsToSitemap)
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)(process.env.PWD + process.env.FOLDER_DATA + '/result.json', res, {spaces: 2}))
.flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)(process.env.PWD + process.env.FOLDER_DATA + '/result.json', { encoding: 'utf8' }))
.flatMap(input => {

    if (input.not_indexed.length) {
        fs.writeFileSync(process.env.PWD + process.env.FOLDER_CSV + '/not_indexed.csv', json2csv(input.not_indexed.map(x => ({
            not_indexed: x
        })), ['not_indexed']));
    }
    
    if (input.not_performed.length) {
        fs.writeFileSync(process.env.PWD + process.env.FOLDER_CSV + '/not_performed.csv', json2csv(input.not_performed.map(x => ({
            not_performed: x.page
        })), ['not_performed']));
    }
    
    if (input.best.length) {
        fs.writeFileSync(process.env.PWD + process.env.FOLDER_CSV + '/best.csv', json2csv(input.best.map(x => ({
            best: x.page
        })), ['best']));
    }

    return Rx.Observable.of('Finished');
})
.subscribe(console.log, console.log)