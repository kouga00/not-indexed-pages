'use strict';

require('dotenv').config({ silent: true });

const xml2js = new (require('xml2js')).Parser();
const gaApi = require('ga-api');
const Rx = require('rxjs');
const jsonfile = require('jsonfile');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const sitemapper = new (require('sitemapper'));
const utilities = require('./utilities');

const getAnalytics = () => {

    const gaApiArgs = {
        clientId: process.env.CLIENT_ID,
        email: process.env.EMAIL,
        key: __dirname + process.env.KEY,
        ids: process.env.IDS,
        startDate: process.env.START_DATE,
        endDate: process.env.END_DATE,
        dimensions: process.env.DIMENSION,
        metrics: process.env.METRICS,
        filters: process.env.FILTERS
    };

    const RxGaApi = Rx.Observable.bindNodeCallback(gaApi);

    //GET ANALYTICS
    return RxGaApi(gaApiArgs)
    .expand(x => 
        x.rows ?
        RxGaApi(Object.assign({}, {startIndex: x.query['start-index'] + 1000}, gaApiArgs)) :
        Rx.Observable.empty()
    )
    .filter(x => x && x.rows)
    .flatMap(utilities.transform)
    .toArray()
    .flatMap(utilities.getUniquePages)
    .toArray()
    .flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/analytics.json', res, {spaces: 2}))
    .flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)('./data/analytics.json', { encoding: 'utf8' }))
}

// GET SITEMAPS
Rx.Observable.defer(() => sitemapper.fetch(process.env.SITEMAP_LINK))
.map(res => res.sites.map(page => page.replace(/https?:[\/]{2}\S*?\/(\S*)/, '/$1')))
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/sitemap.json', res, {spaces: 2}))
.flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)('./data/sitemap.json', { encoding: 'utf8' }))
// .do(console.log)
.flatMap(sitemap => getAnalytics(), utilities.compareRowsToSitemap)
.flatMap(res => Rx.Observable.bindNodeCallback(jsonfile.writeFile)('./data/result.json', res, {spaces: 2}))
.flatMap(() => Rx.Observable.bindNodeCallback(jsonfile.readFile)('./data/result.json', { encoding: 'utf8' }))
.flatMap(input => {

    if (input.not_indexed.length) {
        fs.writeFileSync('./data/csv/not_indexed.csv', json2csv(input.not_indexed.map(x => ({
            not_indexed: x
        })), ['not_indexed']));
    }
    
    if (input.not_performed.length) {
        fs.writeFileSync('./data/csv/not_performed.csv', json2csv(input.not_performed.map(x => ({
            not_performed: x.page
        })), ['not_performed']));
    }
    
    if (input.best.length) {
        fs.writeFileSync('./data/csv/best.csv', json2csv(input.best.map(x => ({
            best: x.page
        })), ['best']));
    }

    return Rx.Observable.of('Finished');
})
.subscribe(console.log, console.log)